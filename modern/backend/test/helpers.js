import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import request from 'supertest';
import { config } from '../src/config.js';
import { createPool } from '../src/db.js';

const SQL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../sql');

// Integration checks can use a fresh schema on Supabase without changing existing schemas or orders.
export async function createIsolatedTestDb(url) {
  const schema = `foodhub_test_${randomUUID().replaceAll('-', '')}`;
  const owner = new pg.Client({ connectionString: url });
  await owner.connect();
  let pool;
  const cleanup = async () => {
    await pool?.end();
    try {
      await owner.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    } finally {
      await owner.end();
    }
  };
  try {
    await owner.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 4 });
    for (const file of ['schema.sql', 'seed.sql'])
      await pool.query(readFileSync(path.join(SQL_DIR, file), 'utf8'));
    return { pool, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

// Wipe a test database and rebuild it from sql/schema.sql + seed.sql. vitest.config.js points DATABASE_URL at
// TEST_DATABASE_URL, and a database whose name does not contain "test" is refused, so live data is never wiped.
export async function resetTestDb(url = config.databaseUrl) {
  if (!url)
    throw new Error(
      'TEST_DATABASE_URL is not set in .env (tests need their own empty Postgres database, e.g. foodhub_test)',
    );
  const dbName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/test/i.test(dbName))
    throw new Error(`Refusing to reset database "${dbName}": its name must contain "test"`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    for (const file of ['schema.sql', 'seed.sql'])
      await client.query(readFileSync(path.join(SQL_DIR, file), 'utf8'));
  } finally {
    await client.end();
  }
  return createPool(url);
}

// supertest agent that keeps cookies, optionally logged in as a seeded user (password Password123)
export async function loginAgent(app, email, password = 'Password123') {
  const agent = request.agent(app);
  if (email) await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}
