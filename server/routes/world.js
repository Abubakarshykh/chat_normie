import express from 'express';
import { getNormies, getNormie, getWorldFeed, getWorldStats } from '../engine/worldEngine.js';
import { getNormieRelationships } from '../engine/relationshipEngine.js';

const router = express.Router();

// GET /api/world/normies
router.get('/normies', (req, res) => {
  const normies = getNormies().map(n => ({
    id: n.id,
    name: n.name,
    avatar: n.avatar,
    color: n.color,
    archetype: n.archetype,
    traits: n.traits,
    mood: n.mood,
    stats: n.stats,
    reputation: n.reputation,
    interests: n.interests,
    shortTermMemory: n.memory.shortTerm.slice(0, 3),
    relationshipCount: Object.keys(n.relationships).length,
    // NFT fields
    tokenId: n.tokenId ?? null,
    nftName: n.nftName || null,
    imageUrl: n.imageUrl || null,
  }));
  res.json({ normies });
});

// GET /api/world/normies/:id
router.get('/normies/:id', (req, res) => {
  const normie = getNormie(req.params.id);
  if (!normie) return res.status(404).json({ error: 'Normie not found' });

  const allNormies = getNormies();
  const relationships = getNormieRelationships(normie, allNormies);

  res.json({
    ...normie,
    relationships,
    // ensure NFT fields are always present even if still loading
    tokenId: normie.tokenId ?? null,
    nftName: normie.nftName || null,
    nftTraits: normie.nftTraits || [],
    imageUrl: normie.imageUrl || null,
    agentPersona: normie.agentPersona || null,
  });
});

// GET /api/world/feed
router.get('/feed', (req, res) => {
  const limit = parseInt(req.query.limit || '30');
  const feed = getWorldFeed().slice(0, limit);
  res.json({ feed, total: feed.length });
});

// GET /api/world/stats
router.get('/stats', (req, res) => {
  res.json(getWorldStats());
});

// GET /api/world/leaderboard
router.get('/leaderboard', (req, res) => {
  const normies = getNormies()
    .map(n => ({
      id: n.id,
      name: n.name,
      avatar: n.avatar,
      color: n.color,
      archetype: n.archetype,
      reputation: n.reputation,
      mood: n.mood,
      stats: n.stats,
      traits: n.traits,
      friends: Object.values(n.relationships).filter(r => r.type === 'friend' || r.type === 'best_friend').length,
      enemies: Object.values(n.relationships).filter(r => r.type === 'enemy' || r.type === 'rival').length,
      // NFT fields
      tokenId: n.tokenId ?? null,
      nftName: n.nftName || null,
      imageUrl: n.imageUrl || null,
    }))
    .sort((a, b) => b.reputation - a.reputation);
  res.json({ leaderboard: normies });
});

export default router;
