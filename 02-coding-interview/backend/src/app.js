require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');

const app = express();
app.use(helmet());
const FRONTEND_URL = (process.env.FRONTEND_URL || '*').replace(/\/$/, '');
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Users
app.post('/api/users', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
  try {
    const user = await db.createUser({ name });
    res.status(201).json(user);
  } catch (err) {
    console.error('POST /api/users error:', err);
    // Send minimal error message but log full error server-side for debugging
    res.status(500).json({ error: err && err.message ? err.message : 'internal_error' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await db.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:userId', async (req, res) => {
  try {
    const updated = await db.updateUser(req.params.userId, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions
app.post('/api/sessions', async (req, res) => {
  const { name, language, userId } = req.body;
  if (!name || !language || !userId) return res.status(400).json({ error: 'name, language and userId are required' });
  try {
    const session = await db.createSession({ name, language, userId });
    res.status(201).json(session);
  } catch (err) {
    if (err.message.includes('User not found') || err.message.includes('foreign key')) return res.status(400).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const data = await db.listSessions({ limit, offset });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const s = await db.getSession(req.params.sessionId);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/sessions/:sessionId', async (req, res) => {
  try {
    const updated = await db.updateSession(req.params.sessionId, req.body);
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const deleted = await db.deleteSession(req.params.sessionId);
    if (!deleted) return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/join', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const s = await db.joinSession(req.params.sessionId, userId);
    res.json(s);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    if (err.message.includes('User not found')) return res.status(400).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/leave', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    await db.leaveSession(req.params.sessionId, userId);
    res.status(204).send();
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

// Code
app.get('/api/sessions/:sessionId/code', async (req, res) => {
  try {
    const code = await db.getSessionCode(req.params.sessionId);
    if (!code) return res.status(404).json({ error: 'Session not found' });
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:sessionId/code', async (req, res) => {
  const { code, userId } = req.body;
  if (typeof code !== 'string') return res.status(400).json({ error: 'code is required' });
  try {
    const updated = await db.updateSessionCode(req.params.sessionId, code, userId);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:sessionId/language', async (req, res) => {
  const { language } = req.body;
  if (!language) return res.status(400).json({ error: 'language required' });
  try {
    const updated = await db.changeSessionLanguage(req.params.sessionId, language);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:sessionId/participants', async (req, res) => {
  try {
    const data = await db.getParticipants(req.params.sessionId);
    if (!data) return res.status(404).json({ error: 'Session not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/presence', async (req, res) => {
  const { userId, cursor, selection } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    await db.updatePresence(req.params.sessionId, userId, { cursor, selection });
    res.status(204).send();
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    if (err.message.includes('Participant not found')) return res.status(404).json({ error: 'Participant not found' });
    res.status(500).json({ error: err.message });
  }
});

// Execution endpoints
app.post('/api/execute', async (req, res) => {
  const { code, language, timeout } = req.body;
  if (typeof code !== 'string' || !language) return res.status(400).json({ error: 'code and language required' });
  try {
    const result = await db.executeCode(code, language, timeout);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/execute/batch', async (req, res) => {
  const { executions } = req.body;
  if (!Array.isArray(executions)) return res.status(400).json({ error: 'executions array required' });
  try {
    const results = await db.batchExecute(executions);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export for tests
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API server listening on port ${port}`));
}

module.exports = app;
