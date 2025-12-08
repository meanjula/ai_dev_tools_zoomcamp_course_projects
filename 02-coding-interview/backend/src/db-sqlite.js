const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');

// SQLite database (file or :memory:)
class SQLiteDB {
  constructor(dbPath = ':memory:') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error:', err);
        process.exit(1);
      }
    });
    
    // Enable foreign keys in SQLite
    this.db.run('PRAGMA foreign_keys = ON');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async transaction(callback) {
    try {
      await this.run('BEGIN TRANSACTION');
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (err) {
      await this.run('ROLLBACK');
      throw err;
    }
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

const DEFAULT_CODE = {
  javascript: `console.log('Hello from CodeCollab (JS)');`,
  typescript: `console.log('Hello from CodeCollab (TS)');`,
  python: `print('Hello from CodeCollab (Python)')`,
  html: `<!doctype html><html><body><h1>CodeCollab</h1></body></html>`,
  css: `body { font-family: sans-serif; }`,
  json: JSON.stringify({ name: 'CodeCollab' }, null, 2),
};

const USER_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return dbInstance;
}

async function initializeDB(dbPath = ':memory:') {
  dbInstance = new SQLiteDB(dbPath);
  
  // Create schema
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_participants (
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      cursor_line INTEGER,
      cursor_column INTEGER,
      PRIMARY KEY(session_id, user_id),
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id TEXT,
      code TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions(owner_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_history_session_id ON execution_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_execution_history_user_id ON execution_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_history_executed_at ON execution_history(executed_at);
  `;

  // Split schema into individual statements and execute
  for (const statement of schema.split(';')) {
    const trimmed = statement.trim();
    if (trimmed) {
      await dbInstance.run(trimmed);
    }
  }

  return dbInstance;
}

// Users
async function createUser({ name }) {
  const db = getDB();
  const id = uuidv4();
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  
  await db.run(
    'INSERT INTO users (id, name, color) VALUES (?, ?, ?)',
    [id, name, color]
  );
  
  return db.get('SELECT id, name, color, created_at FROM users WHERE id = ?', [id]);
}

async function getUser(id) {
  const db = getDB();
  return db.get('SELECT id, name, color, created_at FROM users WHERE id = ?', [id]);
}

async function updateUser(id, { name }) {
  const db = getDB();
  if (!name) return null;
  
  await db.run('UPDATE users SET name = ? WHERE id = ?', [name, id]);
  return db.get('SELECT id, name, color, created_at FROM users WHERE id = ?', [id]);
}

// Sessions
async function createSession({ name, language, userId }) {
  const db = getDB();
  const id = uuidv4();
  const code = DEFAULT_CODE[language] || '';

  return db.transaction(async () => {
    // Insert session
    await db.run(
      'INSERT INTO sessions (id, name, language, code, owner_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, language, code, userId]
    );
    
    // Add user as participant
    await db.run(
      'INSERT INTO session_participants (session_id, user_id) VALUES (?, ?)',
      [id, userId]
    );
    
    return getSession(id);
  });
}

async function listSessions({ limit = 10, offset = 0 } = {}) {
  const db = getDB();
  
  const countResult = await db.get('SELECT COUNT(*) as count FROM sessions');
  const total = countResult.count;
  
  const rows = await db.all(
    `SELECT s.id, s.name, s.language, s.code, s.owner_id, s.is_active, s.created_at, s.updated_at, u.id as owner_id, u.name as owner_name, u.color as owner_color, u.created_at as owner_created_at
     FROM sessions s
     JOIN users u ON s.owner_id = u.id
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  
  // Build owner object and fetch participants
  const sessions = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: row.name,
      language: row.language,
      code: row.code,
      owner_id: row.owner_id,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      owner: {
        id: row.owner_id,
        name: row.owner_name,
        color: row.owner_color,
        created_at: row.owner_created_at,
      },
      participants: await getParticipantsArray(row.id),
    }))
  );
  
  return { sessions, total, limit, offset };
}

async function getSession(id) {
  const db = getDB();
  
  const row = await db.get(
    `SELECT s.id, s.name, s.language, s.code, s.owner_id, s.is_active, s.created_at, s.updated_at, u.id as owner_id, u.name as owner_name, u.color as owner_color, u.created_at as owner_created_at
     FROM sessions s
     JOIN users u ON s.owner_id = u.id
     WHERE s.id = ?`,
    [id]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    code: row.code,
    owner_id: row.owner_id,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      color: row.owner_color,
      created_at: row.owner_created_at,
    },
    participants: await getParticipantsArray(id),
  };
}

