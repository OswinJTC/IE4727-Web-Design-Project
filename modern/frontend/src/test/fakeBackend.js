// TEST-ONLY. A stand-in for the Express API at the fetch level: same URLs, status codes and JSON shapes as
// modern/backend (whose own tests run against a real database), backed by the old in-browser mock.
import { api as db } from './fixtures/mockApi';
import dishes from './fixtures/dishes';
import { cartAdd, cartDecrease, cartRemove, summarize } from './fixtures/cart';
import { validateAddress, validateCheckoutPhone, validateNotes } from '../lib/validation';

const json = (status, body) => new Response(status === 204 ? null : JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const cartView = () => summarize(db.getCart(), dishes);
const dishView = ({ available, ...d }) => d;

function ordersView(userId) {
  return db.listOrders(userId).map((o) => ({
    ...o,
    items: o.items.map((l) => {
      const dish = dishes.find((d) => d.id === l.dishId);
      return { ...l, name: dish.name, image: dish.image };
    }),
  }));
}

// Tests can set `fakeBackend.fail = true` to simulate the server being unreachable, or
// `fakeBackend.failOn = (method, path) => boolean` to break one endpoint (the server answers 503)
export const fakeBackend = { fail: false, failOn: null };

export async function fakeFetch(url, { method = 'GET', body } = {}) {
  if (fakeBackend.fail) throw new TypeError('Failed to fetch');
  const path = url.replace(/^\/api/, '');
  if (fakeBackend.failOn?.(method, path)) return json(503, { error: 'Service unavailable' });
  const data = body ? JSON.parse(body) : {};
  const user = db.getSession();
  const needLogin = () => json(401, { error: 'Login required' });
  let m;

  if (method === 'GET' && path === '/auth/me') return json(200, { user });
  if (method === 'POST' && path === '/auth/login') {
    const res = db.login(data.email, data.password);
    return res.ok ? json(200, { user: res.user }) : json(401, { error: res.error });
  }
  if (method === 'POST' && path === '/auth/register') {
    const res = db.register({ name: data.full_name, phone: data.phone, email: data.email, address: data.address, password: data.password });
    return res.ok ? json(201, { ok: true }) : json(422, { errors: { [res.field]: res.error } });
  }
  if (method === 'POST' && path === '/auth/logout') {
    await new Promise((r) => setTimeout(r, 20)); // a real server takes a moment to answer
    db.logout();
    return json(204);
  }

  if (method === 'GET' && path === '/dishes') return json(200, dishes.filter((d) => d.available).map(dishView));
  if (method === 'GET' && path === '/dishes/best-sellers') return json(200, db.bestSellers(4).map(dishView));

  if (method === 'GET' && path === '/cart') return json(200, user ? cartView() : { lines: [], items: 0, total: 0 });
  if (path.startsWith('/cart/items') || path.startsWith('/orders')) {
    if (!user) return needLogin();
  }
  if (method === 'POST' && path === '/cart/items') {
    const { cart, added } = cartAdd(db.getCart(), dishes, data.dishId, data.qty ?? 1);
    db.saveCart(cart);
    return json(200, { cart: cartView(), added });
  }
  if ((m = path.match(/^\/cart\/items\/(\d+)\/decrease$/)) && method === 'POST') {
    db.saveCart(cartDecrease(db.getCart(), Number(m[1])));
    return json(200, { cart: cartView() });
  }
  if ((m = path.match(/^\/cart\/items\/(\d+)$/)) && method === 'DELETE') {
    db.saveCart(cartRemove(db.getCart(), Number(m[1])));
    return json(200, { cart: cartView() });
  }

  if (method === 'GET' && path === '/orders') return json(200, ordersView(user.id));
  if (method === 'POST' && path === '/orders') {
    await new Promise((r) => setTimeout(r, 20)); // a real server takes a moment to answer
    const errors = {};
    const address = validateAddress(data.address, { required: true });
    const phone = validateCheckoutPhone(data.phone);
    const notes = validateNotes(data.notes);
    if (address) errors.address = address;
    if (phone) errors.phone = phone;
    if (!['cash', 'card', 'paynow'].includes(data.payment)) errors.payment = 'Choose a payment method.';
    if (notes) errors.notes = notes;
    if (cartView().lines.length === 0) errors.form = 'Your cart is empty.';
    if (Object.keys(errors).length) return json(422, { errors });
    const res = db.placeOrder(user.id, data, db.getCart());
    return json(201, { orderId: res.orderId });
  }
  if ((m = path.match(/^\/orders\/(\d+)\/cancel$/)) && method === 'POST') {
    return db.cancelOrder(user.id, Number(m[1])) ? json(200, { ok: true }) : json(409, { error: 'This order can no longer be cancelled.' });
  }
  return json(404, { error: 'Not found' });
}
