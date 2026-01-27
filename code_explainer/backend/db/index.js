import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION || 'postgres://localhost:5432/code_explainer';

// Support optional SSL for remote Postgres providers (e.g., Render) via env var or host detection
const useSsl = process.env.DATABASE_SSL === 'true' || /render\.com/.test(DATABASE_URL || '');
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

// Log a short, non-sensitive DB connection summary to help debugging (host, db, SSL)
try {
  const parsed = new URL(DATABASE_URL);
  console.log(`DB connection -> host=${parsed.hostname} db=${parsed.pathname.replace('/', '')} ssl=${!!useSsl}`);
} catch (e) {
  console.log(`DB connection -> using connection string (unable to parse) ssl=${!!useSsl}`);
}

export async function initDB() {
  // Resolve schema path relative to this file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  let schema;
  try {
    schema = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    // fallback: project-relative db/schema.sql
    schema = fs.readFileSync(path.resolve(process.cwd(), 'db/schema.sql'), 'utf8');
  }

  // Run the schema using a client
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize DB schema', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export { pool };
