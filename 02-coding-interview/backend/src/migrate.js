#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Connect as admin (usually postgres user can create databases)
const adminPool = new Pool({
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST ,
  port: process.env.DB_PORT ,
  database: process.env.ADMIN_DB_NAME , // Connect to default postgres DB first
});

const dbName = process.env.DB_NAME || 'codecollab';

async function migrate() {
  try {
    console.log(`🚀 Starting migration for database: ${dbName}`);
    
    // Check if database exists
    const existsResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (existsResult.rows.length === 0) {
      console.log(`📦 Creating database: ${dbName}`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database created`);
    } else {
      console.log(`✅ Database already exists`);
    }
    
    // Close admin connection
    await adminPool.end();
    
    // Now connect to the app database and run schema
    const appPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: dbName,
    });
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log(`📋 Running schema from ${schemaPath}`);
    
    // Execute schema
    await appPool.query(schema);
    
    console.log(`✅ Schema applied successfully`);
    
    // Verify tables exist
    const tablesResult = await appPool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    
    console.log(`📊 Tables created:`, tablesResult.rows.map(r => r.table_name).join(', '));
    
    await appPool.end();
    
    console.log(`✨ Migration completed successfully!\n`);
    console.log(`Database URL: postgresql://${process.env.DB_USER || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${dbName}`);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
