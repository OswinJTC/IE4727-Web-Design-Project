import { Router } from 'express';
import { requireLogin } from '../auth.js';
import { addToCart, decrease, MAX_PER_DISH, remove } from '../cart.js';
import { cartSummary } from '../cartView.js';
import { getAvailableRows } from '../dishes.js';
import { parseId, wrap } from '../http.js';

export function cartRouter(pool) {
  const router = Router();

  // Guests may look at the (always empty) cart, as cart.php allowed
  router.get('/', wrap(async (req, res) => res.json(await cartSummary(pool, req.session))));

  router.post('/items', requireLogin, wrap(async (req, res) => {
    const { dishId, qty = 1 } = req.body ?? {};
    const id = parseId(dishId);
    if (id === null || !Number.isInteger(qty) || qty < 1 || qty > MAX_PER_DISH) {
      return res.status(422).json({ error: `Choose a dish and a quantity between 1 and ${MAX_PER_DISH}.` });
    }
    const dish = (await getAvailableRows(pool, [id])).get(id) ?? null;
    const { cart, added } = addToCart(req.session.cart ?? {}, dish, qty);
    req.session.cart = cart;
    return res.json({ cart: await cartSummary(pool, req.session), added });
  }));

  router.post('/items/:id/decrease', requireLogin, wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(404).json({ error: 'Not found' });
    req.session.cart = decrease(req.session.cart ?? {}, id);
    return res.json({ cart: await cartSummary(pool, req.session) });
  }));

  router.delete('/items/:id', requireLogin, wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(404).json({ error: 'Not found' });
    req.session.cart = remove(req.session.cart ?? {}, id);
    return res.json({ cart: await cartSummary(pool, req.session) });
  }));

  return router;
}
