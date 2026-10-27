import nodemailer from 'nodemailer';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../src/mailer.js';
import { createIsolatedTestDb, loginAgent, resetTestDb } from './helpers.js';

let pool, cleanup, app, dishId;
const sendConfirmationEmail = vi.fn();
const details = {
  address: ' 1 Test Street ',
  phone: '9123 4567',
  payment: 'cash',
  notes: ' Less spicy ',
};

beforeAll(async () => {
  const url = process.env.INTEGRATION_DATABASE_URL ?? process.env.ADMIN_TEST_DATABASE_URL;
  if (url) ({ pool, cleanup } = await createIsolatedTestDb(url));
  else pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'checkout-test', sendConfirmationEmail });
  dishId = (await pool.query("SELECT item_id FROM menu_items WHERE name = 'Curry laksa'")).rows[0]
    .item_id;
});
beforeEach(() => {
  sendConfirmationEmail.mockReset().mockResolvedValue({ state: 'accepted' });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
afterAll(async () => {
  if (cleanup) await cleanup();
  else await pool?.end();
});

async function customerWithCart(target = app) {
  const customer = await loginAgent(target, 'aisha@example.com');
  await customer.post('/api/cart/items').send({ dishId, qty: 2 }).expect(200);
  return customer;
}

describe('checkout confirmation emails', () => {
  it('notifies the account email after the order and lines are committed, using server prices and details', async () => {
    const customer = await customerWithCart();
    sendConfirmationEmail.mockImplementation(async (order) => {
      // A different connection sees the committed order, not an uncommitted transaction.
      const {
        rows: [saved],
      } = await pool.query('SELECT * FROM orders WHERE order_id = $1', [order.orderId]);
      const { rows: lines } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [
        order.orderId,
      ]);
      expect(saved.total_amount).toBe(14.4);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({ quantity: 2, unit_price: 7.2 });
      return { state: 'accepted' };
    });
    const { body } = await customer
      .post('/api/orders')
      .send({ ...details, email: 'attacker@example.com', total: 0.01 })
      .expect(201);
    expect(body.confirmationEmail).toBe('accepted');
    expect(sendConfirmationEmail).toHaveBeenCalledWith({
      orderId: body.orderId,
      email: 'aisha@example.com',
      name: 'Aisha Lim',
      address: '1 Test Street',
      phone: '91234567',
      payment: 'cash',
      notes: 'Less spicy',
      total: 14.4,
      items: [{ name: 'Curry laksa', quantity: 2, unitPrice: 7.2 }],
    });
    expect((await customer.get('/api/cart')).body.items).toBe(0);
  });

  it('rejects guests, invalid details, and empty carts without emailing', async () => {
    await request(app).post('/api/orders').send(details).expect(401);
    const customer = await customerWithCart();
    await customer
      .post('/api/orders')
      .send({ ...details, address: '' })
      .expect(422);
    await customer.delete(`/api/cart/items/${dishId}`).expect(200);
    await customer.post('/api/orders').send(details).expect(422);
    expect(sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it('sends one confirmation for simultaneous submissions and none when the success page is reloaded', async () => {
    const customer = await customerWithCart();
    const results = await Promise.all([
      customer.post('/api/orders').send(details),
      customer.post('/api/orders').send(details),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 422]);
    await customer.get('/api/orders').expect(200);
    await customer.get('/api/orders').expect(200);
    expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it.each(['failed', 'unconfigured', 'throws'])(
    'keeps the order and emptied cart when email is %s',
    async (state) => {
      if (state === 'throws')
        sendConfirmationEmail.mockRejectedValueOnce(new Error('SMTP offline'));
      else sendConfirmationEmail.mockResolvedValueOnce({ state });
      const customer = await customerWithCart();
      const { body } = await customer.post('/api/orders').send(details).expect(201);
      expect(body.confirmationEmail).toBe(state === 'throws' ? 'failed' : state);
      expect(
        (await pool.query('SELECT status FROM orders WHERE order_id = $1', [body.orderId])).rows[0]
          .status,
      ).toBe('Pending');
      expect((await customer.get('/api/cart')).body.items).toBe(0);
      await customer.post('/api/orders').send(details).expect(422);
      expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
    },
  );

  it('never sends a confirmation for an order whose transaction rolls back', async () => {
    const failingPool = {
      query: (...args) => pool.query(...args),
      async connect() {
        const conn = await pool.connect();
        return {
          query: (sql, ...args) =>
            /INSERT INTO order_items/.test(sql)
              ? Promise.reject(new Error('Forced insert failure'))
              : conn.query(sql, ...args),
          release: () => conn.release(),
        };
      },
    };
    const failingApp = createApp({
      pool: failingPool,
      sessionSecret: 'test',
      sendConfirmationEmail,
    });
    const customer = await customerWithCart(failingApp);
    const before = (await pool.query('SELECT count(*) FROM orders')).rows[0].count;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await customer.post('/api/orders').send(details).expect(500);
    expect((await pool.query('SELECT count(*) FROM orders')).rows[0].count).toBe(before);
    expect((await customer.get('/api/cart')).body.items).toBe(2);
    expect(sendConfirmationEmail).not.toHaveBeenCalled();
  });
});

describe('shared SMTP transport and receipt content', () => {
  const receipt = {
    orderId: 42,
    email: 'customer@example.com',
    name: 'Test Customer',
    address: '1 Test Street',
    phone: '91234567',
    payment: 'cash',
    notes: 'Less spicy',
    total: 14.4,
    items: [{ name: 'Curry laksa', quantity: 2, unitPrice: 7.2 }],
  };
  function transport() {
    for (const [key, value] of Object.entries({
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'sender@example.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM: 'FoodHub <sender@example.com>',
      SMTP_PORT: '587',
    }))
      vi.stubEnv(key, value);
    const mock = {
      sendMail: vi.fn().mockResolvedValue({ accepted: [receipt.email] }),
      close: vi.fn(),
    };
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue(mock);
    return mock;
  }

  it('includes the receipt details and uses the same transport for admin status emails', async () => {
    const mock = transport();
    expect((await sendOrderConfirmationEmail(receipt)).state).toBe('accepted');
    expect(mock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: receipt.email,
        subject: 'FoodHub: Order #42 confirmed',
        text: expect.stringContaining('2 × Curry laksa @ $7.20 = $14.40'),
        html: expect.stringContaining('aria-label="Order items"'),
      }),
    );
    const text = mock.sendMail.mock.calls[0][0].text;
    const html = mock.sendMail.mock.calls[0][0].html;
    expect(html).toContain('Order placed successfully.');
    expect(html.indexOf('ORDER TOTAL')).toBeLessThan(html.indexOf('aria-label="Order items"'));
    expect(html.indexOf('$14.40')).toBeLessThan(html.indexOf('aria-label="Order items"'));
    for (const value of [
      'Test Customer',
      'Status: Pending',
      'Total: $14.40',
      'Cash on delivery',
      '1 Test Street',
      '91234567',
      'Less spicy',
    ])
      expect(text).toContain(value);
    await sendOrderStatusEmail({ email: receipt.email, orderId: 42, status: 'Preparing' });
    expect(mock.sendMail.mock.calls[1][0].subject).toContain('Preparing');
    expect(mock.close).toHaveBeenCalledTimes(2);
  });

  it('escapes customer and dish content in HTML while preserving a readable plain-text alternative', async () => {
    const mock = transport();
    await sendOrderConfirmationEmail({
      ...receipt,
      name: 'Aisha & <b>Lim</b>',
      address: '1 <Test> Street\nUnit 2',
      notes: '<script>alert("test")</script>',
      items: [{ name: '<img src=x onerror=alert(1)>', quantity: 2, unitPrice: 7.2 }],
    });
    const { html, text } = mock.sendMail.mock.calls[0][0];
    expect(html).toContain('Aisha &amp; &lt;b&gt;Lim&lt;/b&gt;');
    expect(html).toContain('1 &lt;Test&gt; Street<br>Unit 2');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(text).toContain('Aisha & <b>Lim</b>');
    expect(text).toContain('Total: $14.40');
  });

  it.each(['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'])(
    'provides HTML and plain text for the %s status notification',
    async (status) => {
      const mock = transport();
      await sendOrderStatusEmail({ email: receipt.email, orderId: 42, status });
      const { html, text } = mock.sendMail.mock.calls[0][0];
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('name="viewport"');
      expect(html).toContain('ORDER STATUS UPDATE');
      expect(html).toContain(status);
      const headings = {
        Pending: 'Order received.',
        Preparing: 'Your order is being prepared.',
        'Out for delivery': 'Your order is out for delivery.',
        Delivered: 'Your order has been delivered.',
        Cancelled: 'Your order has been cancelled.',
      };
      expect(html).toContain(headings[status]);
      expect(text).toContain(`order #42 is now ${status}`);
      if (status === 'Cancelled') expect(html).not.toContain('ORDER PROGRESS');
    },
  );

  it('handles SMTP failures and missing settings without leaking errors', async () => {
    const mock = transport();
    mock.sendMail.mockRejectedValueOnce(new Error('Authentication failed'));
    expect(await sendOrderConfirmationEmail(receipt)).toEqual({ state: 'failed' });
    vi.stubEnv('SMTP_PASSWORD', '');
    expect(await sendOrderConfirmationEmail(receipt)).toEqual({ state: 'unconfigured' });
    expect(mock.sendMail).toHaveBeenCalledTimes(1);
  });
});
