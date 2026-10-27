import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import sharp from 'sharp';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDb, loginAgent } from './helpers.js';

let pool, app, admin, uploads, schema, owner;
const sendStatusEmail = vi.fn(async () => ({ state: 'accepted' }));
const dish = (extra = {}) => ({
  name: 'Test rice bowl',
  category: 'Mains',
  description: 'Fresh rice and vegetables',
  price: '8.50',
  available: true,
  ...extra,
});

beforeAll(async () => {
  uploads = await mkdtemp(path.join(tmpdir(), 'foodhub-admin-'));
  // Optional integration mode: create a new, private schema, never touching public or existing data.
  if (process.env.ADMIN_TEST_DATABASE_URL) {
    schema = `foodhub_admin_test_${randomUUID().replaceAll('-', '')}`;
    owner = new pg.Client({ connectionString: process.env.ADMIN_TEST_DATABASE_URL });
    await owner.connect();
    await owner.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({
      connectionString: process.env.ADMIN_TEST_DATABASE_URL,
      options: `-c search_path=${schema}`,
      max: 4,
    });
    pg.types.setTypeParser(1700, parseFloat);
    for (const name of ['schema.sql', 'seed.sql'])
      await pool.query(await readFile(new URL(`../sql/${name}`, import.meta.url), 'utf8'));
  } else {
    pool = await resetTestDb();
  }
  app = createApp({ pool, sessionSecret: 'admin-test', sendStatusEmail, uploads });
  admin = await loginAgent(app, 'admin@foodhub.test');
});
afterAll(async () => {
  await pool?.end();
  if (owner) {
    if (schema) await owner.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await owner.end();
  }
  if (uploads) await rm(uploads, { recursive: true, force: true });
});

describe('admin access', () => {
  it('rejects guests and customers on every read and write endpoint', async () => {
    const customer = await loginAgent(app, 'aisha@example.com');
    for (const [method, url] of [
      ['get', '/menu'],
      ['post', '/menu'],
      ['put', '/menu/1'],
      ['patch', '/menu/1/visibility'],
      ['delete', '/menu/1'],
      ['get', '/orders'],
      ['patch', '/orders/1/status'],
    ]) {
      await request(app)[method](`/api/admin${url}`).send({}).expect(401);
      await customer[method](`/api/admin${url}`).send({}).expect(403);
    }
  });

  it('checks the current database role, not a stale login role', async () => {
    const other = await loginAgent(app, 'aisha@example.com');
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'aisha@example.com'");
    await other.get('/api/admin/menu').expect(200);
    await pool.query("UPDATE users SET role = 'customer' WHERE email = 'aisha@example.com'");
    await other.get('/api/admin/menu').expect(403);
  });
});

