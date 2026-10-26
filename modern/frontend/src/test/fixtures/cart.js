// TEST-ONLY copy of the cart rules the fake backend uses. The real rules live in modern/backend/src/cart.js.
// The cart is a plain object { [dishId]: count }.
import { MAX_PER_DISH } from '../../lib/cart';

// Returns { cart, added }: never goes past MAX_PER_DISH, unknown/unavailable dishes add nothing
export function cartAdd(cart, dishes, id, qty = 1) {
  const dish = dishes.find((d) => d.id === id && d.available);
  const count = cart[id] ?? 0;
  const added = Math.min(qty, MAX_PER_DISH - count);
  if (!dish || added <= 0) return { cart, added: 0 };
  return { cart: { ...cart, [id]: count + added }, added };
}

export function cartDecrease(cart, id) {
  if (!cart[id]) return cart;
  const next = { ...cart };
  next[id] -= 1;
  if (next[id] <= 0) delete next[id];
  return next;
}

export function cartRemove(cart, id) {
  const next = { ...cart };
  delete next[id];
  return next;
}

// { lines: [{ ...dish, count, subtotal }], items, total }
export function summarize(cart, dishes) {
  const lines = [];
  let items = 0;
  let total = 0;
  for (const [key, count] of Object.entries(cart)) {
    const dish = dishes.find((d) => d.id === Number(key));
    if (!dish) continue;
    const subtotal = Math.round(dish.price * count * 100) / 100;
    lines.push({ ...dish, count, subtotal });
    items += count;
    total += subtotal;
  }
  return { lines, items, total: Math.round(total * 100) / 100 };
}
