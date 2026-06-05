import express from 'express';
import { generateChatResponse } from '../engine/aiEngine.js';
import { getNormie, getNormies } from '../engine/worldEngine.js';
import { updateRelationship } from '../engine/relationshipEngine.js';

const router = express.Router();

// In-memory chat sessions: { normieId: [{ role, content }] }
const chatSessions = {};

// POST /api/chat/:normieId
router.post('/:normieId', async (req, res) => {
  const { normieId } = req.params;
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const normie = getNormie(normieId);
  if (!normie) {
    return res.status(404).json({ error: 'Normie not found' });
  }

  const key = `${sessionId || 'default'}_${normieId}`;
  if (!chatSessions[key]) chatSessions[key] = [];

  // Build relationship context
  const normies = getNormies();
  const relContext = Object.entries(normie.relationships)
    .filter(([_, rel]) => rel.type !== 'neutral' && rel.interactions > 2)
    .slice(0, 3)
    .map(([id, rel]) => {
      const other = normies.find(n => n.id === id);
      return other ? `${normie.name} sees ${other.name} as a ${rel.type}` : '';
    })
    .filter(Boolean)
    .join('. ');

  try {
    const reply = await generateChatResponse(normie, message, chatSessions[key], relContext);

    // Update session history
    chatSessions[key].push({ role: 'user', content: message });
    chatSessions[key].push({ role: 'model', content: reply });
    if (chatSessions[key].length > 20) chatSessions[key] = chatSessions[key].slice(-20);

    // Update normie memory
    normie.memory.shortTerm.unshift(`User asked: "${message.slice(0, 50)}". Replied.`);
    if (normie.memory.shortTerm.length > 8) normie.memory.shortTerm.pop();

    res.json({
      normieId,
      normieName: normie.name,
      normieAvatar: normie.avatar,
      reply,
      mood: normie.mood,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'AI error', details: err.message });
  }
});

// GET /api/chat/:normieId/history
router.get('/:normieId/history', (req, res) => {
  const { normieId } = req.params;
  const { sessionId } = req.query;
  const key = `${sessionId || 'default'}_${normieId}`;
  res.json({ history: chatSessions[key] || [] });
});

// DELETE /api/chat/:normieId/history
router.delete('/:normieId/history', (req, res) => {
  const { normieId } = req.params;
  const { sessionId } = req.query;
  const key = `${sessionId || 'default'}_${normieId}`;
  chatSessions[key] = [];
  res.json({ success: true });
});

export default router;
