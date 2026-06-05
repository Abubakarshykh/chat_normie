/**
 * Relationship Engine — tracks bonds between all Normies
 */

export const RELATIONSHIP_TYPES = {
  NEUTRAL: 'neutral',
  FRIEND: 'friend',
  BEST_FRIEND: 'best_friend',
  RIVAL: 'rival',
  ENEMY: 'enemy',
  CRUSH: 'crush',
  MENTOR: 'mentor',
  ALLY: 'ally',
};

/**
 * Initialize relationships for all Normies (all start neutral)
 */
export function initRelationships(normies) {
  normies.forEach(n => {
    normies.forEach(other => {
      if (n.id !== other.id && !n.relationships[other.id]) {
        n.relationships[other.id] = {
          type: RELATIONSHIP_TYPES.NEUTRAL,
          score: 0, // -100 to +100
          interactions: 0,
          history: [],
        };
      }
    });
  });
}

/**
 * Update relationship after an interaction
 */
export function updateRelationship(normieA, normieB, interactionType, sentiment = 'neutral') {
  if (!normieA.relationships[normieB.id]) {
    normieA.relationships[normieB.id] = { type: RELATIONSHIP_TYPES.NEUTRAL, score: 0, interactions: 0, history: [] };
  }
  if (!normieB.relationships[normieA.id]) {
    normieB.relationships[normieA.id] = { type: RELATIONSHIP_TYPES.NEUTRAL, score: 0, interactions: 0, history: [] };
  }

  const scoreDeltas = {
    chat: { positive: 8, neutral: 2, negative: -5 },
    fight: { positive: -20, neutral: -10, negative: -25 },
    collaborate: { positive: 15, neutral: 10, negative: 5 },
    compliment: { positive: 12, neutral: 8, negative: 3 },
    insult: { positive: -15, neutral: -10, negative: -20 },
    defend: { positive: 18, neutral: 12, negative: 8 },
    betray: { positive: -30, neutral: -25, negative: -35 },
  };

  const delta = scoreDeltas[interactionType]?.[sentiment] ?? 2;

  // Update both directions (reciprocal but not symmetric)
  const aRel = normieA.relationships[normieB.id];
  const bRel = normieB.relationships[normieA.id];

  aRel.score = Math.max(-100, Math.min(100, aRel.score + delta));
  bRel.score = Math.max(-100, Math.min(100, bRel.score + Math.floor(delta * 0.7)));
  aRel.interactions++;
  bRel.interactions++;

  // Record history (keep last 10)
  const timestamp = new Date().toISOString();
  aRel.history.unshift({ type: interactionType, sentiment, timestamp });
  bRel.history.unshift({ type: interactionType, sentiment, timestamp });
  if (aRel.history.length > 10) aRel.history.pop();
  if (bRel.history.length > 10) bRel.history.pop();

  // Resolve relationship type from score
  aRel.type = scoreToRelationshipType(aRel.score, normieA, normieB);
  bRel.type = scoreToRelationshipType(bRel.score, normieB, normieA);

  return { aScore: aRel.score, bScore: bRel.score, aType: aRel.type, bType: bRel.type };
}

function scoreToRelationshipType(score, normieA, normieB) {
  // Special cases based on archetypes
  const isMentor = normieA.archetype === 'The Veteran' && score > 40;
  if (isMentor) return RELATIONSHIP_TYPES.MENTOR;

  if (score >= 80) return RELATIONSHIP_TYPES.BEST_FRIEND;
  if (score >= 50) return RELATIONSHIP_TYPES.FRIEND;
  if (score >= 30) return RELATIONSHIP_TYPES.ALLY;
  if (score >= 10) return RELATIONSHIP_TYPES.CRUSH;
  if (score >= -10) return RELATIONSHIP_TYPES.NEUTRAL;
  if (score >= -50) return RELATIONSHIP_TYPES.RIVAL;
  return RELATIONSHIP_TYPES.ENEMY;
}

/**
 * Get the most interesting relationship pairs (for drama)
 */
export function getRelationshipPairs(normies) {
  const pairs = [];
  for (let i = 0; i < normies.length; i++) {
    for (let j = i + 1; j < normies.length; j++) {
      const a = normies[i];
      const b = normies[j];
      const rel = a.relationships[b.id];
      if (rel) {
        pairs.push({
          normieA: a,
          normieB: b,
          relationship: rel,
          score: Math.abs(rel.score), // absolute score = more drama potential
        });
      }
    }
  }
  return pairs.sort((a, b) => b.score - a.score);
}

/**
 * Get all relationships for a single Normie (for frontend display)
 */
export function getNormieRelationships(normie, allNormies) {
  return Object.entries(normie.relationships).map(([otherId, rel]) => {
    const other = allNormies.find(n => n.id === otherId);
    return {
      normie: other ? { id: other.id, name: other.name, avatar: other.avatar, color: other.color } : null,
      type: rel.type,
      score: rel.score,
      interactions: rel.interactions,
    };
  }).filter(r => r.normie !== null);
}
