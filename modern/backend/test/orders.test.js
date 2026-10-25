import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb, loginAgent } from './helpers.js';

let pool;
let app;
let laksa; // 7.20
let tea; // 2.20

const details = (over = {}) => ({ address: ' Blk 1 Test Street ', phone: '9123 4567', payment: 'cash', notes: '', ...over });
const orderCount = async () => (await pool.query('SELECT COUNT(*) AS n FROM orders'))[0][0].n;
const userId = async (email) => (await pool.query('SELECT user_id FROM users WHERE email = ?', [email]))[0][0].user_id;
const fillCart = async (agent) => {
  await agent.post('/api/cart/items').send({ dishId: laksa, qty: 1 });
  await agent.post('/api/cart/items').send({ dishId: tea, qty: 2 });
};

beforeAll(async () => {
  pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'test' });
  const [rows] = await pool.query("SELECT item_id, name FROM menu_items WHERE name IN ('Curry laksa','Iced lemon tea')");
  laksa = rows.find((r) => r.name === 'Curry laksa').item_id;
  tea = rows.find((r) => r.name === 'Iced lemon tea').item_id;
});
afterAll(() => pool.end());

describe('login required', () => {
  it('guests get 401 on every order route', async () => {
    await request(app).get('/api/orders').expect(401);
    await request(app).post('/api/orders').send(details()).expect(401);
    await request(app).post('/api/orders/1/cancel').expect(401);
  });
});

describe('GET /api/orders', () => {
  it("lists only the caller's orders, newest first, with items and counts", async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const res = await agent.get('/api/orders').expect(200);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?', [await userId('aisha@example.com')]);
    expect(res.body).toHaveLength(n);
    const dates = res.body.map((o) => o.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const o of res.body) {
      expect(o.itemCount).toBe(o.items.reduce((sum, l) => sum + l.quantity, 0));
      expect(o.items.length).toBeGreaterThan(0);
      expect(Object.keys(o.items[0]).sort()).toEqual(['dishId', 'image', 'name', 'quantity', 'unitPrice']);
      expect(Number.isNaN(Date.parse(o.date))).toBe(false);
    }
    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['address', 'date', 'id', 'itemCount', 'items', 'notes', 'payment', 'phone', 'status', 'total', 'updatedAt'],
    );
  });

  it("never shows another customer's orders", async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const mine = (await agent.get('/api/orders')).body.map((o) => o.id);
    const [others] = await pool.query('SELECT order_id FROM orders WHERE user_id <> ?', [await userId('aisha@example.com')]);
    expect(others.length).toBeGreaterThan(0);
    for (const { order_id } of others) expect(mine).not.toContain(order_id);
  });
});

