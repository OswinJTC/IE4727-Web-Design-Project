import { describe, it, expect, afterAll } from 'vitest';
import { resetTestDb } from './helpers.js';

describe('test database harness', () => {
  it('refuses to touch the live foodhub database', async () => {
    await expect(resetTestDb('foodhub')).rejects.toThrow(/refus/i);
  });

  it('rebuilds foodhub_test from the PHP schema and seed', async () => {
    const pool = await resetTestDb();
    afterAll(() => pool.end());
    const [[dishes]] = await pool.query('SELECT COUNT(*) AS n FROM menu_items');
    const [[orders]] = await pool.query('SELECT COUNT(*) AS n FROM orders');
    const [[db]] = await pool.query('SELECT DATABASE() AS name');
    expect(db.name).toBe('foodhub_test');
    expect(dishes.n).toBe(20);
    expect(orders.n).toBe(15);
  });
});
