#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');

function readPassword() {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (process.env.DB_PASSWORD_FILE) {
    try {
      return fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim();
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
}

async function tryConnect(opts) {
  const client = new Client(opts);
  try {
    await client.connect();
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function wait() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'postgres';
  const database = process.env.ADMIN_DB_NAME || 'postgres';
  const password = readPassword();

  const maxRetries = 60; // ~60s
  const delayMs = 1000;

  for (let i = 0; i < maxRetries; i++) {
    const ok = await tryConnect({ host, port, user, database, password });
    if (ok) {
      console.log(`Postgres is available (${host}:${port})`);
      process.exit(0);
    }
    console.log(`Waiting for Postgres at ${host}:${port} (${i + 1}/${maxRetries})...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  console.error('Timed out waiting for Postgres');
  process.exit(1);
}

wait();
