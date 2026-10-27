# FoodHub administration

Open `admin/menu_manage.php` or `admin/orders.php`. Only users whose database role is `admin` can access these pages. The existing admin login destination redirects to Manage orders; Dashboard in the sidebar is a placeholder for a future page.

With `sql/seed.sql` imported, the local test account is `admin@foodhub.test` / `Password123`.

- Menu: search, category/status filters, five dishes per page, add/edit, JPG/PNG photo uploads up to 2 MB, visibility toggle, and deletion. Dishes referenced by past orders are hidden instead of deleted.
- Orders: search by exact order number or customer name, status tabs and counts, order details, and status updates. Historical line totals use `order_items.unit_price`.
- Both pages use the existing `foodhub` schema; no database migration is needed.

## Photos

Uploaded images go in the project's `uploads/` directory, which must be writable by the PHP web-server user. Existing remote image URLs are preserved when no replacement is uploaded.

## Email: Gmail SMTP

Notifications use PHPMailer with Gmail SMTP (`smtp.gmail.com`, port 587, STARTTLS). The sender and SMTP username are `oswin9089@gmail.com`. Recipients come from the customer attached to each order (`orders.user_id` → `users.email`).

Customer checkout uses the same SMTP settings to send an automatic order confirmation after the database transaction
commits. The HTML receipt includes the order number, Pending status, dishes, quantities, saved prices, total,
payment method, delivery address, phone, and optional kitchen notes. Email failures never undo a placed order or restore
its cart. The customer sees whether the confirmation email could be sent on the redirected orders page.
Confirmation and status emails share the same FoodHub HTML design and retain a plain-text alternative.
The layout uses inline styles and tables, adjusts for narrow screens, and escapes customer-entered content.
The customer's Cancel order button also sends this HTML Cancelled notification after successfully changing their own
Pending order. Repeated or rejected cancellations send nothing. Email failure keeps the cancellation saved and shows
the customer a clear message on the orders page.

1. Run `composer install` after cloning the project.
2. Enable 2-Step Verification on the sender's Google account and create an App Password at https://myaccount.google.com/apppasswords.
3. Copy `includes/config.local.example.php` to `includes/config.local.php`, then paste the App Password into `smtp.password`. This local file is ignored by Git. Never use your normal Gmail password.
4. Run `bash script/deploy.sh` to copy code, dependencies and local settings into the local XAMPP project. After changing the password, run this again. The source and deployed local config files should only be readable by the developer and PHP server user.
5. Log in as admin, choose a different status, and click **Update and email customer**.

The order is saved before sending. The success message identifies the recipient only after SMTP accepts the message. Missing credentials, rejected authentication, or connection failures show a failure message while preserving the saved order status. Saving an unchanged status does not send another notification. SMTP acceptance does not guarantee inbox delivery; check spam too.

Google instructions: https://support.google.com/accounts/answer/185833

To test, place an order with a customer account whose email you can access, then change that order's status. No existing order is changed merely to test configuration.