describe('POST /api/orders', () => {
  it('saves a Pending order from the cart using DB prices, then empties the cart', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await fillCart(agent);
    const before = await orderCount();
    const res = await agent.post('/api/orders')
      .send(details({ notes: '  Less spicy ', total: 0.01, price: 0.01, items: [{ dishId: laksa, unitPrice: 0.01 }] }))
      .expect(201);
    expect(await orderCount()).toBe(before + 1);

    const [[order]] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [res.body.orderId]);
    expect(order).toMatchObject({
      user_id: await userId('aisha@example.com'), status: 'Pending', payment_method: 'cash', total_amount: 11.6,
      delivery_address: 'Blk 1 Test Street', contact_phone: '91234567', notes: 'Less spicy',
    });
    const [lines] = await pool.query('SELECT item_id, quantity, unit_price FROM order_items WHERE order_id = ? ORDER BY item_id', [res.body.orderId]);
    expect(lines).toEqual([
      { item_id: laksa, quantity: 1, unit_price: 7.2 },
      { item_id: tea, quantity: 2, unit_price: 2.2 },
    ].sort((a, b) => a.item_id - b.item_id));

    expect((await agent.get('/api/cart')).body.items).toBe(0);
    const list = (await agent.get('/api/orders')).body;
    expect(list[0].id).toBe(res.body.orderId);
  });

  it('stores empty notes as NULL', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await fillCart(agent);
    const res = await agent.post('/api/orders').send(details({ payment: 'paynow', notes: '   ' })).expect(201);
    const [[order]] = await pool.query('SELECT notes, payment_method FROM orders WHERE order_id = ?', [res.body.orderId]);
    expect(order).toEqual({ notes: null, payment_method: 'paynow' });
  });

  it('rejects invalid details with field messages and creates nothing', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await fillCart(agent);
    const before = await orderCount();
    const res = await agent.post('/api/orders').send({ address: '', phone: '1234', payment: 'bitcoin', notes: 'n'.repeat(256) }).expect(422);
    expect(res.body.errors).toEqual({
      address: 'Enter a delivery address (up to 255 characters).',
      phone: 'Enter an 8-digit number starting with 6, 8 or 9',
      payment: 'Choose a payment method.',
      notes: 'Notes must be 255 characters or fewer.',
    });
    await agent.post('/api/orders').send({ address: ['x'], phone: 91234567, payment: {}, notes: 5 }).expect(422);
    await agent.post('/api/orders').send().expect(422);
    expect(await orderCount()).toBe(before);
    expect((await agent.get('/api/cart')).body.items).toBe(3); // the cart is untouched
  });

  it('refuses an empty cart, and a double submit makes only one order', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const empty = await agent.post('/api/orders').send(details()).expect(422);
    expect(empty.body.errors.form).toBe('Your cart is empty.');

    await fillCart(agent);
    await agent.post('/api/orders').send(details()).expect(201);
    const before = await orderCount();
    const again = await agent.post('/api/orders').send(details()).expect(422);
    expect(again.body.errors.form).toBe('Your cart is empty.');
    expect(await orderCount()).toBe(before);
  });

  it('a dish hidden after it was added cannot be ordered', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await agent.post('/api/cart/items').send({ dishId: tea, qty: 1 });
    await pool.query('UPDATE menu_items SET is_available = 0 WHERE item_id = ?', [tea]);
    const res = await agent.post('/api/orders').send(details()).expect(422);
    expect(res.body.errors.form).toBe('Your cart is empty.');
    await pool.query('UPDATE menu_items SET is_available = 1 WHERE item_id = ?', [tea]);
  });

  it('rolls everything back when saving a line fails', async () => {
    const failing = {
      query: (...a) => pool.query(...a),
      async getConnection() {
        const conn = await pool.getConnection();
        const query = conn.query.bind(conn);
        conn.query = (sql, ...rest) => (/INSERT INTO order_items/.test(sql) ? Promise.reject(Object.assign(new Error('boom'), { code: 'ER_FORCED' })) : query(sql, ...rest));
        return conn;
      },
    };
    const flaky = createApp({ pool: failing, sessionSecret: 'test' });
    const agent = await loginAgent(flaky, 'aisha@example.com');
    await fillCart(agent);
    const before = await orderCount();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await agent.post('/api/orders').send(details()).expect(500);
    spy.mockRestore();
    expect(await orderCount()).toBe(before);
    expect((await agent.get('/api/cart')).body.items).toBe(3);
  });
});

describe('POST /api/orders/:id/cancel', () => {
  const place = async (agent) => {
    await fillCart(agent);
    return (await agent.post('/api/orders').send(details()).expect(201)).body.orderId;
  };
  const statusOf = async (id) => (await pool.query('SELECT status FROM orders WHERE order_id = ?', [id]))[0][0].status;

  it('cancels your own Pending order once', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const id = await place(agent);
    await agent.post(`/api/orders/${id}/cancel`).expect(200, { ok: true });
    expect(await statusOf(id)).toBe('Cancelled');
    await agent.post(`/api/orders/${id}/cancel`).expect(409);
  });

  it("cannot cancel someone else's Pending order", async () => {
    const aisha = await loginAgent(app, 'aisha@example.com');
    const id = await place(aisha);
    const daniel = await loginAgent(app, 'daniel@example.com');
    await daniel.post(`/api/orders/${id}/cancel`).expect(409);
    expect(await statusOf(id)).toBe('Pending');
  });

  it('cannot cancel an order that is no longer Pending', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    const id = await place(agent);
    await pool.query("UPDATE orders SET status = 'Preparing' WHERE order_id = ?", [id]);
    await agent.post(`/api/orders/${id}/cancel`).expect(409);
    expect(await statusOf(id)).toBe('Preparing');
    const [[delivered]] = await pool.query("SELECT order_id FROM orders WHERE status = 'Delivered' AND user_id = ? LIMIT 1", [await userId('aisha@example.com')]);
    await agent.post(`/api/orders/${delivered.order_id}/cancel`).expect(409);
  });

  it('bad ids are 404', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await agent.post('/api/orders/abc/cancel').expect(404);
    await agent.post('/api/orders/0/cancel').expect(404);
    await agent.post('/api/orders/99999999999999/cancel').expect(404);
  });
});
