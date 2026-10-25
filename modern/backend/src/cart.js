// The session cart is { [itemId]: count }. Names and prices are always read from the database.
export const MAX_PER_DISH = 20;

// `dish` is the database row, or null when the dish is unknown or unavailable.
export function addToCart(cart, dish, qty) {
  if (!dish) return { cart, added: 0 };
  const count = cart[dish.item_id] ?? 0;
  const added = Math.min(qty, MAX_PER_DISH - count);
  if (added <= 0) return { cart, added: 0 };
  return { cart: { ...cart, [dish.item_id]: count + added }, added };
}

export function decrease(cart, id) {
  if (!cart[id]) return cart;
  const next = { ...cart, [id]: cart[id] - 1 };
  if (next[id] <= 0) delete next[id];
  return next;
}

export function remove(cart, id) {
  const next = { ...cart };
  delete next[id];
  return next;
}
