import pg from 'pg';
import { config } from './config.js';

// NUMERIC (prices) and BIGINT (SUM/COUNT) come back as strings by default; the API wants numbers
pg.types.setTypeParser(1700, parseFloat);
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

// One pool per process
export function createPool(url = config.databaseUrl) {
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env and paste the Supabase connection string.');
  const pool = new pg.Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 10000 });
  // An idle connection dropped by the server must not crash the process
  pool.on('error', (err) => console.error('Idle database connection error:', err.message));
  return pool;
}
