import { generateNormieToNormieMessage, generateNormieReply, generateWorldPost } from './aiEngine.js';
import { updateRelationship } from './relationshipEngine.js';
import { triggerDramaEvent } from './dramaEngine.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../data/normies.json');
const WORLD_STATE_PATH = join(__dirname, '../data/worldState.json');

let normies = [];
let worldFeed = []; // last 100 events
let simulationInterval = null;
let io = null;
let tickCount = 0;
let totalNormieSupply = null; // fetched from /history/stats

const INTERACTION_ACTIONS = ['chat', 'react', 'post', 'drama'];
const ACTION_WEIGHTS = [40, 25, 20, 15]; // % chance for each

const NFT_API = 'https://api.normies.art';

function weightedAction() {
  const total = ACTION_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < INTERACTION_ACTIONS.length; i++) {
    r -= ACTION_WEIGHTS[i];
    if (r <= 0) return INTERACTION_ACTIONS[i];
  }
  return 'chat';
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDifferent(arr) {
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * (arr.length - 1));
  if (j >= i) j++;
  return [arr[i], arr[j]];
}

/**
 * Returns display name for feed events: "Zara Vex (Normie #7337)"
 */
function displayName(normie) {
  if (normie.tokenId != null) return `${normie.name} (Normie #${normie.tokenId})`;
  return normie.name;
}

/**
 * Build the minimal feed-safe snapshot of a normie (includes imageUrl)
 */
function normieFeedSnapshot(normie) {
  return {
    id: normie.id,
    name: displayName(normie),
    avatar: normie.avatar,
    color: normie.color,
    imageUrl: normie.imageUrl || null,
  };
}

/**
 * Fetch NFT metadata + image URL + agent persona for one normie at startup.
 * All data is cached on the normie object — never called again per tick.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, attempts = 5, delayMs = 200, timeoutMs = 3000) {
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
    } catch (e) {
      clearTimeout(timeoutId);
    }
    if (i < attempts - 1) await delay(delayMs);
  }
  return null;
}

// Updated fetchNFTDataForNormie to use fetchWithRetry
async function fetchNFTDataForNormie(normie) {
  const id = normie.tokenId;
  if (id == null) return;

  // 1. Metadata → nftName + nftTraits with retry
  try {
    const res = await fetchWithRetry(`${NFT_API}/normie/${id}/metadata`);
    if (res && res.ok) {
      const meta = await res.json();
      normie.nftName = meta.name || `Normie #${id}`;
      normie.nftTraits = meta.attributes || [];
    } else {
      normie.nftName = `Normie #${id}`;
      normie.nftTraits = [];
    }
  } catch (e) {
    console.warn(`[NFT] metadata failed for #${id}:`, e.message);
    normie.nftName = `Normie #${id}`;
    normie.nftTraits = [];
  }

  // 2. Image URL – static, no need to fetch
  normie.imageUrl = `${NFT_API}/normie/${id}/image.png`;

  // 3. Agent persona with retry
  try {
    const res = await fetchWithRetry(`${NFT_API}/agents/persona-preview/${id}`);
    if (res && res.ok) {
      normie.agentPersona = await res.json();
    } else {
      normie.agentPersona = null;
    }
  } catch (e) {
    console.warn(`[NFT] persona failed for #${id}:`, e.message);
    normie.agentPersona = null;
  }

  console.log(`[NFT] Loaded: ${normie.name} → ${normie.nftName}`);
}

/**
 * Fetch live Normie collection supply from /history/stats.
 * Called at startup and refreshed every hour.
 */
async function fetchWorldSupply() {
  try {
    const res = await fetchWithRetry(`${NFT_API}/history/stats`);
    if (res && res.ok) {
      const data = await res.json();
      totalNormieSupply = 10000 - (data.totalBurnedTokens || 0);
      console.log(`[NFT] World population: ${totalNormieSupply} Normies`);
    } else {
      console.warn('[NFT] Supply fetch failed: non‑OK response');
    }
  } catch (e) {
    console.warn('[NFT] Supply fetch error:', e.message);
  }
}


/**
 * Load normies from JSON file
 */
export function loadNormies() {
  try {
    if (!existsSync(DATA_PATH)) {
      const dataDir = dirname(DATA_PATH);
      if (!existsSync(dataDir)) {
        console.log(`[World] Creating missing data directory: ${dataDir}`);
        mkdirSync(dataDir, { recursive: true });
      }
      const backupPath = join(__dirname, '../default_data/normies.json');
      if (existsSync(backupPath)) {
        console.log(`[World] Initializing persistent data: copying default normies.json from backup`);
        copyFileSync(backupPath, DATA_PATH);
      } else {
        console.warn(`[World] Backup file not found at ${backupPath}! Cannot initialize data.`);
      }
      
      const backupWorldPath = join(__dirname, '../default_data/worldState.json');
      if (existsSync(backupWorldPath)) {
        console.log(`[World] Initializing persistent data: copying default worldState.json from backup`);
        copyFileSync(backupWorldPath, WORLD_STATE_PATH);
      }
    }

    const raw = readFileSync(DATA_PATH, 'utf-8');
    normies = JSON.parse(raw);
    console.log(`[World] Loaded ${normies.length} Normies`);
    return normies;
  } catch (e) {
    console.error('[World] Failed to load normies:', e.message);
    return [];
  }
}

