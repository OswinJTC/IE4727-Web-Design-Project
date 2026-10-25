import { Router } from 'express';
import { bestSellers, dishFromRow, getAvailableRows, listAvailableDishes } from '../dishes.js';
import { parseId, wrap } from '../http.js';

export function dishesRouter(pool) {
  const router = Router();

  router.get('/', wrap(async (req, res) => res.json(await listAvailableDishes(pool))));

  // Registered before /:id so "best-sellers" is not read as an id
  router.get('/best-sellers', wrap(async (req, res) => res.json(await bestSellers(pool, 4))));

  router.get('/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const row = id === null ? null : (await getAvailableRows(pool, [id])).get(id);
    if (!row) return res.status(404).json({ error: 'Dish not found' });
    return res.json(dishFromRow(row));
  }));

  return router;
}
