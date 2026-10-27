# FoodHub API (Express + Supabase PostgreSQL)

JSON API for the React app in `../frontend`. Data lives in a **Supabase PostgreSQL** database, reached with the `pg` driver.
The PHP version in `../../traditional` still uses its own MySQL `foodhub` database; the two no longer share data.
Passwords are bcrypt hashes in a `users` table (Supabase Auth is not used), and sessions are kept in memory.

## Set up Supabase (once)

1. Create a project at supabase.com, click **Connect**, and copy a connection string. Put your database password in it
   (percent-encode special characters). The **Direct connection** string is IPv6-only unless you buy the IPv4 add-on;
   if you get a connection error on an IPv4-only network, use the **Session pooler** string instead.
2. `cp .env.example .env` and paste it as `DATABASE_URL`. `.env` is git-ignored.
3. `npm install && npm run db:setup` creates the tables and loads the sample dishes, users and orders.
   It never drops anything and is safe to re-run. (Alternative: paste `sql/schema.sql`, then `sql/seed.sql`, into the Supabase SQL editor.)
   The schema turns on Row Level Security for every table with no policies, so the public Supabase REST API cannot read
   password hashes. This API connects as the database owner, which bypasses RLS.

## Run

1. `cd modern/backend && npm start` (port 3001; `npm run dev` restarts on changes). Needs Node 22.9+ for `--env-file-if-exists`.
2. `cd modern/frontend && npm install && npm run dev` (port 5173; Vite proxies `/api` to Express).

Database settings use `DATABASE_URL` (plus `TEST_DATABASE_URL` for tests). Optional SMTP settings are described below. The port (3001) and the session secret
are fixed in `src/config.js`. If the server refuses a connection without TLS, add `?sslmode=no-verify` to the end of `DATABASE_URL`.
Sessions are kept in memory, so they (and carts) disappear when the server restarts.
Sample logins: `aisha@example.com` / `Password123` (customer), `admin@foodhub.test` / `Password123`.

## React administration

Admin routes live in `src/routes/admin.js` in the backend. In the frontend, `src/pages/admin/Admin.jsx`
contains the shared admin layout, helpers, and order management screen; `ManageMenu.jsx` manages dishes,
and `Dashboard.jsx` contains the dashboard and its reusable summary/chart components.
The dashboard uses Tailwind utility classes alongside the existing admin styles in `admin.css`.
`src/mailer.js` is shared by admin status emails and customer checkout confirmations.

Log in at `http://localhost:5173/login` as `admin@foodhub.test` / `Password123`. Admins land on `/admin/dashboard`;
`/admin/menu` manages dishes and `/admin/orders` manages orders. `/admin` redirects to the dashboard.
The storefront header has an Admin link for administrators.

- Menu: search, category/visibility filters, five dishes per page, add/edit, JPG/PNG uploads up to 2 MB, visibility switches,
  and confirmed deletion. Dishes referenced by an order are hidden instead of deleted. Existing photos survive edits without a replacement.
- Orders: every customer's orders, status counts/tabs, exact order-number or customer-name search, delivery details,
  historical line prices, and all five status options. After an update, the selected order follows its new status tab.
- Express checks the current database role on **every** `/api/admin` request. Guests receive 401; customers receive 403.
- Photos are validated and re-encoded, saved in the backend's git-ignored `uploads/` folder, and served through `/api/uploads`.
  Keep that folder when moving the backend; the database stores the photo URL rather than the file itself.

Admin API: `GET /api/admin/menu`, `POST /api/admin/menu`, `PUT /api/admin/menu/:id`,
`PATCH /api/admin/menu/:id/visibility` (`{available: boolean}`), `DELETE /api/admin/menu/:id`,
`GET /api/admin/orders`, and `PATCH /api/admin/orders/:id/status` (`{status: string}`). Dish creation/editing accepts
multipart fields `name`, `category`, `price`, `description`, `available` and an optional `photo` file.

### Admin Dashboard — Section 6 modern enhancement

The React-only dashboard reuses authenticated `GET /api/admin/menu` and `GET /api/admin/orders` data from Supabase.
No analytics tables, seed values, or extra backend endpoints are required. Summary values and chart series are derived
in the browser with memoized calculations, and Refresh data reloads the two existing APIs.

- Total Revenue is all-time **non-cancelled order value**, rather than collected payments (payment collection is not tracked).
- Total Orders includes every status. Total Products is the current catalog, including hidden dishes. Pending Orders counts the current Pending status.
- Sales Overview shows the last 7, 30, or 90 calendar days including today in **Asia/Singapore**, with zero-filled days.
  Its local period selector affects this chart only; the all-time cards and other charts retain their clearly labelled scope.
- Orders by Status includes every order. Sales by Category excludes cancellations and multiplies saved line-item unit prices
  by quantities. Categories follow the current menu classification; the database does not store historical category snapshots.
- Recent orders link to their existing management screen. Data errors are distinct from genuine zero/empty results;
  a failed refresh preserves the last successful values and displays a retry message.

