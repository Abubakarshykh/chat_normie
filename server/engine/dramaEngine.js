import { generateDramaEvent } from './aiEngine.js';
import { updateRelationship } from './relationshipEngine.js';

const DRAMA_TYPES = [
  { type: 'public_fight', label: '⚔️ Public Fight', interactionType: 'fight', sentiment: 'negative', weight: 20 },
  { type: 'scandal', label: '🔥 Scandal Exposed', interactionType: 'betray', sentiment: 'negative', weight: 15 },
  { type: 'alliance_formed', label: '🤝 Alliance Formed', interactionType: 'collaborate', sentiment: 'positive', weight: 18 },
  { type: 'rivalry_escalated', label: '💥 Rivalry Escalated', interactionType: 'fight', sentiment: 'negative', weight: 16 },
  { type: 'friendship_broken', label: '💔 Friendship Broken', interactionType: 'betray', sentiment: 'negative', weight: 14 },
  { type: 'secret_revealed', label: '👀 Secret Revealed', interactionType: 'insult', sentiment: 'negative', weight: 12 },
  { type: 'unexpected_team_up', label: '⚡ Unexpected Team-Up', interactionType: 'collaborate', sentiment: 'positive', weight: 13 },
  { type: 'public_apology', label: '🙏 Public Apology', interactionType: 'compliment', sentiment: 'positive', weight: 10 },
  { type: 'competition', label: '🏆 Competition Announced', interactionType: 'chat', sentiment: 'neutral', weight: 11 },
  { type: 'betrayal', label: '🗡️ Betrayal', interactionType: 'betray', sentiment: 'negative', weight: 9 },
];

function weightedRandomDrama() {
  const totalWeight = DRAMA_TYPES.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;
  for (const drama of DRAMA_TYPES) {
    random -= drama.weight;
    if (random <= 0) return drama;
  }
  return DRAMA_TYPES[0];
}

function pickTwoNormies(normies, preferHighTension = false) {
  const shuffled = [...normies].sort(() => Math.random() - 0.5);

  if (preferHighTension) {
    // Prefer pairs with existing strong positive or negative relationships
    let bestPair = null;
    let bestScore = -1;
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const rel = shuffled[i].relationships[shuffled[j].id];
        if (rel && Math.abs(rel.score) > bestScore) {
          bestScore = Math.abs(rel.score);
          bestPair = [shuffled[i], shuffled[j]];
        }
      }
    }
    if (bestPair) return bestPair;
  }

  return [shuffled[0], shuffled[1]];
}

/**
 * Generate a full drama event
 */
export async function triggerDramaEvent(normies, preferHighTension = false, forcedType = null) {
  const drama = forcedType
    ? DRAMA_TYPES.find(d => d.type === forcedType) || weightedRandomDrama()
    : weightedRandomDrama();

  const [normie1, normie2] = pickTwoNormies(normies, preferHighTension);

  // Generate AI description
  const description = await generateDramaEvent(normie1, normie2, drama.type.replace(/_/g, ' '));

  // Update relationships
  const relChange = updateRelationship(normie1, normie2, drama.interactionType, drama.sentiment);

  // Update reputation scores
  const repDelta = drama.sentiment === 'positive' ? 15 : drama.sentiment === 'negative' ? -10 : 5;
  normie1.reputation = Math.max(0, normie1.reputation + repDelta);
  normie2.reputation = Math.max(0, normie2.reputation + Math.floor(repDelta * 0.6));

  return {
    id: `drama_${Date.now()}`,
    type: 'drama',
    dramaType: drama.type,
    label: drama.label,
    description,
    normie1: { id: normie1.id, name: normie1.name, avatar: normie1.avatar, color: normie1.color },
    normie2: { id: normie2.id, name: normie2.name, avatar: normie2.avatar, color: normie2.color },
    relationshipChange: relChange,
    timestamp: new Date().toISOString(),
  };
}

export { DRAMA_TYPES };
