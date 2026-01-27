import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION || 'postgres://localhost:5432/code_explainer';

const pool = new Pool({ connectionString: DATABASE_URL });

export async function initDB() {
  const schemaPath = path.resolve(new URL(import.meta.url).pathname, './schema.sql');
  let schema;
  try {
    schema = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    // fallback to project relative
    schema = fs.readFileSync(path.resolve(process.cwd(), 'backend/db/schema.sql'), 'utf8');
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
