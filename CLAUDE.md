# FoodHub — Online Food Ordering System

NTU IE4727 Web Design Project 1. An online food ordering site where guests browse a menu, members order food, and admins manage the menu and orders. Brief: `IE4727 Web Design Project 1.pdf`.

## Two versions of the same site

| Folder | What | Run |
|---|---|---|
| `traditional/` | The PHP app (XAMPP). Everything below this section describes it. Paths such as `cart.php` or `sql/schema.sql` are relative to this folder. | `traditional/script/deploy.sh`, `seed.sh`, `reset_db.sh` |
| `modern/backend/` | Express + `pg` JSON API on **Supabase PostgreSQL** (schema in `sql/`, connection string in `.env`). Does not share data with the PHP MySQL database. See its README. | `npm start` (port 3001), `npm run db:setup`, `npm test` (uses throwaway schema `foodhub_test`, never `public`) |
| `modern/frontend/` | React + Vite + Tailwind CSS v4 (tokens in `src/index.css`, shared class strings in `src/lib/ui.js`), customer pages and administration at `/admin/menu` and `/admin/orders`. Talks to the API through `src/api/client.js`; Vite proxies `/api`. | `npm run dev` (port 5173), `npm test` |

Design docs for the modern version: `docs/superpowers/specs/` and `docs/superpowers/plans/`.
Shared rules (20 per dish, prices re-read from the DB, cancel only own Pending orders) live in both stacks; change them in both.

## Architecture (traditional PHP version)

Classic PHP embedded in HTML. Each page is a `.php` file that is mostly HTML, with `<?php ... ?>` blocks inserted where dynamic content is needed (loops over query results, `echo` of values, `if` blocks for logged-in state). It is not a separate front-end/back-end app.

- No framework, no MVC, no routing layer, no REST/JSON API, no `fetch`/AJAX calls for core features.
- Each page handles its own form: the same file shows the form and processes the POST at the top, then redirects.
- Shared page pieces (header, nav, footer, DB connection, auth check) are pulled in with `include` / `require`.
- Every action is a normal link or form submit and a full page load. JS is only for client-side validation and small UI behaviour (quantity steppers, character counter, toggles).

## Stack

- PHP 8.1+ with mysqli prepared statements
- MySQL/MariaDB, schema name `foodhub`
- HTML5, one external stylesheet (`css/style.css`), vanilla JS (`js/main.js`)
- PHPMailer over SMTP for order and contact emails
- Runs on XAMPP (Apache + MySQL) under `htdocs`

## Local setup

1. Start Apache and MySQL in the XAMPP Manage Servers tab.
2. Put the project in `htdocs/IE4727/` (course convention: sub-folders `week01`–`week11`; the final project may live in its own folder).
3. phpMyAdmin → create database `foodhub` → Import `sql/schema.sql`, then `sql/seed.sql`.
4. Copy `includes/config.sample.php` to `includes/config.php` and fill in DB and SMTP settings. Defaults: host `localhost`, user `root`, empty password (local only).
5. Open `http://localhost:8000/IE4727/` (use the port Manage Servers shows for Apache; XAMPP default is 80).

There is no build, lint, or test runner. To check PHP syntax: `php -l path/to/file.php`.

## Planned structure

```
index.php  menu.php  item.php  cart.php  checkout.php
my_orders.php  contact.php  register.php  login.php  logout.php
admin/           dashboard.php  menu_manage.php  orders.php
includes/        db.php  config.php  auth_check.php  header.php  footer.php  functions.php  mailer.php
css/style.css    js/main.js    images/
sql/             schema.sql  seed.sql
```

## Roles and access

- Member (`role = 'customer'`): browse home, menu, dish details, contact, register, login, cart, checkout, own orders.
- Admin (`role = 'admin'`): everything under `admin/`.
- Every protected page starts with `require 'includes/auth_check.php'` (or the admin variant). Check the role in PHP; never rely on hidden links.

Session keys: `$_SESSION['user_id']`, `['name']`, `['role']`, `['cart']`, `['flash']`.
Cookies: `remember_email` (30 days, prefills login), `last_category` (remembers menu filter).
Data reaches pages through URL parameters (`item.php?id=3`, `menu.php?category=Mains`), `$_GET`, `$_POST`, `$_COOKIE`, `$_SESSION` and `$_SERVER`.

## Database (4 tables)

- `users`: user_id PK, full_name, email UNIQUE, phone, address, password_hash, role ENUM('customer','admin'), created_at
- `menu_items`: item_id PK, name, category ENUM('Mains','Sides','Drinks','Desserts'), description, price DECIMAL(6,2), image, is_available, created_at
- `orders`: order_id PK, user_id FK, order_date, delivery_address, contact_phone, payment_method ENUM, notes, status ENUM('Pending','Preparing','Out for delivery','Delivered','Cancelled'), total_amount DECIMAL(8,2), updated_at
- `order_items`: order_item_id PK, order_id FK, item_id FK, quantity, unit_price

Delete rules: `orders.user_id` RESTRICT, `order_items.order_id` CASCADE, `order_items.item_id` RESTRICT. Prefer `is_available = 0` over deleting a menu item. Store `unit_price` on each order line so later price changes do not alter past orders. Recompute totals in PHP, never trust submitted prices.

## Conventions

- Validate in layers: HTML5 attributes, then JS, then PHP. The PHP check is the one that counts.
- All SQL goes through mysqli prepared statements. No string-built queries.
- Escape all output with `htmlspecialchars()`. Hash passwords with `password_hash()` / `password_verify()`.
- No CSRF tokens (kept simple on purpose). Use Post/Redirect/Get after every POST and show messages via `$_SESSION['flash']`.
- Regenerate the session ID on login. Destroy session and cookies on logout.
- Keep PHP logic at the top of the file and HTML below it, so the markup stays readable. Use the alternative syntax (`foreach: ... endforeach;`, `if: ... endif;`) inside HTML.
- Reporting queries (dashboard, sales by category, top dishes) use `GROUP BY` in SQL, not PHP loops.
- Image uploads: check MIME type and size, rename the file, store only the filename in the DB.
- Keep config and secrets in `includes/config.php`; it must not be committed (add to `.gitignore`).

## UI

One design system for customer and admin pages: paprika orange `#C2410C`, charcoal `#1C1917`, stone neutrals `#F6F5F3` / `#E7E3DF`. Headings in Outfit, body in Plus Jakarta Sans. Wireframes are in the "FoodHub Wireframes" artifact (11 pages); the ERD is in "FoodHub ERD". Match them when building pages.

## Design docs

- Requirements and design: "FoodHub – Online Food Ordering System: Requirements & Design" (Claude Docs). Includes feature list (FR numbers), test plan, and a brief-criteria traceability table.
- Open question: keep categories as an ENUM (4 tables) or split into a `categories` table (5 tables).