/**
 * Save current world state to disk
 */
export function saveWorldState() {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(normies, null, 2), 'utf-8');
    writeFileSync(
      WORLD_STATE_PATH,
      JSON.stringify({ feed: worldFeed.slice(0, 50), savedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.error('[World] Save failed:', e.message);
  }
}

/**
 * Push a feed event to all clients via Socket.io
 */
function pushFeedEvent(event) {
  worldFeed.unshift(event);
  if (worldFeed.length > 100) worldFeed.pop();
  if (io) io.emit('feed-update', event);
}

/**
 * Add to a Normie's short-term memory (capped at 8 entries)
 */
function addMemory(normie, memory) {
  normie.memory.shortTerm.unshift(memory);
  if (normie.memory.shortTerm.length > 8) normie.memory.shortTerm.pop();
}

/**
 * Main simulation tick — runs every SIMULATION_INTERVAL_MS
 */
async function simulationTick() {
  tickCount++;
  console.log(`[World] Tick #${tickCount} — ${normies.length} Normies active`);

  const action = weightedAction();

  try {
    if (action === 'chat' || action === 'react') {
      const [sender, receiver] = pickTwoDifferent(normies);
      const rel = sender.relationships[receiver.id] || { type: 'neutral', score: 0 };
      const trigger = action === 'react' ? 'reaction to recent events' : 'random impulse';

      const senderMessage = await generateNormieToNormieMessage(sender, receiver, trigger, rel.type);
      const receiverReply = await generateNormieReply(receiver, sender, senderMessage, rel.type);

      addMemory(sender, `Talked to ${receiver.name}: "${senderMessage.slice(0, 60)}..."`);
      addMemory(receiver, `${sender.name} said: "${senderMessage.slice(0, 60)}...". Replied: "${receiverReply.slice(0, 40)}..."`);

      const sentiment = rel.score > 20 ? 'positive' : rel.score < -20 ? 'negative' : 'neutral';
      updateRelationship(sender, receiver, 'chat', sentiment);
      sender.mood = getMoodFromScore(sender.relationships[receiver.id].score);

      const event = {
        id: `evt_${Date.now()}`,
        type: 'conversation',
        sender: normieFeedSnapshot(sender),
        receiver: normieFeedSnapshot(receiver),
        senderMessage,
        receiverReply,
        relationshipType: rel.type,
        timestamp: new Date().toISOString(),
      };
      pushFeedEvent(event);

    } else if (action === 'post') {
      const normie = pickRandom(normies);
      const recentEvent = worldFeed[1];
      const context = recentEvent
        ? `Something just happened: ${recentEvent.type === 'conversation'
            ? `${recentEvent.sender?.name} and ${recentEvent.receiver?.name} had a conversation`
            : recentEvent.description || 'recent drama'}. React or post something on your mind.`
        : 'Post something on your mind to the world.';

      const postText = await generateWorldPost(normie, context);
      addMemory(normie, `Posted: "${postText.slice(0, 60)}..."`);

      const event = {
        id: `evt_${Date.now()}`,
        type: 'post',
        normie: normieFeedSnapshot(normie),
        content: postText,
        timestamp: new Date().toISOString(),
      };
      pushFeedEvent(event);

    } else if (action === 'drama') {
      const dramaEvent = await triggerDramaEvent(normies, tickCount % 3 === 0);

      // Enrich drama participants with imageUrl and displayName
      const n1 = normies.find(n => n.id === dramaEvent.normie1.id);
      const n2 = normies.find(n => n.id === dramaEvent.normie2.id);
      if (n1) {
        dramaEvent.normie1.name = displayName(n1);
        dramaEvent.normie1.imageUrl = n1.imageUrl || null;
        addMemory(n1, `Drama: ${dramaEvent.label} with ${n2 ? n2.name : dramaEvent.normie2.name}`);
      }
      if (n2) {
        dramaEvent.normie2.name = displayName(n2);
        dramaEvent.normie2.imageUrl = n2.imageUrl || null;
        addMemory(n2, `Drama: ${dramaEvent.label} with ${n1 ? n1.name : dramaEvent.normie1.name}`);
      }

      pushFeedEvent(dramaEvent);
      if (io) io.emit('drama-alert', dramaEvent);
    }

    if (tickCount % 5 === 0) saveWorldState();

  } catch (err) {
    console.error('[World] Tick error:', err.message);
  }
}

/**
 * Start the simulation loop — now async to await NFT data fetches
 */
export async function startSimulation(socketIO) {
  io = socketIO;
  normies = loadNormies();

  // Restore saved feed from disk
  if (existsSync(WORLD_STATE_PATH)) {
    try {
      const saved = JSON.parse(readFileSync(WORLD_STATE_PATH, 'utf-8'));
      worldFeed = saved.feed || [];
      console.log(`[World] Restored ${worldFeed.length} feed events`);
    } catch {}
  }

  // Fetch live world population supply in the background
  fetchWorldSupply().catch(e => console.warn('[NFT] Supply fetch error:', e.message));
  // Refresh supply once every hour
  setInterval(fetchWorldSupply, 60 * 60 * 1000);

  // Fetch NFT data for all 10 normies at startup in the background (non-blocking)
  (async () => {
    console.log('[NFT] Fetching NFT data for all Normies in the background...');
    for (const normie of normies) {
      try {
        await fetchNFTDataForNormie(normie);
      } catch (e) {
        console.warn(`[NFT] Error fetching data for ${normie.name}:`, e.message);
      }
      await new Promise(r => setTimeout(r, 300)); // polite delay between normies
    }
    console.log('[NFT] All Normie NFT data loaded and cached.');
  })();

  const interval = parseInt(process.env.SIMULATION_INTERVAL_MS || '600000');
  console.log(`[World] Starting simulation — tick every ${interval / 1000}s`);

  setTimeout(() => simulationTick(), 5000);
  simulationInterval = setInterval(simulationTick, interval);
}

export function stopSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  saveWorldState();
}

