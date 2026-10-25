import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { userFromRow } from '../auth.js';
import { wrap } from '../http.js';
import {
  isString, normalizePhone, validateAddress, validateConfirm, validateEmail, validateName, validatePassword, validatePhone,
} from '../validation.js';

const cleanEmail = (v) => (isString(v) ? v.trim().toLowerCase() : '');
const wrongLogin = { error: 'Incorrect email or password.' };

const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
const destroy = (req) => new Promise((resolve, reject) => req.session.destroy((e) => (e ? reject(e) : resolve())));

export function authRouter(pool) {
  const router = Router();

  router.get('/me', wrap(async (req, res) => {
    if (!req.session.userId) return res.json({ user: null });
    const [[row]] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.session.userId]);
    return res.json({ user: row ? userFromRow(row) : null });
  }));

  router.post('/login', wrap(async (req, res) => {
    const { email, password } = req.body ?? {};
    // Only check the fields are filled in; password strength belongs to register (would reveal the policy)
    const errors = {};
    if (validateEmail(email)) errors.email = 'Enter a valid email address.';
    if (!isString(password) || password === '') errors.password = 'Enter your password.';
    if (Object.keys(errors).length) return res.status(422).json({ errors });

    const [[row]] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail(email)]);
    // Same answer whether the email or the password was wrong, so it does not reveal which emails exist
    if (!row || !(await bcrypt.compare(password, row.password_hash))) return res.status(401).json(wrongLogin);

    await regenerate(req); // new session id on login
    req.session.userId = row.user_id;
    return res.json({ user: userFromRow(row) });
  }));

  router.post('/register', wrap(async (req, res) => {
    const { full_name, phone, email, address, password, confirm } = req.body ?? {};
    const errors = {};
    const check = (key, message) => { if (message) errors[key] = message; };
    check('full_name', validateName(full_name));
    check('phone', validatePhone(phone));
    check('email', validateEmail(email));
    check('address', validateAddress(address ?? '', { required: false }));
    check('password', validatePassword(password));
    check('confirm', validateConfirm(isString(confirm) ? confirm : '', password));
    if (Object.keys(errors).length) return res.status(422).json({ errors });

    const hash = await bcrypt.hash(password, 10);
    const cleanAddress = isString(address) ? address.trim() : '';
    try {
      // role is never read from the request: new accounts are always customers
      await pool.query(
        "INSERT INTO users (full_name, email, phone, address, password_hash, role) VALUES (?, ?, ?, ?, ?, 'customer')",
        [full_name.trim(), cleanEmail(email), normalizePhone(phone), cleanAddress || null, hash],
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(422).json({ errors: { email: 'This email is already registered. Use the log in form.' } });
      }
      throw err;
    }
    return res.status(201).json({ ok: true });
  }));

  router.post('/logout', wrap(async (req, res) => {
    await destroy(req);
    res.clearCookie('foodhub.sid');
    res.status(204).end();
  }));

  return router;
}
