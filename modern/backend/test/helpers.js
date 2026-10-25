import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { config } from '../src/config.js';
import { createPool } from '../src/db.js';

const SQL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../traditional/sql');

// Drop and rebuild the throwaway database from the PHP schema + seed. Never the live foodhub.
export async function resetTestDb(name = config.db.database) {
  if (name === 'foodhub') throw new Error('Refusing to reset the live foodhub database');
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Bad database name: ${name}`);

  const { database, ...server } = config.db;
  const conn = await mysql.createConnection({ ...server, multipleStatements: true });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
    for (const file of ['schema.sql', 'seed.sql']) {
      const sql = readFileSync(path.join(SQL_DIR, file), 'utf8')
        .replace(/^(CREATE DATABASE IF NOT EXISTS |USE )foodhub\b/gm, `$1${name}`);
      await conn.query(sql);
    }
  } finally {
    await conn.end();
  }
  return createPool({ ...config.db, database: name });
}

// supertest agent that keeps cookies, optionally logged in as a seeded user (password Password123)
export async function loginAgent(app, email, password = 'Password123') {
  const agent = request.agent(app);
  if (email) await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}
