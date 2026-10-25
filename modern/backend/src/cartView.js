import { getAvailableRows } from './dishes.js';

const cents = (n) => Math.round(n * 100) / 100;

// Cart lines with details read from the database. Dishes that are gone or hidden are left out
// and pruned from the session cart, so a stale cart can never be ordered.
export async function cartSummary(pool, session) {
  const cart = session.cart ?? {};
  const ids = Object.keys(cart).map(Number);
  const rows = await getAvailableRows(pool, ids);

  const lines = [];
  let items = 0;
  let total = 0;
  const kept = {};
  for (const id of ids) {
    const row = rows.get(id);
    if (!row) continue;
    const count = cart[id];
    const subtotal = cents(row.price * count);
    lines.push({ id, name: row.name, category: row.category, image: row.image ?? '', price: row.price, count, subtotal });
    kept[id] = count;
    items += count;
    total += subtotal;
  }
  if (ids.length !== lines.length) session.cart = kept;
  return { lines, items, total: cents(total) };
}
