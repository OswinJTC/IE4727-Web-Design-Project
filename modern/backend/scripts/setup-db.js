// Creates the tables and loads the sample data in the database DATABASE_URL points to (Supabase).
// Safe to re-run: it only creates what is missing and never drops anything.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../src/config.js';

const SQL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../sql');
const skipSeed = process.argv.includes('--schema-only');

if (!config.databaseUrl) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and paste the Supabase connection string.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();
try {
  for (const file of skipSeed ? ['schema.sql'] : ['schema.sql', 'seed.sql']) {
    await client.query(readFileSync(path.join(SQL_DIR, file), 'utf8'));
    console.log(`Ran ${file}`);
  }
  const { rows: [n] } = await client.query('SELECT (SELECT COUNT(*) FROM menu_items) AS dishes, (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM orders) AS orders');
  console.log(`Database has ${n.dishes} dishes, ${n.users} users, ${n.orders} orders.`);
} finally {
  await client.end();
}
