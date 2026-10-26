export const CATEGORIES = ['Mains', 'Sides', 'Drinks', 'Desserts'];

// Anything that is not one of the four categories means "All"
export const normalizeCategory = (v) => (CATEGORIES.includes(v) ? v : '');

export const normalizeQuery = (v) => String(v ?? '').trim().slice(0, 100);

const matches = (dish, q) => dish.name.toLowerCase().includes(q.toLowerCase());

// Dishes filtered by category and name search, sorted by name (the API only sends available dishes)
export function filterDishes(dishes, category, q) {
  return dishes
    .filter((d) => category === '' || d.category === category)
    .filter((d) => q === '' || matches(d, q))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Tab counts: honour the search, ignore the selected category
export function categoryCounts(dishes, q) {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const d of dishes) {
    if (q === '' || matches(d, q)) counts[d.category] += 1;
  }
  return counts;
}

// Menu link that keeps the current category and search, plus the page when it is not the first
export function menuUrl(category, q, page = 1) {
  const p = new URLSearchParams();
  if (category) p.set('category', category);
  if (q) p.set('q', q);
  if (page > 1) p.set('page', page);
  const s = p.toString();
  return '/menu' + (s ? '?' + s : '');
}
