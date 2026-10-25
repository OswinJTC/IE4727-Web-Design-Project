import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb, loginAgent } from './helpers.js';

let pool;
let app;
let laksa; // 7.20
let tea; // 2.20

beforeAll(async () => {
  pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'test' });
  const [rows] = await pool.query("SELECT item_id, name FROM menu_items WHERE name IN ('Curry laksa','Iced lemon tea')");
  laksa = rows.find((r) => r.name === 'Curry laksa').item_id;
  tea = rows.find((r) => r.name === 'Iced lemon tea').item_id;
});
afterAll(() => pool.end());

const add = (agent, dishId, qty) => agent.post('/api/cart/items').send(qty === undefined ? { dishId } : { dishId, qty });

describe('guests', () => {
  it('see an empty cart but cannot change it', async () => {
    const res = await request(app).get('/api/cart').expect(200);
    expect(res.body).toEqual({ lines: [], items: 0, total: 0 });
    await request(app).post('/api/cart/items').send({ dishId: laksa, qty: 1 }).expect(401);
    await request(app).post(`/api/cart/items/${laksa}/decrease`).expect(401);
    await request(app).delete(`/api/cart/items/${laksa}`).expect(401);
  });
});

describe('members', () => {
  it('add, merge and total with DB prices; lines carry the dish details', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const first = await add(agent, laksa, 1).expect(200);
    expect(first.body.added).toBe(1);
    await add(agent, tea, 2).expect(200);
    const res = await add(agent, laksa, 2).expect(200);
    expect(res.body.cart.items).toBe(5);
    expect(res.body.cart.total).toBe(26.0); // 3 x 7.20 + 2 x 2.20
    expect(res.body.cart.lines).toHaveLength(2);
    expect(res.body.cart.lines.find((l) => l.id === laksa)).toMatchObject({
      name: 'Curry laksa', category: 'Mains', price: 7.2, count: 3, subtotal: 21.6,
    });
    expect((await agent.get('/api/cart')).body).toEqual(res.body.cart);
  });

  it('defaults qty to 1 and caps at 20 per dish', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    expect((await add(agent, laksa)).body.added).toBe(1);
    const big = await add(agent, laksa, 20).expect(200);
    expect(big.body.added).toBe(19);
    expect(big.body.cart.lines[0].count).toBe(20);
    const more = await add(agent, laksa, 1).expect(200);
    expect(more.body.added).toBe(0);
    expect(more.body.cart.lines[0].count).toBe(20);
  });

  it('unknown or hidden dishes add nothing; bad dishId or qty are 422 and change nothing', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    expect((await add(agent, 99999, 1).expect(200)).body.added).toBe(0);
    for (const bad of [{ dishId: 'abc', qty: 1 }, { dishId: laksa, qty: 0 }, { dishId: laksa, qty: -1 }, { dishId: laksa, qty: 1.5 }, { dishId: laksa, qty: 'x' }, { dishId: laksa, qty: 21 }, { dishId: [1] }, {}]) {
      await agent.post('/api/cart/items').send(bad).expect(422);
    }
    expect((await agent.get('/api/cart')).body.items).toBe(0);
  });

  it('decrease removes one and drops the line at 0; remove deletes the line', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await add(agent, laksa, 2);
    await add(agent, tea, 1);
    let res = await agent.post(`/api/cart/items/${laksa}/decrease`).expect(200);
    expect(res.body.cart.lines.find((l) => l.id === laksa).count).toBe(1);
    res = await agent.post(`/api/cart/items/${laksa}/decrease`).expect(200);
    expect(res.body.cart.lines.map((l) => l.id)).toEqual([tea]);
    res = await agent.delete(`/api/cart/items/${tea}`).expect(200);
    expect(res.body.cart).toEqual({ lines: [], items: 0, total: 0 });
    await agent.delete('/api/cart/items/abc').expect(404);
    await agent.post('/api/cart/items/0/decrease').expect(404);
  });

  it('each session has its own cart', async () => {
    const a = await loginAgent(app, 'aisha@example.com');
    const b = await loginAgent(app, 'daniel@example.com');
    await add(a, laksa, 3);
    expect((await b.get('/api/cart')).body.items).toBe(0);
    expect((await a.get('/api/cart')).body.items).toBe(3);
  });

  it('a dish hidden after it was added disappears from the cart', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await add(agent, laksa, 1);
    await add(agent, tea, 1);
    await pool.query('UPDATE menu_items SET is_available = 0 WHERE item_id = ?', [tea]);
    const res = await agent.get('/api/cart').expect(200);
    expect(res.body.lines.map((l) => l.id)).toEqual([laksa]);
    expect(res.body.total).toBe(7.2);
    await pool.query('UPDATE menu_items SET is_available = 1 WHERE item_id = ?', [tea]);
  });

  it('logging out clears the cart', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await add(agent, laksa, 1);
    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/cart')).body.items).toBe(0);
  });
});
