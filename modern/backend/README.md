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

`DATABASE_URL` is the only setting read from `.env` (plus `TEST_DATABASE_URL` for tests). The port (3001) and the session secret
are fixed in `src/config.js`. If the server refuses a connection without TLS, add `?sslmode=no-verify` to the end of `DATABASE_URL`.
Sessions are kept in memory, so they (and carts) disappear when the server restarts.
Sample logins: `aisha@example.com` / `Password123` (customer), `admin@foodhub.test` / `Password123`.

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
