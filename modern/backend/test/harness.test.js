import { describe, it, expect, afterAll } from 'vitest';
import { resetTestDb } from './helpers.js';

describe('test database harness', () => {
  it('refuses to reset a database whose name does not contain "test"', async () => {
    await expect(resetTestDb('postgresql://localhost:5432/postgres')).rejects.toThrow(/refus/i);
    await expect(resetTestDb('postgresql://localhost:5432/foodhub')).rejects.toThrow(/refus/i);
  });

  it('rebuilds the test database from sql/schema.sql and seed.sql', async () => {
    const pool = await resetTestDb();
    afterAll(() => pool.end());
    const { rows: [dishes] } = await pool.query('SELECT COUNT(*) AS n FROM menu_items');
    const { rows: [orders] } = await pool.query('SELECT COUNT(*) AS n FROM orders');
    const { rows: [db] } = await pool.query('SELECT current_database() AS name');
    expect(db.name).toMatch(/test/i);
    expect(dishes.n).toBe(20);
    expect(orders.n).toBe(15);
  });

  it('keeps the id counters past the seeded ids', async () => {
    const pool = await resetTestDb();
    afterAll(() => pool.end());
    const { rows: [user] } = await pool.query("SELECT user_id FROM users WHERE email = 'aisha@example.com'");
    const { rows: [order] } = await pool.query(
      "INSERT INTO orders (user_id, delivery_address, contact_phone, total_amount) VALUES ($1, 'x', '91234567', 1) RETURNING order_id",
      [user.user_id],
    );
    expect(order.order_id).toBe(16);
  });
});