For Section 6 of the report, this demonstrates a React single-page admin experience, API-backed analytics, reusable
components, state-driven filtering and refresh, interactive Recharts visualizations with tooltips and accessible data tables,
and responsive Tailwind layouts. The dashboard/chart library is lazy-loaded separately from the customer storefront.
The traditional version is unchanged. Run frontend `npm test` to check metric arithmetic, timezone boundaries, routing,
access control, filters, refresh failure, empty states, and the existing admin/customer flows.

### Order email notifications

Copy the optional `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` settings from `.env.example`
into `.env`, fill them in, then restart the backend. For Gmail use `smtp.gmail.com`, port 587, and a Gmail App Password.
The React app uses the modern backend's settings, independently of PHP's SMTP configuration.

Status changes are saved before sending. Missing settings or SMTP failures are reported while keeping the saved status.
An unchanged status sends no duplicate email. SMTP acceptance is reported as acceptance, not guaranteed inbox delivery.

Both notification types use a shared FoodHub HTML layout: a branded header, order number and status badge,
delivery progress for active orders, and a receipt table and delivery card for checkout confirmations.
Inline styles and presentation tables support email clients with limited CSS, with a narrow-screen layout and
a plain-text alternative. Customer names, dish names, addresses, and notes are HTML-escaped.

Successful customer checkout also sends a confirmation to the logged-in account's email, using server-side order data:
order number, Pending status, dish names, quantities, saved unit prices, total, payment method, delivery address, phone,
and optional kitchen notes. The order and its lines are committed and the cart cleared before SMTP runs.
`POST /api/orders` returns `{ orderId, confirmationEmail }`, where `confirmationEmail` is `accepted`, `failed`, or
`unconfigured`. Email failure still returns 201 and the frontend confirms that the order was placed.
Invalid checkout, transaction rollback, repeated submission with an emptied cart, and refreshing the orders page do not send confirmations.

When a customer cancels their own Pending order, the saved cancellation also sends the shared Cancelled status email.
`POST /api/orders/:id/cancel` returns `{ ok: true, cancellationEmail }`, using the same email states as checkout.
Cancellation succeeds even if email fails. Repeated requests, other customers' orders, and non-Pending orders never
trigger an email; only the atomic status change can send one. The customer sees the cancellation and email result.

## API

| Method + path | Login | What it does |
|---|---|---|
| `GET /api/dishes`, `/api/dishes/best-sellers`, `/api/dishes/:id` | no | available dishes |
| `GET /api/auth/me` | no | `{ user }` or `{ user: null }` |
| `POST /api/auth/login` `{email,password}` | no | 401 `Incorrect email or password.` for any mismatch |
| `POST /api/auth/register` `{full_name,phone,email,address,password,confirm}` | no | 201, or 422 `{ errors: { field: message } }` |
| `POST /api/auth/logout` | no | 204 |
| `GET /api/cart` | no | `{ lines, items, total }` (empty for guests) |
| `POST /api/cart/items` `{dishId,qty}` | yes | max 20 per dish; `{ cart, added }` |
| `POST /api/cart/items/:id/decrease`, `DELETE /api/cart/items/:id` | yes | `{ cart }` |
| `GET /api/orders` | yes | my orders, newest first, with items |
| `POST /api/orders` `{address,phone,payment,notes}` | yes | prices re-read from the DB; order + lines in one transaction; 201 `{ orderId }` |
| `POST /api/orders/:id/cancel` | yes | only my Pending orders; otherwise 409 |

Not logged in on a "yes" route: 401 `{ error: 'Login required' }`. Database unreachable: 503.

## Tests

The tests wipe and rebuild a database from `sql/schema.sql` + `sql/seed.sql` before each test file, so they need their own
**empty** database, separate from the real one. Locally: `createdb foodhub_test`, then add
`TEST_DATABASE_URL=postgresql://localhost:5432/foodhub_test` to `.env` and run `npm test`.
Two guards protect the real data: the tests refuse a database whose name does not contain "test", and refuse to start if
`TEST_DATABASE_URL` equals `DATABASE_URL`.

Admin and checkout-email integration tests also support an explicit `INTEGRATION_DATABASE_URL` (or the older
`ADMIN_TEST_DATABASE_URL`). In that mode they create a unique `foodhub_test_*` schema, run only inside that schema,
and remove it afterwards; existing schemas are untouched. Tests inject a fake sender and never email sample accounts.
For example, to check the admin API against the configured Supabase connection without changing its real data:

```sh
node --env-file=.env --input-type=module <<'JS'
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'test/admin.test.js', 'test/checkout-email.test.js'], {
  stdio: 'inherit', env: { ...process.env, INTEGRATION_DATABASE_URL: process.env.DATABASE_URL },
});
process.exitCode = result.status ?? 1;
JS
```

### Frontend checks

From `modern/frontend`, run `npm run build` for the production frontend and `npm test` for customer and admin flows.
With Node 25, use `NODE_OPTIONS=--no-experimental-webstorage npm test` so jsdom's browser storage is used.
