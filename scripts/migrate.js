#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const dir   = path.join(__dirname, '../backend/db/migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    for (const f of files) {
      console.log(`[migrate] ${f}...`);
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      console.log(`[migrate] ✅ ${f}`);
    }
  } finally { client.release(); await pool.end(); }
}

migrate().catch((e) => { console.error('[migrate] ❌', e.message); process.exit(1); });
