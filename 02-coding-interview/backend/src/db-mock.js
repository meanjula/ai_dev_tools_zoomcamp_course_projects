const { randomUUID } = require('crypto');

// Simple in-memory stores
const users = new Map();
const sessions = new Map();

const USER_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DEFAULT_CODE = {
  javascript: `console.log('Hello from CodeCollab (JS)');`,
  typescript: `console.log('Hello from CodeCollab (TS)');`,
  python: `print('Hello from CodeCollab (Python)')`,
  html: `<!doctype html><html><body><h1>CodeCollab</h1></body></html>`,
  css: `body { font-family: sans-serif; }`,
  json: JSON.stringify({ name: 'CodeCollab' }, null, 2),
};

function nowISO() {
  return new Date().toISOString();
}

// Users
function createUser({ name }) {
  const id = randomUUID();
  const user = { id, name, color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)], createdAt: nowISO() };
  users.set(id, user);
  return user;
}

function getUser(id) {
  return users.get(id) || null;
}

function updateUser(id, { name }) {
  const u = users.get(id);
  if (!u) return null;
  if (typeof name === 'string') u.name = name;
  users.set(id, u);
  return u;
}

// Sessions
function createSession({ name, language, userId }) {
  const user = getUser(userId);
  if (!user) throw new Error('User not found');
  const id = randomUUID();
  const session = {
    id,
    name,
    language,
    code: DEFAULT_CODE[language] || '',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    owner: user,
    participants: [user],
    isActive: true,
  };
  sessions.set(id, session);
  return session;
}

function listSessions({ limit = 10, offset = 0 } = {}) {
  const all = Array.from(sessions.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { sessions: all.slice(offset, offset + limit), total: all.length, limit, offset };
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(id, { name, language }) {
  const s = sessions.get(id);
  if (!s) return null;
  if (typeof name === 'string') s.name = name;
  if (typeof language === 'string' && language !== s.language) {
    s.language = language;
    s.code = DEFAULT_CODE[language] || s.code;
  }
  s.updatedAt = nowISO();
  sessions.set(id, s);
  return s;
}

function deleteSession(id) {
  return sessions.delete(id);
}

function joinSession(sessionId, userId) {
  const s = sessions.get(sessionId);
  const u = users.get(userId);
  if (!s) throw new Error('Session not found');
  if (!u) throw new Error('User not found');
  if (s.participants.find(p => p.id === userId)) return s;
  s.participants.push(u);
  s.updatedAt = nowISO();
  sessions.set(sessionId, s);
  return s;
}

function leaveSession(sessionId, userId) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('Session not found');
  s.participants = s.participants.filter(p => p.id !== userId);
  s.updatedAt = nowISO();
  sessions.set(sessionId, s);
  return true;
}

function getSessionCode(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return { code: s.code, language: s.language, lastModified: s.updatedAt };
}

function updateSessionCode(sessionId, code, userId) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('Session not found');
  s.code = code;
  s.updatedAt = nowISO();
  sessions.set(sessionId, s);
  return { code: s.code, lastModified: s.updatedAt };
}

function changeSessionLanguage(sessionId, language) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('Session not found');
  s.language = language;
  s.code = DEFAULT_CODE[language] || s.code;
  s.updatedAt = nowISO();
  sessions.set(sessionId, s);
  return { language: s.language, code: s.code };
}

function getParticipants(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return { participants: s.participants, count: s.participants.length };
}

function updatePresence(sessionId, userId, { cursor, selection } = {}) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('Session not found');
  const p = s.participants.find(p => p.id === userId);
  if (!p) throw new Error('Participant not found');
  if (cursor) p.cursor = cursor;
  // selection is not currently stored on participant object in this mock
  s.updatedAt = nowISO();
  sessions.set(sessionId, s);
  return true;
}

// Execution helpers (simple, synchronous for JS/TS; mock for others)
function executeCode(code, language, timeout = 5000) {
  const start = Date.now();
  try {
    if (language === 'javascript' || language === 'typescript') {
      const logs = [];
      const mockConsole = {
        log: (...args) => logs.push(args.map(String).join(' ')),
        error: (...args) => logs.push(`Error: ${args.map(String).join(' ')}`),
        warn: (...args) => logs.push(`Warning: ${args.map(String).join(' ')}`),
      };
      const fn = new Function('console', code);
      fn(mockConsole);
      return { output: logs.join('\n') || '(No output)', executionTime: Date.now() - start };
    }
    // Mock for other languages
    return { output: `[Mock execution for ${language}]`, executionTime: Date.now() - start };
  } catch (err) {
    return { output: '', error: err instanceof Error ? err.message : 'Unknown error', executionTime: Date.now() - start };
  }
}

function batchExecute(executions = []) {
  const results = executions.map(exec => ({ id: exec.id, result: executeCode(exec.code, exec.language) }));
  return { results };
}

module.exports = {
  // users
  createUser,
  getUser,
  updateUser,
  // sessions
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
  getSessionCode,
  updateSessionCode,
  changeSessionLanguage,
  getParticipants,
  updatePresence,
  // execution
  executeCode,
  batchExecute,
};
