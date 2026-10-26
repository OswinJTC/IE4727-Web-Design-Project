import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDb, loginAgent } from './helpers.js';

let pool;
let app;

beforeAll(async () => {
  pool = await resetTestDb();
  app = createApp({ pool, sessionSecret: 'test' });
});
afterAll(() => pool.end());

const newUser = (over = {}) => ({
  full_name: 'New Person', phone: '91112222', email: 'new.person@example.com',
  address: '', password: 'Abcdefg1', confirm: 'Abcdefg1', ...over,
});

describe('login', () => {
  it('logs in a seeded PHP user (bcrypt $2y$ hash) and /me returns them without the hash', async () => {
    const { rows: [row] } = await pool.query("SELECT password_hash FROM users WHERE email = 'aisha@example.com'");
    expect(row.password_hash.startsWith('$2y$')).toBe(true);

    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email: 'aisha@example.com', password: 'Password123' }).expect(200);
    expect(res.body.user).toMatchObject({ name: 'Aisha Lim', email: 'aisha@example.com', role: 'customer' });
    expect(JSON.stringify(res.body)).not.toMatch(/\$2/);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.email).toBe('aisha@example.com');
    expect(me.body.user).toHaveProperty('address');
    expect(JSON.stringify(me.body)).not.toMatch(/password/i);
  });

  it('wrong password and unknown email give the same message', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'aisha@example.com', password: 'nope' }).expect(401);
    const b = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Password123' }).expect(401);
    expect(a.body).toEqual({ error: 'Incorrect email or password.' });
    expect(b.body).toEqual(a.body);
  });

  it('ignores case and surrounding spaces in the email', async () => {
    await request(app).post('/api/auth/login').send({ email: '  AISHA@Example.com ', password: 'Password123' }).expect(200);
  });

  it('gives a new session id on login', async () => {
    const agent = request.agent(app);
    const before = (await agent.get('/api/auth/me')).headers['set-cookie'];
    expect(before).toBeUndefined(); // no session is created for a visitor who never logs in
    const res = await agent.post('/api/auth/login').send({ email: 'aisha@example.com', password: 'Password123' });
    expect(res.headers['set-cookie'][0]).toMatch(/foodhub\.sid=.*HttpOnly/);
  });

  it('rejects empty or non-string credentials with 422, never a 500', async () => {
    const empty = await request(app).post('/api/auth/login').send({}).expect(422);
    expect(empty.body.errors).toEqual({ email: 'Enter a valid email address.', password: 'Enter your password.' });
    await request(app).post('/api/auth/login').send({ email: { a: 1 }, password: ['x'] }).expect(422);
    await request(app).post('/api/auth/login').send({ email: 'aisha@example.com', password: 12345678 }).expect(422);
    await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('null').expect(400);
  });
});

describe('me and logout', () => {
  it('/me is { user: null } for visitors', async () => {
    const res = await request(app).get('/api/auth/me').expect(200);
    expect(res.body).toEqual({ user: null });
  });

  it('logout ends the session', async () => {
    const agent = await loginAgent(app, 'aisha@example.com');
    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/auth/me')).body).toEqual({ user: null });
  });
});

describe('register', () => {
  it('creates a customer with a bcrypt hash, normalised phone/email, and the user can log in', async () => {
    const res = await request(app).post('/api/auth/register')
      .send(newUser({ email: ' New.Person@Example.com ', phone: '9111 2222', address: ' Blk 1 ', role: 'admin' }))
      .expect(201);
    expect(res.body).toEqual({ ok: true });
    const { rows: [row] } = await pool.query("SELECT * FROM users WHERE email = 'new.person@example.com'");
    expect(row).toMatchObject({ full_name: 'New Person', phone: '91112222', address: 'Blk 1', role: 'customer' });
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
    await request(app).post('/api/auth/login').send({ email: 'new.person@example.com', password: 'Abcdefg1' }).expect(200);
  });

  it('stores an empty address as NULL', async () => {
    await request(app).post('/api/auth/register').send(newUser({ email: 'noaddr@example.com' })).expect(201);
    const { rows: [row] } = await pool.query("SELECT address FROM users WHERE email = 'noaddr@example.com'");
    expect(row.address).toBeNull();
  });

  it('rejects a duplicate email in any case', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser({ email: 'AISHA@example.com' })).expect(422);
    expect(res.body.errors).toEqual({ email: 'This email is already registered. Use the log in form.' });
  });

  it('returns every field error at once', async () => {
    const res = await request(app).post('/api/auth/register').send({ full_name: 'A1', phone: '123', email: 'x', address: 'y'.repeat(256), password: 'short', confirm: '' }).expect(422);
    expect(Object.keys(res.body.errors).sort()).toEqual(['address', 'confirm', 'email', 'full_name', 'password', 'phone']);
    expect(res.body.errors.full_name).toBe('Use letters and spaces only.');
    expect(res.body.errors.confirm).toBe('Confirm your password.');
  });

  it('rejects mismatched confirmation and non-string fields without a 500', async () => {
    const mismatch = await request(app).post('/api/auth/register').send(newUser({ email: 'm@example.com', confirm: 'Different1' })).expect(422);
    expect(mismatch.body.errors.confirm).toBe('Passwords do not match.');
    await request(app).post('/api/auth/register').send({ full_name: ['x'], phone: 1, email: {}, password: null }).expect(422);
    await request(app).post('/api/auth/register').send().expect(422);
  });
});
