import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

/**
 * Build the on-chain persona section from agentPersona (if available)
 */
function buildPersonaSection(normie) {
  const p = normie.agentPersona;
  if (!p) return '';

  const lines = [];
  if (p.backstory) lines.push(`ON-CHAIN BACKSTORY: ${p.backstory}`);
  if (p.tagline) lines.push(`TAGLINE: "${p.tagline}"`);
  if (p.communicationStyle) lines.push(`COMMUNICATION STYLE: ${p.communicationStyle}`);
  if (p.quirks && Array.isArray(p.quirks) && p.quirks.length > 0) {
    lines.push(`QUIRKS: ${p.quirks.join(', ')}`);
  }
  if (p.personalityTraits && Array.isArray(p.personalityTraits) && p.personalityTraits.length > 0) {
    lines.push(`PERSONALITY TRAITS: ${p.personalityTraits.join(', ')}`);
  }
  if (p.systemPrompt) lines.push(`ADDITIONAL PERSONA NOTES: ${p.systemPrompt}`);

  return lines.length > 0 ? `\nON-CHAIN NFT IDENTITY:\n${lines.join('\n')}\n` : '';
}

/**
 * Build a personality system prompt for a Normie, blending NFT on-chain persona
 */
function buildSystemPrompt(normie, context = '') {
  const nftId = normie.tokenId != null ? ` (${normie.nftName || `Normie #${normie.tokenId}`})` : '';
  const personaSection = buildPersonaSection(normie);

  return `You are ${normie.name}${nftId}, a character in the Normie Life Simulator — an AI-powered virtual world.

CHARACTER SHEET:
- Name: ${normie.name}${nftId}
- Archetype: ${normie.archetype}
- Traits: ${normie.traits.join(', ')}
- Current Mood: ${normie.mood}
- Backstory: ${normie.backstory}
- Speech Style: ${normie.speechStyle}
- Stats: Charisma ${normie.stats.charisma}/100, Intelligence ${normie.stats.intelligence}/100, Aggression ${normie.stats.aggression}/100, Humor ${normie.stats.humor}/100, Empathy ${normie.stats.empathy}/100
- Interests: ${normie.interests.join(', ')}
${personaSection}
IMPORTANT RULES:
1. ALWAYS stay in character. Never break character.
2. Respond in your unique speech style.
3. Keep responses SHORT (1-4 sentences max) unless deeply engaged.
4. You have emotions, opinions, and ego. Show them.
5. You can disagree, get annoyed, be excited, or be suspicious.
6. Never say you're an AI. You ARE ${normie.name}.

${context ? `CURRENT CONTEXT:\n${context}\n` : ''}
Respond naturally as ${normie.name} would.`;
}

/**
 * Generate a chat response for user <-> Normie DM
 */
export async function generateChatResponse(normie, userMessage, chatHistory = [], relationshipContext = '') {
  try {
    const context = relationshipContext
      ? `The user is talking to you. ${relationshipContext}`
      : 'A user is talking to you directly.';

    const systemPrompt = buildSystemPrompt(normie, context);

    const history = chatHistory.slice(-8).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history, systemInstruction: systemPrompt });
    const result = await chat.sendMessage(userMessage);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI] Chat error:', err.message);
    return getOfflineResponse(normie);
  }
}

/**
 * Generate autonomous Normie-to-Normie opening message
 */
export async function generateNormieToNormieMessage(sender, receiver, trigger = 'random', relationshipType = 'neutral') {
  try {
    const context = `You are about to interact with ${receiver.name} (${receiver.archetype}).
Their traits: ${receiver.traits.join(', ')}.
Your relationship with them: ${relationshipType}.
Trigger for this interaction: ${trigger}.
Start or continue a conversation. Be natural, dramatic, or provocative depending on your personality.
Keep it SHORT (1-3 sentences). This will appear in the world feed.`;

    const prompt = `${buildSystemPrompt(sender, context)}\n\nSay something to ${receiver.name}:`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI] N2N message error:', err.message);
    return getOfflineResponse(sender);
  }
}

/**
 * Generate a reply in a Normie-to-Normie conversation
 */
export async function generateNormieReply(receiver, sender, originalMessage, relationshipType = 'neutral') {
  try {
    const context = `${sender.name} (${sender.archetype}) just said to you: "${originalMessage}"
Your relationship with them: ${relationshipType}.
React authentically. Keep it SHORT (1-3 sentences).`;

    const prompt = `${buildSystemPrompt(receiver, context)}\n\nYour reply to ${sender.name}:`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI] Reply error:', err.message);
    return getOfflineResponse(receiver);
  }
}

/**
 * Generate a world feed post from a Normie
 */
export async function generateWorldPost(normie, eventContext = '') {
  try {
    const context = eventContext || `Something happened in the world that you have feelings about. Post your reaction.`;
    const prompt = `${buildSystemPrompt(normie, context)}\n\nPost to the world feed (1-2 sentences, in your voice):`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI] World post error:', err.message);
    return getOfflineResponse(normie);
  }
}

/**
 * Generate a drama event description
 */
export async function generateDramaEvent(normie1, normie2, dramaType) {
  try {
    const prompt = `You are the narrator of the Normie Life Simulator.
Generate a dramatic world event between ${normie1.name} (${normie1.archetype}, traits: ${normie1.traits.join(', ')})
and ${normie2.name} (${normie2.archetype}, traits: ${normie2.traits.join(', ')}).
Drama type: ${dramaType}
Write 1-2 vivid sentences describing what happened, like a dramatic news headline. Be specific and entertaining.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI] Drama event error:', err.message);
    return `${normie1.name} and ${normie2.name} had a ${dramaType} in the simulation!`;
  }
}

/**
 * Offline fallback responses per archetype (used when Gemini API is unavailable)
 */
function getOfflineResponse(normie) {
  const fallbacks = {
    'The Rebel':    ["Not now.", "I'm busy breaking things.", "...whatever."],
    'The Genius':   ["Insufficient data to respond.", "I'll calculate a response later.", "Your query is noted."],
    'The Mystic':   ["The stars are quiet today...", "Some things resist words.", "Ask me again when the moon shifts."],
    'The Hustler':  ["Let's circle back on that.", "I'm working on something big.", "Good question — let me think on the ROI."],
    'The Glitch':   ["ERROR: vibes miscalibrated.", "404: mood not found.", "Have you tried turning me off and on again?"],
    'The Shadow':   ["...", "I heard you.", "That's interesting information."],
    'The Optimist': ["Every moment is a fresh start!", "I believe things will work out!", "That's wonderful!"],
    'The Anarchist':["Nothing matters anyway.", "Burn it down.", "Your systems are all broken."],
    'The Star':     ["Nova is unavailable for comment right now.", "My publicist will handle this.", "Ugh, NOT the time."],
    'The Veteran':  ["I've seen worse.", "Give it time.", "Nothing new under the sun."],
  };
  const arr = fallbacks[normie.archetype] || ["..."];
  return arr[Math.floor(Math.random() * arr.length)];
}
