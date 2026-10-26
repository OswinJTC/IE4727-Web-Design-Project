import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { resetTestDb } from './helpers.js';

let pool;
let app;

beforeAll(async () => {
  pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'test' });
});
afterAll(() => pool.end());

describe('GET /api/dishes', () => {
  it('returns the 20 seeded dishes with numeric prices', async () => {
    const res = await request(app).get('/api/dishes').expect(200);
    expect(res.body).toHaveLength(20);
    const laksa = res.body.find((d) => d.name === 'Curry laksa');
    expect(laksa).toMatchObject({ category: 'Mains', price: 7.2 });
    expect(Object.keys(laksa).sort()).toEqual(['category', 'description', 'id', 'image', 'name', 'price']);
  });

  it('leaves out dishes that are not available', async () => {
    await pool.query("UPDATE menu_items SET is_available = FALSE WHERE name = 'Chendol'");
    const res = await request(app).get('/api/dishes').expect(200);
    expect(res.body).toHaveLength(19);
    expect(res.body.some((d) => d.name === 'Chendol')).toBe(false);
    await pool.query("UPDATE menu_items SET is_available = TRUE WHERE name = 'Chendol'");
  });

  it('GET /api/dishes/:id returns one dish, 404 for unknown or bad ids', async () => {
    const list = (await request(app).get('/api/dishes')).body;
    const one = await request(app).get(`/api/dishes/${list[0].id}`).expect(200);
    expect(one.body).toEqual(list[0]);
    await request(app).get('/api/dishes/99999').expect(404);
    await request(app).get('/api/dishes/abc').expect(404);
    await request(app).get('/api/dishes/99999999999999999999').expect(404);
  });
});

describe('GET /api/dishes/best-sellers', () => {
  it('returns 4 dishes ordered by units sold (cancelled orders ignored), then name', async () => {
    const res = await request(app).get('/api/dishes/best-sellers').expect(200);
    expect(res.body).toHaveLength(4);

    const { rows: rows } = await pool.query(
      `SELECT m.item_id, m.name, COALESCE(SUM(CASE WHEN o.status <> 'Cancelled' THEN oi.quantity END), 0) AS sold
       FROM menu_items m
       LEFT JOIN order_items oi ON oi.item_id = m.item_id
       LEFT JOIN orders o ON o.order_id = oi.order_id
       WHERE m.is_available GROUP BY m.item_id, m.name`,
    );
    const expected = rows
      .sort((a, b) => b.sold - a.sold || a.name.localeCompare(b.name))
      .slice(0, 4)
      .map((r) => r.item_id);
    expect(res.body.map((d) => d.id)).toEqual(expected);
  });

  it('a Cancelled order does not lift a dish into the top 4', async () => {
    const before = (await request(app).get('/api/dishes/best-sellers')).body.map((d) => d.id);
    const { rows: [outsider] } = await pool.query('SELECT item_id FROM menu_items WHERE item_id <> ALL($1::int[]) LIMIT 1', [before]);
    const { rows: [user] } = await pool.query("SELECT user_id FROM users WHERE email = 'aisha@example.com'");
    const { rows: [order] } = await pool.query(
      "INSERT INTO orders (user_id, delivery_address, contact_phone, status, total_amount) VALUES ($1, 'x', '91234567', 'Cancelled', 1) RETURNING order_id",
      [user.user_id],
    );
    await pool.query('INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, 500, 1)', [order.order_id, outsider.item_id]);
    const after = (await request(app).get('/api/dishes/best-sellers')).body.map((d) => d.id);
    expect(after).toEqual(before);
  });
});

describe('app plumbing', () => {
  it('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('malformed JSON bodies return 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":').expect(400);
    expect(res.body).toEqual({ error: 'Invalid JSON' });
  });

  it('an unreachable database returns 503 and the app keeps running', async () => {
    const dead = createApp({ pool: createPool('postgresql://nobody:nothing@127.0.0.1:1/none'), sessionSecret: 'test' });
    const res = await request(dead).get('/api/dishes').expect(503);
    expect(res.body).toEqual({ error: 'Service unavailable' });
    await request(app).get('/api/dishes').expect(200);
  });
});
