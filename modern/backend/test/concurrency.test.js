import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDb, loginAgent } from './helpers.js';

let pool;
let app;
let laksa;

beforeAll(async () => {
  pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'test' });
  ({ rows: [{ item_id: laksa }] } = await pool.query("SELECT item_id FROM menu_items WHERE name = 'Curry laksa'"));
});
afterAll(() => pool.end());

const details = { address: 'Blk 1 Test Street', phone: '91234567', payment: 'cash', notes: '' };
const orderCount = async () => (await pool.query('SELECT COUNT(*) AS n FROM orders')).rows[0].n;

describe('requests from one session that arrive at the same time', () => {
  it('a double submit of Place order creates exactly one order', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await agent.post('/api/cart/items').send({ dishId: laksa, qty: 1 });
    const before = await orderCount();
    const results = await Promise.all([agent.post('/api/orders').send(details), agent.post('/api/orders').send(details)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(await orderCount()).toBe(before + 1);
  });

  it('five simultaneous adds all count', async () => {
    const agent = await loginAgent(app, 'daniel@example.com');
    await Promise.all([1, 2, 3, 4, 5].map(() => agent.post('/api/cart/items').send({ dishId: laksa, qty: 1 })));
    expect((await agent.get('/api/cart')).body.items).toBe(5);
  });

  it('an add that is still running cannot bring ordered items back after checkout', async () => {
    const agent = await loginAgent(app, 'priya@example.com');
    await agent.post('/api/cart/items').send({ dishId: laksa, qty: 2 });
    await Promise.all([
      agent.post('/api/orders').send(details),
      agent.post('/api/cart/items').send({ dishId: laksa, qty: 1 }),
    ]);
    // Either the add ran first (and was ordered) or after (and is the only thing left): never the old 2 + new 1 back again
    const left = (await agent.get('/api/cart')).body.items;
    expect([0, 1]).toContain(left);
  });

  it('different sessions are not held up by each other', async () => {
    const a = await loginAgent(app, 'aisha@example.com');
    const b = await loginAgent(app, 'marcus@example.com');
    const [ra, rb] = await Promise.all([a.post('/api/cart/items').send({ dishId: laksa, qty: 1 }), b.post('/api/cart/items').send({ dishId: laksa, qty: 3 })]);
    expect([ra.body.cart.items, rb.body.cart.items]).toEqual([1, 3]);
  });
});
