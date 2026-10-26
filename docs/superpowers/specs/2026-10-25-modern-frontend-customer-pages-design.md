# Modern frontend: customer pages (React + CSS)

## Intent

FoodHub exists twice: `traditional/` (PHP, XAMPP) and `modern/` (React + Express). This spec covers the first
slice of `modern/`: the **customer-facing pages of the React frontend**, a like-for-like replica of the PHP pages.
Same look, same wording, same rules. Express and MySQL come later; admin pages are out of scope.

## Goals / non-goals / anti-goals

- **Goals:** every customer page in `traditional/` has a React equivalent that looks identical (the PHP
  `styles.css` is reused unchanged) and obeys the same business rules (cart limits, validation, cancel rule).
- **Non-goals:** Express API, MySQL, real email, admin pages (`admin/*`), Contact page (a dead `#` link in PHP too).
- **Anti-goals:** a redesign; a UI framework or CSS-in-JS; behaviour that only works because of mock data
  (swapping in the Express API later must only touch `src/api/`).

## Stack (my call, not discussed with the user)

Vite + React 18, react-router-dom 6, plain CSS, JavaScript (no TypeScript, matching the vanilla-JS course style).
Vitest + React Testing Library + jest-dom + user-event for tests. Location: `modern/frontend/`.

## Page map (PHP → React)

| PHP | Route | Page component |
|---|---|---|
| `index.php` | `/` | `Home` |
| `menu.php?category=&q=` | `/menu?category=&q=` | `Menu` |
| `item.php?id=` | `/item/:id` | `Item` |
| `cart.php` | `/cart` | `Cart` |
| `checkout.php` | `/checkout` | `Checkout` (login required) |
| `orders.php?filter=&id=` | `/orders?filter=&id=` | `Orders` (login required) |
| `login_register.php` | `/login` | `LoginRegister` |
| `register_success.php` | `/register-success` | `RegisterSuccess` |
| `logout.php` | (Log out button) | clears session, goes to `/` |

Shared: `Header` (brand, search form, nav, cart badge, auth area), `Footer`, `Stepper`.
The login/register/success pages use the simple header (brand + Home/Menu + account area).

## Data layer (the swap point for Express)

`src/api/mockApi.js` is the only module that knows where data lives. It exposes the operations the PHP pages
perform: `listDishes`, `getDish`, `login`, `register`, `logout`, `getSession`, `getCart`, `saveCart`,
`listOrders(userId)`, `placeOrder`, `cancelOrder`. State persists in `localStorage` (`foodhub.*` keys) so a
refresh behaves like a PHP session. Seed data: the 20 dishes from `traditional/sql/seed.sql`, six customer
accounts (password `Password123`, mock only), and sample orders for Aisha covering every status.
One `ShopContext` (session user, cart, orders) wraps it; pages never touch `localStorage`.

## Requirements

### R-Global
- R1 Header on every shop page: brand → `/`; search form (`q`, max 100 chars) submits to `/menu?q=`, input keeps current `q`;
  nav Home / Menu / My orders with the current section highlighted (item pages highlight Menu); cart badge shows total item count.
- R2 Auth area: guest sees **Log in**; member sees avatar (first letter), `Welcome, <name>`, **Log out**.
- R3 Footer with brand blurb, Explore links, Visit us placeholders, © 2026 FoodHub.
- R4 Money always `$` + two decimals. Dates `j M, H:i` (e.g. `8 Oct, 14:52`).
- R5 Page `<title>` is `FoodHub | <page>`.

### R-Home
- R6 Hero, four category cards linking to `/menu?category=<name>`, "Best Selling Dishes" with the top 4 available dishes
  by units ordered (cancelled orders excluded; ties/never-ordered sort by name), each card linking to the dish.
- R7 "See full menu" link → `/menu`.

### R-Menu
- R8 Only available dishes. `category` must be Mains/Sides/Drinks/Desserts, anything else means All. `q` is a
  case-insensitive substring match on the name, trimmed, max 100 chars, matched literally (`%` and `_` are plain characters).
- R9 Tabs show All + four categories with counts. Counts honour `q` but not the selected category. Active tab highlighted.
  Tab links keep `q`; search keeps `category`.
- R10 Subtitle: `N dishes, cooked fresh when you order` (N = all available), or `N dish(es) matching “q”` when searching (singular for 1).
- R11 Dishes sorted by name. Each card: category tag, image link to the dish, name, description, price, stepper.
  Stepper: `+` always; `−` and the quantity only when that dish is in the cart.
- R12 Guests pressing `+` or `−` are sent to `/login`. Members change the cart; the page does not reload.
- R13 "Your order" panel: `N item(s)`, one line per dish (`2 x Name`, subtotal), total, **View cart**; empty text when empty.
- R14 Empty result: `No dishes match “q”.` or `No dishes in this category.` with a link to the full menu.

### R-Item
- R15 Unknown, unavailable or non-numeric id → "Dish not found" page with a link back to the menu.
- R16 Breadcrumb Home / Menu / Category / Name. Shows image, category label, name, price, description, two info cards.
- R17 Quantity control 1–20 (buttons disable at the bounds). The button reads `Add to cart - $<qty × price>`.
- R18 Adding (members) merges into the cart without exceeding 20 per dish and shows `Added N to your cart.` with a **View cart** link
  (N = number really added). Already at 20 → `You already have the maximum (20) of this dish in your cart.`; guests go to `/login`.
- R19 "More in <category>": up to 4 other available dishes of the same category (my call: deterministic order, the PHP uses RAND()).