async function getParticipantsArray(sessionId) {
  const db = getDB();
  
  const rows = await db.all(
    `SELECT u.id, u.name, u.color, u.created_at, sp.cursor_line, sp.cursor_column
     FROM session_participants sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.session_id = ?`,
    [sessionId]
  );
  
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    ...(row.cursor_line && row.cursor_column && { cursor: { line: row.cursor_line, column: row.cursor_column } }),
  }));
}

async function updateSession(id, { name, language }) {
  const db = getDB();
  
  let updates = [];
  let params = [];
  
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  
  if (language) {
    updates.push('language = ?');
    params.push(language);
    updates.push('code = ?');
    params.push(DEFAULT_CODE[language] || '');
  }
  
  if (updates.length === 0) return null;
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  await db.run(
    `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getSession(id);
}

async function deleteSession(id) {
  const db = getDB();
  const result = await db.run('DELETE FROM sessions WHERE id = ?', [id]);
  return result.changes > 0;
}

async function joinSession(sessionId, userId) {
  const db = getDB();
  
  return db.transaction(async () => {
    // Check if already participant
    const existing = await db.get(
      'SELECT 1 FROM session_participants WHERE session_id = ? AND user_id = ?',
      [sessionId, userId]
    );
    
    if (!existing) {
      await db.run(
        'INSERT INTO session_participants (session_id, user_id) VALUES (?, ?)',
        [sessionId, userId]
      );
    }
    
    return getSession(sessionId);
  });
}

async function leaveSession(sessionId, userId) {
  const db = getDB();
  await db.run(
    'DELETE FROM session_participants WHERE session_id = ? AND user_id = ?',
    [sessionId, userId]
  );
  return true;
}

async function getSessionCode(sessionId) {
  const db = getDB();
  const row = await db.get(
    'SELECT code, language, updated_at FROM sessions WHERE id = ?',
    [sessionId]
  );
  
  if (!row) return null;
  return { code: row.code, language: row.language, lastModified: row.updated_at };
}

async function updateSessionCode(sessionId, code, userId) {
  const db = getDB();
  
  const result = await db.get(
    'UPDATE sessions SET code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING code, updated_at',
    [code, sessionId]
  );
  
  if (!result) throw new Error('Session not found');
  
  // Log execution for audit (optional)
  if (userId) {
    await db.run(
      'INSERT INTO execution_history (session_id, user_id, code) VALUES (?, ?, ?)',
      [sessionId, userId, code]
    ).catch(() => {}); // Silently fail if not critical
  }
  
  return { code: result.code, lastModified: result.updated_at };
}

async function changeSessionLanguage(sessionId, language) {
  const db = getDB();
  
  const result = await db.get(
    'UPDATE sessions SET language = ?, code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING language, code',
    [language, DEFAULT_CODE[language] || '', sessionId]
  );
  
  if (!result) throw new Error('Session not found');
  return { language: result.language, code: result.code };
}

async function getParticipants(sessionId) {
  const db = getDB();
  
  const countResult = await db.get(
    'SELECT COUNT(*) as count FROM session_participants WHERE session_id = ?',
    [sessionId]
  );
  
  if (!countResult) return null;
  
  const participants = await getParticipantsArray(sessionId);
  return { participants, count: countResult.count };
}

async function updatePresence(sessionId, userId, { cursor, selection } = {}) {
  const db = getDB();
  
  let updates = [];
  let params = [];
  
  if (cursor) {
    updates.push('cursor_line = ?');
    params.push(cursor.line);
    updates.push('cursor_column = ?');
    params.push(cursor.column);
  }
  
  if (updates.length === 0) return true;
  
  params.push(sessionId);
  params.push(userId);
  
  await db.run(
    `UPDATE session_participants SET ${updates.join(', ')} WHERE session_id = ? AND user_id = ?`,
    params
  );
  
  return true;
}

// Execution (mock for non-JS/TS)
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
    return { output: `[Mock execution for ${language}]`, executionTime: Date.now() - start };
  } catch (err) {
    return { output: '', error: err instanceof Error ? err.message : 'Unknown error', executionTime: Date.now() - start };
  }
}

function batchExecute(executions = []) {
  const results = executions.map((exec) => ({ id: exec.id, result: executeCode(exec.code, exec.language) }));
  return { results };
}

module.exports = {
  // Database initialization
  initializeDB,
  getDB,
  
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
