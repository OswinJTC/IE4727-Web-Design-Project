// Menu queries shared by the dishes, cart and orders routes

export const dishFromRow = (r) => ({
  id: r.item_id,
  name: r.name,
  category: r.category,
  description: r.description ?? '',
  price: r.price,
  image: r.image ?? '',
});

export async function listAvailableDishes(pool) {
  const [rows] = await pool.query('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY name');
  return rows.map(dishFromRow);
}

// Raw menu_items rows keyed by id, available dishes only
export async function getAvailableRows(pool, ids) {
  if (ids.length === 0) return new Map();
  const [rows] = await pool.query('SELECT * FROM menu_items WHERE is_available = 1 AND item_id IN (?)', [ids]);
  return new Map(rows.map((r) => [r.item_id, r]));
}

// Top dishes by units in non-cancelled orders; never-ordered dishes sort last, then by name (same as index.php)
export async function bestSellers(pool, limit = 4) {
  const [rows] = await pool.query(
    `SELECT m.*, COALESCE(s.sold, 0) AS sold
     FROM menu_items m
     LEFT JOIN (
       SELECT oi.item_id, SUM(oi.quantity) AS sold
       FROM order_items oi JOIN orders o ON o.order_id = oi.order_id
       WHERE o.status <> 'Cancelled'
       GROUP BY oi.item_id
     ) s ON s.item_id = m.item_id
     WHERE m.is_available = 1
     ORDER BY sold DESC, m.name
     LIMIT ?`,
    [limit],
  );
  return rows.map(dishFromRow);
}
