# Modern backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Express API in `modern/backend/` on the existing `foodhub` MySQL database, wired into the React app so no mock data remains in the running app.

**Architecture:** `createApp({ pool, sessionSecret })` builds the Express app from an injected `mysql2` pool, so tests can use a throwaway database. Routers per resource (`dishes`, `auth`, `cart`, `orders`) over small pure modules (`validation`, `cart`). The React app talks to it through one fetch wrapper; `ShopContext` becomes the async owner of session, catalog and cart.

**Tech Stack:** Node 23, Express 4, mysql2/promise, express-session, bcryptjs, Vitest, supertest; React 18 + Vite proxy.

**Spec:** `docs/superpowers/specs/2026-10-25-modern-backend-design.md` (frontend context: `…-modern-frontend-customer-pages-design.md`)

## Global Constraints

- Same database `foodhub` and schema as PHP; schema is never changed. Defaults `DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASS= DB_NAME=foodhub PORT=3001`.
- All SQL uses placeholders; no string-built queries.
- Tests run only against `foodhub_test`; the test harness throws if `DB_NAME` is `foodhub`. Never delete from the live DB.
- Rules unchanged from PHP: 20 per dish, prices re-read from DB, order + lines in one transaction, cancel only own Pending orders, role always `customer` on register.
- Validation messages are copied from `modern/frontend/src/lib/validation.js` (checkout phone uses the shorter message).
- Do not commit unless the user asks; prepare commit messages only.

## Review Focus

- Non-string / malformed JSON bodies (`{"email":{"a":1}}`, arrays, missing body) → 400/422, never 500.
- Non-numeric or huge ids (`/api/orders/abc/cancel`, `/api/dishes/99999999999`) → 404/400, never 500.
- Double-submitting "Place order": the second request finds an empty cart and creates no second order.
- A dish hidden (`is_available=0`) after it was added to a cart is dropped from the cart view and cannot be ordered.
- Database unreachable → JSON 503, process stays up.
- Email case/whitespace on login and register (`  Aisha@Example.com `) resolves to the same account.

---

### Task 1: Backend scaffold, config, test database harness, validators, pure cart

**Files:** Create `modern/backend/{package.json,.gitignore,vitest.config.js}`, `src/{config.js,db.js,validation.js,cart.js}`, `test/{helpers.js,validation.test.js,cart.test.js}`.

**Interfaces — Produces:**
- `config.js`: `export const config = { db: {host,port,user,password,database}, port, sessionSecret }` (env with the defaults above).
- `db.js`: `export function createPool(dbConfig = config.db): Pool`.
- `validation.js` (same names/messages as the frontend): `validateName, validatePhone, validateCheckoutPhone, validateEmail, validatePassword, validateConfirm, validateAddress(v,{required}), validateNotes, normalizePhone`; each returns `''` or a message; plus `isString(v)`.
- `cart.js`: `MAX_PER_DISH = 20`; `addToCart(cart, dish, qty) -> { cart, added }` where `dish` is a DB row or `null`; `decrease(cart,id)`, `remove(cart,id)`.
- `test/helpers.js`: `resetTestDb(): Promise<Pool>` (drops/creates `foodhub_test`, runs `traditional/sql/schema.sql` then `seed.sql` with `foodhub` → `foodhub_test`, throws if the target name is `foodhub`), `makeApp(pool)`, `loginAgent(app, email, password='Password123')` (supertest agent).

- [ ] Write failing tests: validators (every message from the frontend suite, `isString(null)`/`isString({})` false), `addToCart` caps at 20 and returns `added`, unknown dish (`null`) adds 0, `resetTestDb` throws when `DB_NAME=foodhub`.
- [ ] Run `npx vitest run` → FAIL (modules missing).
- [ ] Implement the modules above; `package.json` has `"type":"module"`, scripts `start`, `dev` (`node --watch src/server.js`), `test`; vitest config sets `fileParallelism:false`, `env.DB_NAME='foodhub_test'`.
- [ ] Run → PASS. Commit message: `feat(backend): scaffold, validators, cart rules, test DB harness`.

### Task 2: App factory, error handling, dishes routes

**Files:** Create `src/app.js`, `src/server.js`, `src/routes/dishes.js`, `test/dishes.test.js`.

