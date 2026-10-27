import { Router } from 'express';
import { requireLogin } from '../auth.js';
import { cartSummary } from '../cartView.js';
import { parseId, wrap } from '../http.js';
import { sendOrderConfirmationEmail } from '../mailer.js';
import {
  isString,
  normalizePhone,
  validateAddress,
  validateCheckoutPhone,
  validateNotes,
} from '../validation.js';

const PAYMENTS = ['cash', 'card', 'paynow'];
const iso = (d) => new Date(d).toISOString();

export function ordersRouter(pool, { sendConfirmationEmail = sendOrderConfirmationEmail } = {}) {
  const router = Router();
  router.use(requireLogin);

  router.get(
    '/',
    wrap(async (req, res) => {
      const { rows: orders } = await pool.query(
        `SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC, order_id DESC`,
        [req.session.userId],
      );
      const ids = orders.map((o) => o.order_id);
      const { rows: lines } = ids.length
        ? await pool.query(
            `SELECT oi.order_id, oi.item_id, oi.quantity, oi.unit_price, m.name, m.image
         FROM order_items oi JOIN menu_items m ON m.item_id = oi.item_id
         WHERE oi.order_id = ANY($1::int[]) ORDER BY oi.order_item_id`,
            [ids],
          )
        : { rows: [] };

      res.json(
        orders.map((o) => {
          const items = lines
            .filter((l) => l.order_id === o.order_id)
            .map((l) => ({
              dishId: l.item_id,
              name: l.name,
              image: l.image ?? '',
              quantity: l.quantity,
              unitPrice: l.unit_price,
            }));
          return {
            id: o.order_id,
            date: iso(o.order_date),
            updatedAt: iso(o.updated_at),
            status: o.status,
            total: o.total_amount,
            address: o.delivery_address,
            phone: o.contact_phone,
            payment: o.payment_method,
            notes: o.notes,
            itemCount: items.reduce((n, l) => n + l.quantity, 0),
            items,
          };
        }),
      );
    }),
  );

  router.post(
    '/',
    wrap(async (req, res) => {
      const body = req.body ?? {};
      const errors = {};
      const address = validateAddress(body.address, { required: true });
      const phone = validateCheckoutPhone(body.phone);
      const notes = validateNotes(body.notes);
      if (address) errors.address = address;
      if (phone) errors.phone = phone;
      if (!PAYMENTS.includes(body.payment)) errors.payment = 'Choose a payment method.';
      if (notes) errors.notes = notes;

      // Prices are read from the database now, never from the request or an old copy
      const cart = await cartSummary(pool, req.session);
      if (cart.lines.length === 0) errors.form = 'Your cart is empty.';
      if (Object.keys(errors).length) return res.status(422).json({ errors });

      const cleanNotes = isString(body.notes) ? body.notes.trim() : '';
      const conn = await pool.connect();
      let orderId;
      let customer;
      try {
        // The order and its lines are saved together, or not at all
        await conn.query('BEGIN');
        const {
          rows: [created],
        } = await conn.query(
          `INSERT INTO orders (user_id, delivery_address, contact_phone, payment_method, notes, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING order_id`,
          [
            req.session.userId,
            body.address.trim(),
            normalizePhone(body.phone),
            body.payment,
            cleanNotes || null,
            cart.total.toFixed(2),
          ],
        );
        orderId = created.order_id;
        await conn.query(
          `INSERT INTO order_items (order_id, item_id, quantity, unit_price)
         SELECT $1, * FROM unnest($2::int[], $3::int[], $4::numeric[])`,
          [
            orderId,
            cart.lines.map((l) => l.id),
            cart.lines.map((l) => l.count),
            cart.lines.map((l) => l.price.toFixed(2)),
          ],
        );
        ({
          rows: [customer],
        } = await conn.query('SELECT full_name, email FROM users WHERE user_id = $1', [
          req.session.userId,
        ]));
        await conn.query('COMMIT');
      } catch (err) {
        await conn.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        conn.release();
      }

      req.session.cart = {}; // the cart is now an order
      // Email runs after COMMIT and cart clearing. SMTP failures never turn a saved order into a checkout error.
      let notification;
      try {
        notification = await sendConfirmationEmail({
          orderId,
          email: customer.email,
          name: customer.full_name,
          address: body.address.trim(),
          phone: normalizePhone(body.phone),
          payment: body.payment,
          notes: cleanNotes,
          total: cart.total,
          items: cart.lines.map((line) => ({
            name: line.name,
            quantity: line.count,
            unitPrice: line.price,
          })),
        });
      } catch {
        notification = { state: 'failed' };
      }
      return res.status(201).json({ orderId, confirmationEmail: notification.state });
    }),
  );

  // The WHERE clause is the whole rule: it must be this user's order and still Pending
  router.post(
    '/:id/cancel',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) return res.status(404).json({ error: 'Not found' });
      const result = await pool.query(
        "UPDATE orders SET status = 'Cancelled' WHERE order_id = $1 AND user_id = $2 AND status = 'Pending'",
        [id, req.session.userId],
      );
      if (result.rowCount === 0)
        return res.status(409).json({ error: 'This order can no longer be cancelled.' });
      return res.json({ ok: true });
    }),
  );

  return router;
}
