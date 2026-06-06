import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { startSimulation, stopSimulation } from './engine/worldEngine.js';
import chatRouter from './routes/chat.js';
import worldRouter from './routes/world.js';
import godRouter from './routes/god.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3002';
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/world', worldRouter);
app.use('/api/god', godRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', time: new Date().toISOString(), simulation: 'running' });
});

// ── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🌍 Normie Life Simulator Server`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Client URL: ${CLIENT_URL}`);
  console.log(`   Simulation: starting...\n`);
  startSimulation(io);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[World] Shutting down — saving state...');
  stopSimulation();
  process.exit(0);
});
