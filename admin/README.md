# FoodHub administration

Open `admin/menu_manage.php`. Only users whose database role is `admin` can access the management page. The existing admin login destination redirects to Manage menu; Dashboard in the sidebar is a placeholder for a future page.

With `sql/seed.sql` imported, the local test account is `admin@foodhub.test` / `Password123`.

Menu management supports search, category/status filters, five dishes per page, add/edit, JPG/PNG photo uploads up to 2 MB, visibility toggle, and deletion. Dishes referenced by past orders are hidden instead of deleted.

The page uses the existing `foodhub` schema; no database migration is needed.

## Photos

Uploaded images go in the project's `uploads/` directory, which must be writable by the PHP web-server user. Existing remote image URLs are preserved when no replacement is uploaded.
