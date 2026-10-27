import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { dishFromRow } from '../dishes.js';
import { parseId, wrap } from '../http.js';

// Check the current database role on every request, including after a role is revoked.
const requireAdmin = (pool) =>
  wrap(async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Login required' });
    const {
      rows: [user],
    } = await pool.query('SELECT role FROM users WHERE user_id = $1', [req.session.userId]);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Administrator access required' });
    return next();
  });

const CATEGORIES = ['Mains', 'Sides', 'Drinks', 'Desserts'];
const STATUSES = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];

function validateDish(body = {}) {
  const errors = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!name || [...name].length > 100) errors.name = 'Enter a dish name up to 100 characters.';
  if (!CATEGORIES.includes(body.category)) errors.category = 'Choose a category.';
  if (
    !['string', 'number'].includes(typeof body.price) ||
    !/^\d{1,4}(\.\d{1,2})?$/.test(String(body.price)) ||
    Number(body.price) <= 0
  ) {
    errors.price = 'Enter a price from $0.01 to $9,999.99, with up to two decimal places.';
  }
  if (
    (body.description != null && typeof body.description !== 'string') ||
    Buffer.byteLength(description) > 5000
  ) {
    errors.description = 'Keep the description within 5,000 bytes.';
  }
  if (![true, false, 'true', 'false'].includes(body.available))
    errors.available = 'Choose whether to show this dish.';
  return {
    errors,
    values: [
      name,
      body.category,
      description,
      body.price,
      body.available === true || body.available === 'true',
    ],
  };
}

export const uploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 6, fieldSize: 20000, parts: 7 },
}).single('photo');

async function savePhoto(file, directory = uploadDirectory) {
  if (!file) return null;
  let data;
  let extension;
  try {
    const image = sharp(file.buffer, { limitInputPixels: 25000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png'].includes(metadata.format)) throw new Error('Unsupported image');
    extension = metadata.format === 'jpeg' ? 'jpg' : 'png';
    // Decode and encode the image, rather than trusting its name, MIME type or header.
    data = await image.rotate().toFormat(metadata.format).toBuffer();
  } catch {
    const error = new Error('The photo must be a valid JPG or PNG image.');
    error.photoValidation = true;
    throw error;
  }
  await mkdir(directory, { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, name), data, { flag: 'wx' });
  return `/api/uploads/${name}`;
}

async function discardPhoto(image, directory = uploadDirectory) {
  if (image?.startsWith('/api/uploads/'))
    await unlink(path.join(directory, path.basename(image))).catch(() => {});
}

// No SMTP credentials are required to manage orders; a failed notification never undoes the saved status.
async function sendOrderStatusEmail({ email, orderId, status }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_PORT = '587' } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return { state: 'unconfigured' };
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  const result = await transport.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: `FoodHub: Order #${orderId} is ${status}`,
    text: `Your FoodHub order #${orderId} is now ${status}.\n\nThank you for ordering with FoodHub.`,
  });
  return { state: result.accepted?.length ? 'accepted' : 'failed' };
}

const adminDish = (row) => ({ ...dishFromRow(row), available: row.is_available });

