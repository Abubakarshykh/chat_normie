import express from 'express';
import { godModeAction } from '../engine/worldEngine.js';
import { DRAMA_TYPES } from '../engine/dramaEngine.js';

const router = express.Router();

// GET /api/god/drama-types — list all drama types
router.get('/drama-types', (req, res) => {
  res.json({ dramaTypes: DRAMA_TYPES.map(d => ({ type: d.type, label: d.label })) });
});

// POST /api/god/trigger-drama
router.post('/trigger-drama', async (req, res) => {
  try {
    const { dramaType } = req.body;
    const result = await godModeAction('trigger_drama', { dramaType });
    res.json({ success: true, event: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/god/force-conversation
router.post('/force-conversation', async (req, res) => {
  try {
    const { normie1Id, normie2Id } = req.body;
    if (!normie1Id || !normie2Id) return res.status(400).json({ error: 'Both normie IDs required' });
    const result = await godModeAction('force_conversation', { normie1Id, normie2Id });
    res.json({ success: true, event: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/god/change-mood
router.post('/change-mood', async (req, res) => {
  try {
    const { normieId, mood } = req.body;
    if (!normieId || !mood) return res.status(400).json({ error: 'normieId and mood required' });
    const result = await godModeAction('change_mood', { normieId, mood });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/god/boost-reputation
router.post('/boost-reputation', async (req, res) => {
  try {
    const { normieId, amount } = req.body;
    const result = await godModeAction('boost_reputation', { normieId, amount });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/god/fast-tick — force one simulation tick immediately
router.post('/fast-tick', async (req, res) => {
  try {
    const result = await godModeAction('fast_tick', {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/god/change-normie — swap a Normie's NFT identity
router.post('/change-normie', async (req, res) => {
  try {
    const { normieId, tokenId } = req.body;
    if (!normieId || tokenId == null) return res.status(400).json({ error: 'normieId and tokenId required' });
    const result = await godModeAction('change_normie', { normieId, tokenId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
