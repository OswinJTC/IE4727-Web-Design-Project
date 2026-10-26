# Modern backend: Express API on the existing `foodhub` database

## Intent

The React frontend (`modern/frontend`, see `2026-10-25-modern-frontend-customer-pages-design.md`) currently runs on
mock data in `localStorage`. This slice replaces the mock with a real Express API over the **same MySQL/MariaDB
`foodhub` database the PHP app uses**, so every customer feature works exactly as in `traditional/` and no mock data
remains in the running app. Approved in chat by the user ("yes please proceed") after the playback.

## Goals / non-goals / anti-goals

- **Goals:** full customer parity: browse menu, dish details, best sellers, register, log in/out, cart, checkout, orders list and cancel.
  Both apps can run side by side against one database; accounts and orders created in one are usable in the other.
- **Non-goals:** admin endpoints/pages, emails (the PHP customer pages send none), image upload, rate limiting, production deployment.
- **Anti-goals:** touching or deleting rows in the live `foodhub` database during tests (it holds the user's own accounts and orders);
  changing the schema; business rules living only in the browser.

## Stack (my calls)

Node 23, Express 4, `mysql2/promise` (pool, prepared statements only), `express-session` (cookie session, in-memory store, fine for local dev),
`bcryptjs` (reads and writes PHP-compatible `$2y$` hashes), Vitest + supertest. ES modules, plain JavaScript. Location `modern/backend/`, port 3001.
Config from env with the XAMPP defaults as fallback: `DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASS= DB_NAME=foodhub SESSION_SECRET PORT=3001`.
The Vite dev server proxies `/api` to `http://127.0.0.1:3001`, so the browser sees one origin and the session cookie just works.

## API (JSON; errors are `{ error }` or `{ errors: { field: message } }`)

| Method + path | Auth | Behaviour |
|---|---|---|
| `GET /api/dishes` | none | available dishes `{id,name,category,description,price,image}` |
| `GET /api/dishes/best-sellers` | none | top 4 available by units in non-cancelled orders, then by name (same SQL as PHP) |
| `GET /api/auth/me` | none | `{ user }` or `{ user: null }` (`id,name,email,phone,address,role`) |
| `POST /api/auth/login` | none | `{email,password}`; one generic error `Incorrect email or password.` (401); regenerates the session; admins may log in too (the React app is customer-only) |
| `POST /api/auth/register` | none | same field rules as PHP; duplicate email → 422 `errors.email`; role is always `customer`; 201 `{ ok: true }` |
| `POST /api/auth/logout` | none | destroys the session and cookie; 204 |
| `GET /api/cart` | none | `{ lines, items, total }` (guests get an empty cart, as `cart.php` allowed) |
| `POST /api/cart/items` | login | `{ dishId, qty }` adds up to 20 per dish → `{ cart, added }`; `added: 0` when at the limit or the dish is unknown/unavailable |
| `POST /api/cart/items/:id/decrease` | login | one less; the line leaves at 0 |
| `DELETE /api/cart/items/:id` | login | remove the line |
| `GET /api/orders` | login | the user's orders newest first, each with `itemCount` and `items` (name, image, quantity, unitPrice) |
| `POST /api/orders` | login | `{address,phone,payment,notes}`; validates; re-reads prices from the DB; saves order + lines in **one transaction**; clears the cart; 201 `{ orderId }` |
| `POST /api/orders/:id/cancel` | login | `UPDATE … WHERE order_id=? AND user_id=? AND status='Pending'`; 200 `{ ok: true }`, or 409 when no row changed |

Unauthenticated calls to login-only routes return 401 `{ error: 'Login required' }`; the React app turns that into a redirect to `/login`.
The cart is stored in `req.session.cart` as `{ [itemId]: count }`; names, prices and images are always read from the database
(PHP stored a price copy in the session, so this is stricter, not looser).

## Validation (server is authoritative)

Same rules and messages as the PHP and the React validators: name letters/spaces ≤100; phone `^[689]\d{7}$` after stripping whitespace
(`Enter an 8-digit Singapore number starting with 6, 8 or 9.` on register, `Enter an 8-digit number starting with 6, 8 or 9` on checkout);
email valid ≤150, lower-cased; password 8–72 chars with a letter and a digit; address ≤255 (required at checkout); notes ≤255;
payment ∈ cash/card/paynow; cart not empty. Bodies are parsed only as JSON, strings are trimmed, non-strings are rejected.

## Frontend wiring

- `src/api/client.js` (new) is the fetch wrapper; `src/api/mockApi.js` and `src/data/*` are removed from the app.
- `ShopContext` loads `/api/auth/me`, `/api/dishes` and `/api/cart` on start and shows a short loading state until the session is known
  (so protected pages do not flash a redirect). Cart actions, login, register, place order and cancel call the API and then update state.
- Pages keep their markup and CSS; only data access becomes asynchronous. Menu filtering/sorting stays client-side over the loaded catalog.

## Test plan

**Backend (Vitest + supertest, real MariaDB, database `foodhub_test`)**
- `foodhub_test` is dropped and rebuilt from `traditional/sql/schema.sql` + `seed.sql` before each test file. The test config **refuses to run
  when `DB_NAME` is `foodhub`**. Test files run one at a time.
- Unit: validators; cart arithmetic and cap.
- Routes: dishes (only available, best sellers exclude cancelled and sort ties by name); auth (login ok, wrong password and unknown email give the
  same message, seeded PHP bcrypt hash verifies, register validations, duplicate email, new user can log in, logout clears session, `me`);
  cart (guest 401 on mutate, add/merge/cap 20, unknown dish adds 0, decrease, remove, totals use DB prices, cart is per session);
  orders (401 for guests, only own orders listed, validation errors, prices from DB not client, transaction rolls back on failure, cart emptied,
  cancel own Pending ok / foreign 409 / non-Pending 409, other user's order never visible).
- A seeded PHP user logs in through the API, and a user registered through the API has a `$2` hash that PHP's `password_verify` accepts (checked once with `php -r`).

**Frontend (Vitest + RTL)**: the existing page tests keep running against a **test-only fake backend** at the `fetch` level
(`src/test/fakeBackend.js`, the old mock logic moved out of the app), plus tests for the 401 → login redirect and the loading state.

**End to end (manual, scripted)**: start Express against `foodhub_test` and Vite, then run the main journey in a browser:
guest browse → register → log in → add to cart → checkout → see order → cancel.

## Decisions I made without asking (please check)

1. REST-style JSON under `/api`, session cookie auth (not JWT), in-memory session store (sessions vanish when Express restarts; carts too, like PHP session files would not).
2. Tests run on a separate `foodhub_test` database that is rebuilt from the PHP SQL files; the live `foodhub` is only touched by the running app and the final manual check.
3. Same-origin through the Vite proxy; no CORS configuration.
4. Server-side cart; client never sends prices or names.
5. Admins can log in through the API but get no admin features; the React app shows them the customer site.