**Interfaces — Consumes:** `createPool`. **Produces:** `createApp({ pool, sessionSecret }): Express`; `dishRow → { id, name, category, description, price:number, image }`; `getAvailableDishesById(pool, ids)`; `app` mounts `/api/dishes`, `/api/auth`, `/api/cart`, `/api/orders`; JSON error middleware (`{error}` with 400 for bad JSON, 503 when `err.code` is `ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED_ERROR`, otherwise 500 without leaking messages).

- [ ] Tests: `GET /api/dishes` returns the 20 seeded dishes with numeric `price`; a dish set `is_available=0` in `foodhub_test` is absent; `GET /api/dishes/best-sellers` returns 4 in the PHP order (units desc, then name) and ignores a Cancelled order; unknown route → 404 JSON; malformed JSON body → 400; a pool pointing at a dead port → `GET /api/dishes` returns 503.
- [ ] Run → FAIL. Implement; best-sellers SQL is the one in `traditional/index.php`. Run → PASS.

### Task 3: Auth routes

**Files:** Create `src/routes/auth.js`, `test/auth.test.js`; session middleware in `app.js` (cookie `foodhub.sid`, `httpOnly`, `sameSite:'lax'`).

**Interfaces — Produces:** `requireLogin` middleware (401 `{error:'Login required'}`) exported from `src/auth.js`; `req.session.userId`; user JSON `{ id, name, email, phone, address, role }`.

- [ ] Tests: seeded `aisha@example.com`/`Password123` logs in and `GET /api/auth/me` returns her; wrong password and unknown email both 401 `Incorrect email or password.`; `"  AISHA@Example.com "` logs in; session id changes on login; non-string email/password → 422, no 500; register happy path stores a `$2` bcrypt hash and role `customer`, then logs in; duplicate email (any case) → 422 `errors.email` text from the spec; each invalid field gives its message; `role:"admin"` in the body is ignored; logout → 204 and `me` returns `{user:null}`; the register response never contains the hash.
- [ ] Run → FAIL. Implement with `bcryptjs` (`compare` / `hash(pw, 10)`); duplicate detected via `ER_DUP_ENTRY`. Run → PASS.
- [ ] Verify PHP interop once: register `zz.interop@example.test` via the API against `foodhub_test`, then `php -r 'var_dump(password_verify("Abcdefg1", "<hash>"));'` prints `bool(true)`.

### Task 4: Cart routes

**Files:** Create `src/routes/cart.js`, `test/cart-routes.test.js`.

**Interfaces — Consumes:** `requireLogin`, `cart.js`, `getAvailableDishesById`. **Produces:** `cartSummary(pool, sessionCart): Promise<{ lines:[{id,name,category,image,price,count,subtotal}], items, total }>` (drops unavailable/unknown dishes and prunes them from the session cart; money rounded to cents); routes per the spec table, each mutation responding `{ cart: summary, added? }`.

- [ ] Tests: guest `GET /api/cart` → empty summary; guest `POST` → 401; add 1 then 2 more → count 3; add 25 at once → count 20, `added: 20`; at 20 another add → `added: 0`; unknown dish id and `qty` of 0, -1, 1.5, `"x"` → no change, no 500; decrease to 0 removes the line; DELETE removes; totals use DB prices (compare with `foodhub_test` row); two agents have separate carts; a dish hidden after adding disappears from the summary.
- [ ] Run → FAIL. Implement. Run → PASS.

### Task 5: Orders routes

**Files:** Create `src/routes/orders.js`, `test/orders.test.js`.

**Interfaces — Consumes:** `requireLogin`, `cartSummary`, validators. **Produces:** `GET /api/orders` → `[{ id, date (ISO), updatedAt (ISO), status, total:number, address, phone, payment, notes|null, itemCount, items:[{ dishId, name, image, quantity, unitPrice }] }]`; `POST /api/orders`; `POST /api/orders/:id/cancel`.

