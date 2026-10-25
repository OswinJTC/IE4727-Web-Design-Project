import mysql from 'mysql2/promise';
import { config } from './config.js';

// One pool per process. DECIMAL columns come back as numbers, not strings.
export function createPool(db = config.db) {
  return mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    charset: 'utf8mb4',
    decimalNumbers: true,
    connectionLimit: 10,
  });
}
