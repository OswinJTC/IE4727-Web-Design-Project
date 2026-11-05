# Traditional database submission

`traditional.sql` is a complete export of the local `foodhub` MySQL/MariaDB
database taken on 5 November 2026 (Asia/Taipei). It includes table definitions,
data, primary/foreign keys, indexes and auto-increment values.

| Table | Exported rows |
| --- | ---: |
| users | 13 |
| menu_items | 20 |
| orders | 25 |
| order_items | 62 |

## Restore

1. Copy the complete `traditional/` directory into your web server's document
   root.
2. On a fresh local MySQL/MariaDB instance, open phpMyAdmin and import the
   repository-root `traditional.sql`. It creates/selects `foodhub` and replaces
   its four application tables, so do not import it over data you need to keep.
3. Configure the database connection using
   `traditional/includes/config.local.php` if the defaults in `config.php` do
   not match your machine. Install PHP dependencies with `composer install`
   from `traditional/` if `vendor/` is absent.
4. Open `traditional/index.php` through your PHP web server.

Do not import `traditional/sql/seed.sql` after this snapshot. The existing
`schema.sql` and `seed.sql` remain available for a separate sample installation;
they are not the current database export.

## Product photos

The export preserves the original Wikimedia image URLs in `menu_items.image`.
The browser loads product photos directly from those URLs; no local image files
or image-path substitutions are needed. Internet access is required to load them.

## Validation

The export was restored into a separate temporary database. All four table
definitions and every exported row, including the original image URLs, were
compared against the source. The temporary database was then removed.

This export covers only the traditional application; the modern PostgreSQL
database is separate and is not included. Future database changes require a new
export.