- [ ] Tests: guests get 401 on all three; list returns only the caller's orders, newest first, items attached, `itemCount` equals the sum of quantities; Aisha sees exactly her seeded orders; place order with cart `{3:1, 9:2}`: 201, row is `Pending`, `total_amount` 11.60, two `order_items` with DB `unit_price`, cart emptied, order visible in list; whitespace in phone stripped, empty notes stored as NULL; validation: empty address, phone `1234`, bad payment, 256-char notes → 422 `errors` with spec messages and **no row created**; empty cart → 422 `errors.form` `Your cart is empty.`; client-supplied `price`/`total` fields ignored; forcing an `order_items` insert failure (dish deleted from `foodhub_test` between summary and insert via a pool wrapper) rolls back so no `orders` row remains; second identical POST after success → 422 empty cart and order count unchanged; cancel: own Pending → 200 and status `Cancelled`, again → 409, someone else's Pending order → 409 and unchanged, `Delivered` → 409, `/api/orders/abc/cancel` and `/api/orders/0/cancel` → 404.
- [ ] Run → FAIL. Implement with a dedicated connection (`pool.getConnection`, `beginTransaction`, `commit`/`rollback`, `release` in `finally`); cancel is the single `UPDATE … WHERE order_id=? AND user_id=? AND status='Pending'` and checks `affectedRows`. Run → PASS.

### Task 6: Frontend client and context on the real API

**Files:** Create `modern/frontend/src/api/client.js`, `src/test/fakeBackend.js`; modify `src/context/ShopContext.jsx`, `src/pages/{Home,Menu,Item,Cart,Checkout,Orders,LoginRegister}.jsx`, `src/components/Shell.jsx`, `src/test/{setup.js,utils.jsx}`, the existing `*.test.*` files; move `src/api/mockApi.js`, `src/data/*` into `src/test/fixtures/` (test-only), delete from `src/api`/`src/data`.

**Interfaces — Produces (`client.js`):** `class ApiError extends Error { status, errors }`; `api.me()`, `api.dishes()`, `api.bestSellers()`, `api.login(email,password)`, `api.register(data)`, `api.logout()`, `api.cart()`, `api.cartAdd(dishId,qty)`, `api.cartDecrease(id)`, `api.cartRemove(id)`, `api.orders()`, `api.placeOrder(details)`, `api.cancelOrder(id)`; all use `fetch('/api/…', { credentials:'same-origin', headers JSON })` and throw `ApiError` on non-2xx.
**`useShop()` after this task:** `{ ready, user, dishes, summary, orders, login, register, logout, addToCart(id,qty) → {status:'added'|'max'|'login', added}, decreaseInCart, removeFromCart, placeOrder(details) → {ok, orderId}|{ok:false, errors}, cancelOrder(id) → boolean, refreshOrders }`. `summary` has the same shape as before (`lines` carry `id,count,subtotal,…`); the old `cart` object is replaced by `summary.lines`.

- [ ] Move the old mock logic into `fakeBackend.js` as `installFakeBackend()` which stubs `global.fetch` with handlers for every endpoint in the spec table (same status codes/JSON), seeded from the fixtures; `renderApp` awaits the first `ready` render (`await screen.findBy…`/`waitFor`).
- [ ] Write the new failing tests first: while loading the app shows `Loading…` and protected pages do not redirect; a 401 from `GET /api/orders` or `POST /api/cart/items` sends the user to `/login`; `placeOrder` 422 errors from the server render under the fields; network failure on login shows `Something went wrong. Please try again.`.
- [ ] Update pages for async data (`useEffect` for best sellers/orders, `await` on actions); keep markup and class names untouched. Existing page tests must pass with `findBy`/`waitFor` replacing sync reads.
- [ ] Run `npx vitest run` in `modern/frontend` → PASS; `npx vite build` → success.

### Task 7: Wire-up, end-to-end check, docs

**Files:** Modify `modern/frontend/vite.config.js` (`server.proxy['/api'] = 'http://127.0.0.1:3001'`), `modern/backend/README.md` (new), `CLAUDE.md` (layout + how to run).

- [ ] Run Express on `DB_NAME=foodhub_test` and Vite; with the browser, run: guest sees menu → `+` redirects to login → register → log in → add two dishes → checkout with a bad phone (see error) then a good one → order appears Pending → cancel it (confirm) → log out. No console errors.
- [ ] Stop `foodhub_test` run; start Express on the real `foodhub` once and confirm `aisha@example.com` / `Password123` logs in and sees her seeded orders (read-only; place no order).
- [ ] Final: `npx vitest run` in both packages; `grep -r mockApi modern/frontend/src --include=*.jsx --include=*.js` shows only test files.
