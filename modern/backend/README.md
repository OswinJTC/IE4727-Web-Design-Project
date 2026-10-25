# FoodHub API (Express)

JSON API for the React app in `../frontend`, running on the **same MySQL/MariaDB database as the PHP version** (`foodhub`).
Accounts and orders created in either app work in the other (passwords are bcrypt, readable by PHP's `password_verify`).

## Run

1. Start MySQL in XAMPP and make sure `foodhub` exists (`traditional/script/seed.sh`).
2. `cd modern/backend && npm install && npm start` (port 3001). `npm run dev` restarts on changes.
3. `cd modern/frontend && npm install && npm run dev` (port 5173; Vite proxies `/api` to Express).

Settings come from environment variables; the defaults are the XAMPP ones:
`DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASS= DB_NAME=foodhub PORT=3001 SESSION_SECRET=dev-only-change-me`.
Sessions are kept in memory, so they (and carts) disappear when the server restarts.

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

`npm test` runs against a throwaway database **`foodhub_test`**, dropped and rebuilt from `traditional/sql/schema.sql` + `seed.sql`
before each test file. The harness refuses to run on `foodhub`, so your own accounts and orders are never touched.
