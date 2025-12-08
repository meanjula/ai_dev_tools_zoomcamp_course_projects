const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'anjula',
  password: process.env.DB_PASSWORD || 'timsina',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'codecollab',
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const DEFAULT_CODE = {
  javascript: `console.log('Hello from CodeCollab (JS)');`,
  typescript: `console.log('Hello from CodeCollab (TS)');`,
  python: `print('Hello from CodeCollab (Python)')`,
  html: `<!doctype html><html><body><h1>CodeCollab</h1></body></html>`,
  css: `body { font-family: sans-serif; }`,
  json: JSON.stringify({ name: 'CodeCollab' }, null, 2),
};

const USER_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Users
async function createUser({ name }) {
  const id = uuidv4();
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  const result = await pool.query(
    'INSERT INTO users (id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color, created_at',
    [id, name, color]
  );
  return result.rows[0];
}

async function getUser(id) {
  const result = await pool.query('SELECT id, name, color, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateUser(id, { name }) {
  if (!name) return null;
  const result = await pool.query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, color, created_at',
    [name, id]
  );
  return result.rows[0] || null;
}

// Sessions
async function createSession({ name, language, userId }) {
  const id = uuidv4();
  const code = DEFAULT_CODE[language] || '';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert session
    await client.query(
      'INSERT INTO sessions (id, name, language, code, owner_id) VALUES ($1, $2, $3, $4, $5)',
      [id, name, language, code, userId]
    );
    
    // Add user as participant
    await client.query(
      'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );
    
    await client.query('COMMIT');
    
    // Fetch and return full session
    return getSession(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listSessions({ limit = 10, offset = 0 } = {}) {
  const countResult = await pool.query('SELECT COUNT(*) FROM sessions');
  const total = parseInt(countResult.rows[0].count, 10);
  
  const result = await pool.query(
    `SELECT s.id, s.name, s.language, s.code, s.owner_id, s.is_active, s.created_at, s.updated_at,
            json_build_object('id', u.id, 'name', u.name, 'color', u.color, 'created_at', u.created_at) as owner
     FROM sessions s
     JOIN users u ON s.owner_id = u.id
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  // Fetch participants for each session
  const sessions = await Promise.all(
    result.rows.map(async (session) => ({
      ...session,
      participants: await getParticipantsArray(session.id),
    }))
  );
  
  return { sessions, total, limit, offset };
}

async function getSession(id) {
  const result = await pool.query(
    `SELECT s.id, s.name, s.language, s.code, s.owner_id, s.is_active, s.created_at, s.updated_at,
            json_build_object('id', u.id, 'name', u.name, 'color', u.color, 'created_at', u.created_at) as owner
     FROM sessions s
     JOIN users u ON s.owner_id = u.id
     WHERE s.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  
  const session = result.rows[0];
  session.participants = await getParticipantsArray(id);
  return session;
}

async function getParticipantsArray(sessionId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.color, u.created_at, sp.cursor_line, sp.cursor_column
     FROM session_participants sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.session_id = $1`,
    [sessionId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    ...(row.cursor_line && row.cursor_column && { cursor: { line: row.cursor_line, column: row.cursor_column } }),
  }));
}

async function updateSession(id, { name, language }) {
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (name) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  
  if (language) {
    updates.push(`language = $${paramCount++}`);
    values.push(language);
    // Reset code to template when changing language
    updates.push(`code = $${paramCount++}`);
    values.push(DEFAULT_CODE[language] || '');
  }
  
  if (updates.length === 0) return null;
  
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const result = await pool.query(
    `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) return null;
  return getSession(id);
}

async function deleteSession(id) {
  const result = await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function joinSession(sessionId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if already participant
    const existing = await client.query(
      'SELECT 1 FROM session_participants WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2)',
        [sessionId, userId]
      );
    }
    
    await client.query('COMMIT');
    return getSession(sessionId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function leaveSession(sessionId, userId) {
  await pool.query(
    'DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  return true;
}

async function getSessionCode(sessionId) {
  const result = await pool.query(
    'SELECT code, language, updated_at FROM sessions WHERE id = $1',
    [sessionId]
  );
  if (result.rows.length === 0) return null;
  return { code: result.rows[0].code, language: result.rows[0].language, lastModified: result.rows[0].updated_at };
}

async function updateSessionCode(sessionId, code, userId) {
  const result = await pool.query(
    'UPDATE sessions SET code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING code, updated_at',
    [code, sessionId]
  );
  if (result.rows.length === 0) throw new Error('Session not found');
  
  // Log execution for audit (optional)
  if (userId) {
    await pool.query(
      'INSERT INTO execution_history (session_id, user_id, code) VALUES ($1, $2, $3)',
      [sessionId, userId, code]
    ).catch(() => {}); // Silently fail if history table not critical
  }
  
  return { code: result.rows[0].code, lastModified: result.rows[0].updated_at };
}

async function changeSessionLanguage(sessionId, language) {
  const result = await pool.query(
    'UPDATE sessions SET language = $1, code = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING language, code',
    [language, DEFAULT_CODE[language] || '', sessionId]
  );
  if (result.rows.length === 0) throw new Error('Session not found');
  return { language: result.rows[0].language, code: result.rows[0].code };
}

async function getParticipants(sessionId) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM session_participants WHERE session_id = $1',
    [sessionId]
  );
  if (result.rows.length === 0) return null;
  
  const participants = await getParticipantsArray(sessionId);
  return { participants, count: parseInt(result.rows[0].count, 10) };
}

async function updatePresence(sessionId, userId, { cursor, selection } = {}) {
  const updates = [];
  const values = [sessionId, userId];
  
  if (cursor) {
    updates.push('cursor_line = $3, cursor_column = $4');
    values.push(cursor.line, cursor.column);
  }
  
  if (updates.length === 0) return true;
  
  await pool.query(
    `UPDATE session_participants SET ${updates.join(', ')} WHERE session_id = $1 AND user_id = $2`,
    values
  );
  return true;
}

// Execution (mock for non-JS/TS)
function executeCode(code, language, timeout = 5000) {
  const start = Date.now();
  if (language === 'javascript' || language === 'typescript') {
    try {
      // Remove TypeScript type annotations for TypeScript code
      let jsCode = code;
      if (language === 'typescript') {
        // Remove type annotations: `: type` patterns
        jsCode = code
          .replace(/:\s*string\b/g, '')
          .replace(/:\s*number\b/g, '')
          .replace(/:\s*boolean\b/g, '')
          .replace(/:\s*any\b/g, '')
          .replace(/:\s*void\b/g, '')
          .replace(/:\s*\w+(\[\])?/g, '') // Generic types
          .replace(/as\s+\w+/g, ''); // Remove 'as' type casts
      }
      
      const logs = [];
      const mockConsole = {
        log: (...args) => logs.push(args.map(String).join(' ')),
        error: (...args) => logs.push(`Error: ${args.map(String).join(' ')}`),
        warn: (...args) => logs.push(`Warning: ${args.map(String).join(' ')}`),
      };
      const fn = new Function('console', jsCode);
      fn(mockConsole);
      return { output: logs.join('\n') || '(No output)', executionTime: Date.now() - start };
    } catch (err) {
      return { output: '', error: err instanceof Error ? err.message : 'Unknown error', executionTime: Date.now() - start };
    }
  }
  if (language === 'python') {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const tmp = require('os').tmpdir();
    const filename = `${tmp}/codecollab_${Date.now()}.py`;
    try {
      fs.writeFileSync(filename, code, { encoding: 'utf8' });
      const output = execSync(`python3 \"${filename}\"`, { timeout, encoding: 'utf8' });
      fs.unlinkSync(filename);
      return { output: output.trim(), executionTime: Date.now() - start };
    } catch (err) {
      if (fs.existsSync(filename)) fs.unlinkSync(filename);
      return { output: '', error: err.stderr ? err.stderr.toString() : err.message, executionTime: Date.now() - start };
    }
  }
  if (language === 'html') {
    // Return the HTML as-is (could use jsdom for advanced rendering)
    return { output: code, executionTime: Date.now() - start };
  }
  if (language === 'css') {
    try {
      // Use a CSS parser for validation (optional)
      // For now, just return the CSS as-is
      return { output: code, executionTime: Date.now() - start };
    } catch (err) {
      return { output: '', error: err.message, executionTime: Date.now() - start };
    }
  }
  if (language === 'json') {
    try {
      const parsed = JSON.parse(code);
      return { output: JSON.stringify(parsed, null, 2), executionTime: Date.now() - start };
    } catch (err) {
      return { output: '', error: 'Invalid JSON: ' + err.message, executionTime: Date.now() - start };
    }
  }
  return { output: `[Mock execution for ${language}]`, executionTime: Date.now() - start };
}

function batchExecute(executions = []) {
  const results = executions.map((exec) => ({ id: exec.id, result: executeCode(exec.code, exec.language) }));
  return { results };
}

module.exports = {
  pool,
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