### R-Cart
- R20 Stepper 1/2/3 with step 1 current. Table of lines: image, name, category, unit price, quantity (− / +), subtotal, remove.
- R21 `−` at 1 removes the line; `+` stops at 20; remove deletes the line. Empty cart: message + link to menu, no checkout button.
- R22 Summary: `Items (n)`, total, **Proceed to checkout** (only when not empty) → `/checkout`, price-confirmation note.
- R23 Cart persists across refresh. The page is viewable by guests (empty).

### R-Checkout
- R24 Guests are redirected to `/login`. Stepper step 2 current, step 1 done.
- R25 Address and phone prefilled from the account; editable for this order only.
- R26 Validation (all on submit, errors under each field, nothing is placed if any fails):
  address required and ≤255 chars; phone (spaces stripped) matches `^[689]\d{7}$` with the text
  `Enter an 8-digit number starting with 6, 8 or 9`; payment one of cash/card/paynow (default cash); notes ≤255; cart not empty.
- R27 Notes counter updates live (`n / 255`).
- R28 Success: order saved as **Pending** with unit prices read from the catalog (not the cart copy), total recomputed,
  cart emptied, navigate to `/orders?id=<new id>`.
- R29 Summary lists the lines, items count, total; **Back to cart**; empty cart shows message and hides **Place order**.

### R-Orders
- R30 Guests are redirected to `/login`. Only the member's own orders, newest first.
- R31 Filter tabs All / Active (Pending, Preparing, Out for delivery) / Completed (Delivered) / Cancelled; `filter` in the URL;
  unknown value means All. Empty states: `You have not placed any orders yet.` vs `No <filter> orders.`
- R32 Table: `#id`, placed, item count, total, status badge. Clicking a row (or id) selects it (`?id=`); the selected order defaults to the
  newest in the current filter; an id outside the list is ignored.
- R33 Detail panel: status badge, `#id`, timeline (Order received → Preparing → Out for delivery → Delivered; reached steps marked done,
  current step shows its time), or `This order was cancelled on <date>.` for Cancelled; lines with `unit_price × qty`; total;
  deliver-to, phone, payment label, notes when present.
- R34 **Cancel order** only for Pending. It asks `Cancel this order? This cannot be undone.`; confirming sets Cancelled and keeps the order
  selected; declining changes nothing. A non-Pending or foreign order can never be cancelled (enforced in the data layer).

### R-Auth
- R35 Log in form: email format and password required; one generic error `Incorrect email or password.` for any mismatch. Success → `/`.
  Logged-in visitors still see the page (as in PHP).
- R36 Register form rules: name letters and spaces only, ≤100; phone `^[689]\d{7}$` (spaces stripped); email valid and ≤150;
  address optional ≤255; password 8–72 chars with a letter and a digit; confirm must match. Duplicate email → `This email is already registered. Use the log in form.`
  Success → `/register-success` (with **Back to log in**); new accounts are always customers.
- R37 Errors appear on blur/input like the PHP script and for every field on submit; the first invalid field takes focus.
- R38 Password strength bars light up 0–4 per the PHP scoring.

## Test plan (Vitest + React Testing Library)

Unit (pure functions, written first):
- `lib/validation`: phone, email, name, password, confirm, address/notes length (R26, R36).
- `lib/cart`: add respects cap and returns the amount added, decrease/remove, summary totals (R17, R18, R21).
- `lib/format`: `money`, `formatDate` (R4); `lib/menuQuery`: category/q normalisation, literal `%`/`_`, counts (R8, R9).
- `api/mockApi`: login success/failure, register duplicate, `placeOrder` uses catalog prices and Pending status,
  `cancelOrder` only for own Pending orders, best sellers exclude Cancelled (R6, R28, R34, R36).

Component/page (render inside `MemoryRouter` with providers, `localStorage` cleared per test):
- Layout: guest vs member auth area, cart badge count, search submit navigates with `q`, active nav (R1–R3).
- Home: four categories, four best sellers in the right order (R6, R7).
- Menu: tab counts with/without `q`, subtitle singular/plural, empty states, stepper visibility, guest `+` goes to login,
  order panel updates (R8–R14).
- Item: not-found, qty bounds and button total, added note with count, 20 cap message, guest redirect, more-in-category (R15–R19).
- Cart: change quantity, remove at 1, remove button, empty state hides checkout (R20–R23).
- Checkout: guest redirect, prefill, each validation message, live counter, success creates Pending order and empties cart (R24–R29).
- Orders: guest redirect, newest first, filters, row selection, cancelled message, timeline classes, cancel confirm yes/no, cancel hidden when not Pending (R30–R34).
- LoginRegister: blur validation, all errors on submit with focus, strength bars, duplicate email, wrong password, success redirects (R35–R38).

Manual/visual (not automated): open each page at 1440px and 420px beside the PHP page (via XAMPP) and compare.

## Decisions I made without asking (please check)

1. Vite + React + react-router + Vitest; JavaScript not TypeScript.
2. State lives in `localStorage` through `src/api/mockApi.js`; passwords are stored in plain text because it is a throwaway mock.
3. `PHP rand` for "More in" becomes a deterministic order; the checkout notes counter is live (the PHP markup had it static).
4. Admin login is not supported in the mock (customer pages only).
5. The phone field's always-red border (a leftover from the static mockup, also present in the PHP `styles.css`) is fixed in the modern copy only: red only when invalid.
6. `modern/frontend/backend/` (an empty folder that already existed) is left untouched; it probably belongs at `modern/backend/`.
