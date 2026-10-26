// TEST-ONLY. The old in-browser mock, now the data behind fakeBackend.js (a fake of the Express API).
// The running app never imports this: it talks to the real API through src/api/client.js.
import dishes from './dishes';
import seedUsers from './users';
import { seedOrders } from './seedOrders';
import { summarize } from './cart';
import { normalizePhone } from '../../lib/validation';

const KEYS = { users: 'foodhub.users', orders: 'foodhub.orders', session: 'foodhub.session', cart: 'foodhub.cart' };
const UNIT_MS = { minutes: 60e3, hours: 3600e3, days: 86400e3 };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the app still works for this page view */
  }
}

// First use: copy the seed users and sample orders into storage
function ensureSeeded() {
  if (read(KEYS.users, null) === null) write(KEYS.users, seedUsers);
  if (read(KEYS.orders, null) === null) {
    const now = Date.now();
    const users = read(KEYS.users, []);
    write(KEYS.orders, seedOrders.map((o) => {
      const [[unit, n]] = Object.entries(o.ago);
      const user = users.find((u) => u.id === o.userId);
      const date = new Date(now - n * UNIT_MS[unit]).toISOString();
      return {
        id: o.id, userId: o.userId, date, updatedAt: date,
        address: user.address, phone: user.phone,
        payment: o.payment, notes: o.notes, status: o.status, total: o.total,
        items: o.items.map(([dishId, quantity, unitPrice]) => ({ dishId, quantity, unitPrice })),
      };
    }));
  }
}

const publicUser = ({ password, ...rest }) => rest;

export const api = {
  listDishes: () => dishes,
  getDish: (id) => dishes.find((d) => d.id === id && d.available) ?? null,

  // Top dishes by units ordered; cancelled orders do not count, never-ordered dishes sort last (then by name)
  bestSellers(limit = 4) {
    ensureSeeded();
    const sold = {};
    for (const o of read(KEYS.orders, [])) {
      if (o.status === 'Cancelled') continue;
      for (const l of o.items) sold[l.dishId] = (sold[l.dishId] ?? 0) + l.quantity;
    }
    return dishes
      .filter((d) => d.available)
      .sort((a, b) => (sold[b.id] ?? 0) - (sold[a.id] ?? 0) || a.name.localeCompare(b.name))
      .slice(0, limit);
  },

  getSession() {
    ensureSeeded();
    const id = read(KEYS.session, null);
    const user = id === null ? null : read(KEYS.users, []).find((u) => u.id === id);
    return user ? publicUser(user) : null;
  },

  login(email, password) {
    ensureSeeded();
    const user = read(KEYS.users, []).find((u) => u.email === String(email).trim().toLowerCase());
    if (!user || user.password !== password) return { ok: false, error: 'Incorrect email or password.' };
    write(KEYS.session, user.id);
    return { ok: true, user: publicUser(user) };
  },

  register({ name, phone, email, address, password }) {
    ensureSeeded();
    const users = read(KEYS.users, []);
    const mail = String(email).trim().toLowerCase();
    if (users.some((u) => u.email === mail)) {
      return { ok: false, field: 'email', error: 'This email is already registered. Use the log in form.' };
    }
    const id = Math.max(0, ...users.map((u) => u.id)) + 1;
    write(KEYS.users, [...users, { id, name: name.trim(), email: mail, phone: normalizePhone(phone), address: address.trim(), password }]);
    return { ok: true };
  },

  // Like destroying the PHP session: the login and the cart both go
  logout() {
    localStorage.removeItem(KEYS.session);
    localStorage.removeItem(KEYS.cart);
  },

  getCart: () => read(KEYS.cart, {}),
  saveCart: (cart) => write(KEYS.cart, cart),

  // Newest first, each with its item count
  listOrders(userId) {
    ensureSeeded();
    return read(KEYS.orders, [])
      .filter((o) => o.userId === userId)
      .map((o) => ({ ...o, itemCount: o.items.reduce((n, l) => n + l.quantity, 0) }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  },

  // Prices come from the catalog, never from the caller. The order is saved as Pending and the cart is emptied.
  placeOrder(userId, { address, phone, payment, notes }, cart) {
    ensureSeeded();
    const { lines, total } = summarize(cart, dishes);
    if (lines.length === 0) return { ok: false, error: 'Your cart is empty.' };
    const orders = read(KEYS.orders, []);
    const id = Math.max(0, ...orders.map((o) => o.id)) + 1;
    const now = new Date().toISOString();
    write(KEYS.orders, [...orders, {
      id, userId, date: now, updatedAt: now,
      address: address.trim(), phone: normalizePhone(phone), payment, notes: notes.trim() || null,
      status: 'Pending', total,
      items: lines.map((l) => ({ dishId: l.id, quantity: l.count, unitPrice: l.price })),
    }]);
    localStorage.removeItem(KEYS.cart);
    return { ok: true, orderId: id };
  },

  // The rule is the whole check: it must be this user's order and still Pending
  cancelOrder(userId, orderId) {
    ensureSeeded();
    const orders = read(KEYS.orders, []);
    const order = orders.find((o) => o.id === orderId && o.userId === userId && o.status === 'Pending');
    if (!order) return false;
    order.status = 'Cancelled';
    order.updatedAt = new Date().toISOString();
    write(KEYS.orders, orders);
    return true;
  },
};