describe('menu management', () => {
  it('includes hidden dishes for admins but excludes them from the storefront', async () => {
    const created = await admin
      .post('/api/admin/menu')
      .send(dish({ available: false }))
      .expect(201);
    const id = created.body.id;
    expect((await admin.get('/api/admin/menu')).body.some((item) => item.id === id)).toBe(true);
    expect((await request(app).get('/api/dishes')).body.some((item) => item.id === id)).toBe(false);
    await admin.delete(`/api/admin/menu/${id}`).expect(200);
  });

  it('validates fields without saving invalid data', async () => {
    const response = await admin
      .post('/api/admin/menu')
      .send(
        dish({
          name: '',
          category: 'Other',
          price: '-1',
          available: 'yes',
          description: 'é'.repeat(2501),
        }),
      )
      .expect(422);
    expect(Object.keys(response.body.errors).sort()).toEqual([
      'available',
      'category',
      'description',
      'name',
      'price',
    ]);
    for (const price of ['1.001', '10000', 'NaN', '0', null, {}])
      await admin.post('/api/admin/menu').send(dish({ price })).expect(422);
  });

  it('creates, edits, hides, shows, and deletes a dish with no past orders', async () => {
    const { body: created } = await admin.post('/api/admin/menu').send(dish()).expect(201);
    await admin
      .put(`/api/admin/menu/${created.id}`)
      .send(dish({ name: 'Updated bowl', price: '9.25' }))
      .expect(200);
    await admin
      .patch(`/api/admin/menu/${created.id}/visibility`)
      .send({ available: false })
      .expect(200);
    expect(
      (await request(app).get('/api/dishes')).body.some((item) => item.id === created.id),
    ).toBe(false);
    await admin
      .patch(`/api/admin/menu/${created.id}/visibility`)
      .send({ available: true })
      .expect(200);
    expect(
      (await request(app).get('/api/dishes')).body.find((item) => item.id === created.id),
    ).toMatchObject({ name: 'Updated bowl', price: 9.25 });
    const { body: deleted } = await admin.delete(`/api/admin/menu/${created.id}`).expect(200);
    expect(deleted.hidden).toBe(false);
    await admin.put(`/api/admin/menu/${created.id}`).send(dish()).expect(404);
  });

  it('hides dishes referenced by orders and preserves historical prices', async () => {
    const {
      rows: [line],
    } = await pool.query('SELECT * FROM order_items ORDER BY order_item_id LIMIT 1');
    await pool.query('UPDATE menu_items SET price = 99.99 WHERE item_id = $1', [line.item_id]);
    const { body } = await admin.delete(`/api/admin/menu/${line.item_id}`).expect(200);
    expect(body.hidden).toBe(true);
    const {
      rows: [saved],
    } = await pool.query('SELECT * FROM order_items WHERE order_item_id = $1', [
      line.order_item_id,
    ]);
    expect(saved.unit_price).toBe(line.unit_price);
    expect(
      (await admin.get('/api/admin/menu')).body.find((item) => item.id === line.item_id).available,
    ).toBe(false);
  });

  it('accepts a genuine PNG upload, serves it, and preserves it when editing without a replacement', async () => {
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: '#cf3a08' },
    })
      .png()
      .toBuffer();
    let create = admin.post('/api/admin/menu');
    for (const [key, value] of Object.entries(dish())) create = create.field(key, String(value));
    const { body: created } = await create.attach('photo', png, 'dish.png').expect(201);
    expect(created.image).toMatch(/^\/api\/uploads\/[\w-]+\.png$/);
    await request(app)
      .get(created.image)
      .expect('Content-Type', /image\/png/)
      .expect(200);
    const edited = await admin
      .put(`/api/admin/menu/${created.id}`)
      .send(dish({ name: 'Photo kept' }))
      .expect(200);
    expect(edited.body.image).toBe(created.image);
  });

  it('rejects disguised and oversized images without leaving files behind', async () => {
    const before = await readdir(uploads);
    let invalid = admin.post('/api/admin/menu');
    for (const [key, value] of Object.entries(dish())) invalid = invalid.field(key, String(value));
    const response = await invalid
      .attach('photo', Buffer.from('<script>oops</script>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(422);
    expect(response.body.errors.photo).toMatch(/valid JPG or PNG/);
    let oversized = admin.post('/api/admin/menu');
    for (const [key, value] of Object.entries(dish()))
      oversized = oversized.field(key, String(value));
    await oversized.attach('photo', Buffer.alloc(2 * 1024 * 1024 + 1), 'large.png').expect(422);
    expect(await readdir(uploads)).toEqual(before);
  });

  it('rejects bad IDs and invalid visibility values', async () => {
    await admin.put('/api/admin/menu/nope').send(dish()).expect(404);
    await admin.patch('/api/admin/menu/1/visibility').send({ available: 'false' }).expect(422);
    await admin.delete('/api/admin/menu/2147483648').expect(404);
    await admin.delete('/api/admin/menu/999999').expect(404);
  });
});

describe('order management and notifications', () => {
  it('returns every customer’s orders, delivery details and historical line prices, without password hashes', async () => {
    const { body } = await admin.get('/api/admin/orders').expect(200);
    expect(body).toHaveLength(15);
    expect(new Set(body.map((order) => order.customer)).size).toBeGreaterThan(1);
    expect(body[0]).toMatchObject({
      email: expect.any(String),
      address: expect.any(String),
      items: expect.any(Array),
    });
    expect(JSON.stringify(body)).not.toMatch(/password_hash/);
  });

  it('persists a status change, notifies the customer, and does not notify again for an unchanged status', async () => {
    sendStatusEmail.mockClear();
    const { body: orders } = await admin.get('/api/admin/orders');
    const order = orders[0];
    const status = order.status === 'Preparing' ? 'Delivered' : 'Preparing';
    const updated = await admin
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ status })
      .expect(200);
    expect(updated.body).toMatchObject({ changed: true, email: 'accepted' });
    expect(sendStatusEmail).toHaveBeenCalledWith({ email: order.email, orderId: order.id, status });
    const customer = await loginAgent(app, order.email);
    expect(
      (await customer.get('/api/orders')).body.find((item) => item.id === order.id).status,
    ).toBe(status);
    await admin.patch(`/api/admin/orders/${order.id}/status`).send({ status }).expect(200);
    expect(sendStatusEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps a saved status when SMTP fails and reports the failure', async () => {
    sendStatusEmail.mockRejectedValueOnce(new Error('SMTP rejected'));
    const { body } = await admin
      .patch('/api/admin/orders/1/status')
      .send({ status: 'Cancelled' })
      .expect(200);
    expect(body).toMatchObject({ changed: true, email: 'failed' });
    expect(body.message).toContain('The email was not sent');
    expect((await pool.query('SELECT status FROM orders WHERE order_id = 1')).rows[0].status).toBe(
      'Cancelled',
    );
  });

  it('reports unconfigured email separately from the saved order', async () => {
    sendStatusEmail.mockResolvedValueOnce({ state: 'unconfigured' });
    const { body } = await admin
      .patch('/api/admin/orders/1/status')
      .send({ status: 'Preparing' })
      .expect(200);
    expect(body.email).toBe('unconfigured');
    expect(body.message).toContain('not configured');
  });

  it('rejects invalid statuses and missing orders', async () => {
    await admin.patch('/api/admin/orders/1/status').send({ status: 'Anything' }).expect(422);
    await admin.patch('/api/admin/orders/nope/status').send({ status: 'Pending' }).expect(404);
    await admin.patch('/api/admin/orders/999999/status').send({ status: 'Pending' }).expect(404);
  });
});