export function getNormies() { return normies; }
export function getNormie(id) { return normies.find(n => n.id === id); }
export function getWorldFeed() { return worldFeed.slice(0, 50); }

export function getWorldStats() {
  const topNormie = [...normies].sort((a, b) => b.reputation - a.reputation)[0];
  const totalInteractions = normies.reduce(
    (sum, n) => sum + Object.values(n.relationships).reduce((s, r) => s + (r.interactions || 0), 0),
    0
  );
  return {
    normieCount: normies.length,
    totalFeedEvents: worldFeed.length,
    totalInteractions: Math.floor(totalInteractions / 2),
    topNormie: topNormie
      ? {
          name: topNormie.name,
          avatar: topNormie.avatar,
          reputation: topNormie.reputation,
          imageUrl: topNormie.imageUrl || null,
        }
      : null,
    simulationTick: tickCount,
    totalNormieSupply, // live supply from NFT contract
  };
}

function getMoodFromScore(score) {
  if (score > 60) return 'happy';
  if (score > 30) return 'content';
  if (score > 0) return 'neutral';
  if (score > -30) return 'annoyed';
  if (score > -60) return 'hostile';
  return 'furious';
}

// God Mode controls
export async function godModeAction(action, params) {
  switch (action) {
    case 'trigger_drama': {
      const event = await triggerDramaEvent(normies, true, params.dramaType);
      pushFeedEvent(event);
      if (io) io.emit('drama-alert', event);
      return event;
    }
    case 'force_conversation': {
      const n1 = normies.find(n => n.id === params.normie1Id);
      const n2 = normies.find(n => n.id === params.normie2Id);
      if (!n1 || !n2) return { error: 'Normie not found' };
      const rel = n1.relationships[n2.id] || { type: 'neutral', score: 0 };
      const msg = await generateNormieToNormieMessage(n1, n2, 'god mode forced', rel.type);
      const reply = await generateNormieReply(n2, n1, msg, rel.type);
      updateRelationship(n1, n2, 'chat', 'neutral');
      const event = {
        id: `evt_${Date.now()}`,
        type: 'conversation',
        forced: true,
        sender: normieFeedSnapshot(n1),
        receiver: normieFeedSnapshot(n2),
        senderMessage: msg,
        receiverReply: reply,
        relationshipType: rel.type,
        timestamp: new Date().toISOString(),
      };
      pushFeedEvent(event);
      return event;
    }
    case 'change_mood': {
      const normie = normies.find(n => n.id === params.normieId);
      if (!normie) return { error: 'Normie not found' };
      normie.mood = params.mood;
      if (io) io.emit('normie-update', { id: normie.id, mood: normie.mood });
      return { success: true, normie: normie.name, mood: params.mood };
    }
    case 'boost_reputation': {
      const normie = normies.find(n => n.id === params.normieId);
      if (!normie) return { error: 'Normie not found' };
      normie.reputation = Math.min(1000, normie.reputation + (params.amount || 100));
      if (io) io.emit('normie-update', { id: normie.id, reputation: normie.reputation });
      return { success: true };
    }
    case 'fast_tick': {
      await simulationTick();
      return { success: true, tick: tickCount };
    }
    default:
      return { error: 'Unknown action' };
  }
}