export function adminRouter(
  pool,
  { sendStatusEmail = sendOrderStatusEmail, uploads = uploadDirectory } = {},
) {
  const router = Router();
  router.use(requireAdmin(pool));

  router.get(
    '/menu',
    wrap(async (req, res) => {
      const { rows } = await pool.query('SELECT * FROM menu_items ORDER BY item_id');
      res.json(rows.map(adminDish));
    }),
  );

  const save = (updating) =>
    wrap(async (req, res) => {
      const id = updating ? parseId(req.params.id) : null;
      if (updating && id === null) return res.status(404).json({ error: 'Dish not found' });
      const { errors, values } = validateDish(req.body ?? {});
      if (Object.keys(errors).length) return res.status(422).json({ errors });
      let image;
      try {
        image = await savePhoto(req.file, uploads);
        const {
          rows: [row],
        } = updating
          ? await pool.query(
              `UPDATE menu_items SET name = $1, category = $2, description = $3, price = $4,
           is_available = $5, image = COALESCE($6, image) WHERE item_id = $7 RETURNING *`,
              [...values, image, id],
            )
          : await pool.query(
              `INSERT INTO menu_items (name, category, description, price, is_available, image)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
              [...values, image],
            );
        if (!row) {
          await discardPhoto(image, uploads);
          return res.status(404).json({ error: 'Dish not found' });
        }
        return res.status(updating ? 200 : 201).json(adminDish(row));
      } catch (err) {
        await discardPhoto(image, uploads);
        if (err.photoValidation) return res.status(422).json({ errors: { photo: err.message } });
        throw err;
      }
    });
  router.post('/menu', uploadPhoto, save(false));
  router.put('/menu/:id', uploadPhoto, save(true));

  router.patch(
    '/menu/:id/visibility',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) return res.status(404).json({ error: 'Dish not found' });
      if (typeof req.body?.available !== 'boolean')
        return res.status(422).json({ errors: { available: 'Choose whether to show this dish.' } });
      const {
        rows: [row],
      } = await pool.query(
        'UPDATE menu_items SET is_available = $1 WHERE item_id = $2 RETURNING *',
        [req.body.available, id],
      );
      if (!row) return res.status(404).json({ error: 'Dish not found' });
      res.json(adminDish(row));
    }),
  );

  router.delete(
    '/menu/:id',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) return res.status(404).json({ error: 'Dish not found' });
      const conn = await pool.connect();
      try {
        await conn.query('BEGIN');
        const {
          rows: [row],
        } = await conn.query('SELECT item_id FROM menu_items WHERE item_id = $1 FOR UPDATE', [id]);
        if (!row) {
          await conn.query('ROLLBACK');
          return res.status(404).json({ error: 'Dish not found' });
        }
        const { rows: lines } = await conn.query(
          'SELECT 1 FROM order_items WHERE item_id = $1 LIMIT 1',
          [id],
        );
        const hidden = lines.length > 0;
        await conn.query(
          hidden
            ? 'UPDATE menu_items SET is_available = false WHERE item_id = $1'
            : 'DELETE FROM menu_items WHERE item_id = $1',
          [id],
        );
        await conn.query('COMMIT');
        return res.json({
          hidden,
          message: hidden
            ? 'This dish belongs to past orders, so it was hidden instead of deleted.'
            : 'Dish deleted.',
        });
      } catch (err) {
        await conn.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        conn.release();
      }
    }),
  );

  router.get(
    '/orders',
    wrap(async (req, res) => {
      const { rows: orders } = await pool.query(
        `SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.user_id = o.user_id
       ORDER BY o.order_date DESC, o.order_id DESC`,
      );
      const { rows: lines } = orders.length
        ? await pool.query(
            `SELECT oi.*, m.name FROM order_items oi JOIN menu_items m ON m.item_id = oi.item_id
       WHERE oi.order_id = ANY($1::int[]) ORDER BY oi.order_item_id`,
            [orders.map((o) => o.order_id)],
          )
        : { rows: [] };
      res.json(
        orders.map((o) => ({
          id: o.order_id,
          date: o.order_date,
          updatedAt: o.updated_at,
          status: o.status,
          total: o.total_amount,
          customer: o.full_name,
          email: o.email,
          address: o.delivery_address,
          phone: o.contact_phone,
          payment: o.payment_method,
          notes: o.notes,
          items: lines
            .filter((l) => l.order_id === o.order_id)
            .map((l) => ({
              dishId: l.item_id,
              name: l.name,
              quantity: l.quantity,
              unitPrice: l.unit_price,
            })),
        })),
      );
    }),
  );

  router.patch(
    '/orders/:id/status',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) return res.status(404).json({ error: 'Order not found' });
      const status = req.body?.status;
      if (!STATUSES.includes(status))
        return res.status(422).json({ errors: { status: 'Choose a valid order status.' } });
      const {
        rows: [order],
      } = await pool.query(
        'SELECT u.email FROM orders o JOIN users u ON u.user_id = o.user_id WHERE o.order_id = $1',
        [id],
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      // Only the request that actually changes the status sends an email.
      const { rowCount } = await pool.query(
        'UPDATE orders SET status = $1 WHERE order_id = $2 AND status <> $1',
        [status, id],
      );
      if (!rowCount)
        return res.json({
          changed: false,
          email: 'unchanged',
          message: `Order #${id} is already ${status}. No email was sent.`,
        });
      let notification;
      try {
        notification = await sendStatusEmail({ email: order.email, orderId: id, status });
      } catch {
        notification = { state: 'failed' };
      }
      const message =
        notification.state === 'accepted'
          ? `Email to ${order.email} was accepted by the mail service.`
          : notification.state === 'unconfigured'
            ? 'The email was not sent because email notifications are not configured.'
            : 'The email was not sent. Please check the mail service settings.';
      return res.json({
        changed: true,
        email: notification.state,
        message: `Order #${id} is now ${status}. ${message}`,
      });
    }),
  );

  return router;
}
