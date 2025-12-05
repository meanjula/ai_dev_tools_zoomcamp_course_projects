const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Users
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
  try {
    const user = db.createUser({ name });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId', (req, res) => {
  const user = db.getUser(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.patch('/api/users/:userId', (req, res) => {
  try {
    const updated = db.updateUser(req.params.userId, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions
app.post('/api/sessions', (req, res) => {
  const { name, language, ownerId } = req.body;
  if (!name || !language || !ownerId) return res.status(400).json({ error: 'name, language and ownerId are required' });
  try {
    const session = db.createSession({ name, language, ownerId });
    res.status(201).json(session);
  } catch (err) {
    if (err.message.includes('Owner not found')) return res.status(400).json({ error: 'Owner not found' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const data = db.listSessions({ limit, offset });
  res.json(data);
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const s = db.getSession(req.params.sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  res.json(s);
});

app.patch('/api/sessions/:sessionId', (req, res) => {
  try {
    const updated = db.updateSession(req.params.sessionId, req.body);
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  const deleted = db.deleteSession(req.params.sessionId);
  if (!deleted) return res.status(404).json({ error: 'Session not found' });
  res.status(204).send();
});

app.post('/api/sessions/:sessionId/join', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const s = db.joinSession(req.params.sessionId, userId);
    res.json(s);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    if (err.message.includes('User not found')) return res.status(400).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/leave', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    db.leaveSession(req.params.sessionId, userId);
    res.status(204).send();
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

// Code
app.get('/api/sessions/:sessionId/code', (req, res) => {
  const code = db.getSessionCode(req.params.sessionId);
  if (!code) return res.status(404).json({ error: 'Session not found' });
  res.json(code);
});

app.put('/api/sessions/:sessionId/code', (req, res) => {
  const { code, userId } = req.body;
  if (typeof code !== 'string') return res.status(400).json({ error: 'code is required' });
  try {
    const updated = db.updateSessionCode(req.params.sessionId, code, userId);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:sessionId/language', (req, res) => {
  const { language } = req.body;
  if (!language) return res.status(400).json({ error: 'language required' });
  try {
    const updated = db.changeSessionLanguage(req.params.sessionId, language);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:sessionId/participants', (req, res) => {
  const data = db.getParticipants(req.params.sessionId);
  if (!data) return res.status(404).json({ error: 'Session not found' });
  res.json(data);
});

app.post('/api/sessions/:sessionId/presence', (req, res) => {
  const { userId, cursor, selection } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    db.updatePresence(req.params.sessionId, userId, { cursor, selection });
    res.status(204).send();
  } catch (err) {
    if (err.message.includes('Session not found')) return res.status(404).json({ error: 'Session not found' });
    if (err.message.includes('Participant not found')) return res.status(404).json({ error: 'Participant not found' });
    res.status(500).json({ error: err.message });
  }
});

// Execution endpoints
app.post('/api/execute', (req, res) => {
  const { code, language, timeout } = req.body;
  if (typeof code !== 'string' || !language) return res.status(400).json({ error: 'code and language required' });
  try {
    const result = db.executeCode(code, language, timeout);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/execute/batch', (req, res) => {
  const { executions } = req.body;
  if (!Array.isArray(executions)) return res.status(400).json({ error: 'executions array required' });
  try {
    const results = db.batchExecute(executions);
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
