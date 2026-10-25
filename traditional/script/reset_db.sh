#!/usr/bin/env bash
# Delete every row in the FoodHub tables and reload the seed data. TRUNCATE also puts each
# AUTO_INCREMENT counter back to 1, so ids (dishes, users, orders) match a fresh install.
#
# Usage: ./script/reset_db.sh [--yes] [--no-seed]
#   --yes      do not ask for confirmation
#   --no-seed  leave the tables empty instead of reloading sql/seed.sql
# DB_NAME=other ./script/reset_db.sh   targets another database (default: foodhub)
set -euo pipefail

MYSQL="/Applications/XAMPP/xamppfiles/bin/mysql"
SQL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sql" && pwd)"
DB_NAME="${DB_NAME:-foodhub}"

ASSUME_YES=0
SEED=1
for arg in "$@"; do
  case "$arg" in
    --yes)     ASSUME_YES=1 ;;
    --no-seed) SEED=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [[ ! -x "$MYSQL" ]]; then
  echo "mysql client not found at $MYSQL. Is XAMPP installed?" >&2
  exit 1
fi

# XAMPP default login: root, empty password (local testing only)
if ! "$MYSQL" -uroot -e "SELECT 1" >/dev/null 2>&1; then
  echo "Cannot connect to MySQL. In XAMPP: Manage Servers > start MySQL Database (should be green)." >&2
  exit 1
fi

if [[ $ASSUME_YES -eq 0 ]]; then
  echo "This deletes ALL users, orders and dishes in database '$DB_NAME', including accounts you registered."
  read -r -p "Type yes to continue: " answer
  if [[ "$answer" != "yes" ]]; then
    echo "Cancelled. Nothing was changed."
    exit 1
  fi
fi

# Import a .sql file, pointing it at DB_NAME when that is not the default database
import() {
  sed -E "s/^(CREATE DATABASE IF NOT EXISTS |USE )foodhub/\1$DB_NAME/" "$SQL_DIR/$1" | "$MYSQL" -uroot
}

echo "Making sure the tables exist ..."
import schema.sql

echo "Emptying tables and resetting counters ..."
"$MYSQL" -uroot "$DB_NAME" -e "
  SET FOREIGN_KEY_CHECKS = 0;
  TRUNCATE TABLE order_items;
  TRUNCATE TABLE orders;
  TRUNCATE TABLE menu_items;
  TRUNCATE TABLE users;
  SET FOREIGN_KEY_CHECKS = 1;"

if [[ $SEED -eq 1 ]]; then
  echo "Loading seed.sql ..."
  import seed.sql
fi

echo "Done. Rows and next AUTO_INCREMENT value per table:"
"$MYSQL" -uroot "$DB_NAME" -e "
  SELECT 'users' AS tbl, COUNT(*) AS row_count, (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users') AS next_id FROM users
  UNION ALL SELECT 'menu_items', COUNT(*), (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items') FROM menu_items
  UNION ALL SELECT 'orders', COUNT(*), (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders') FROM orders
  UNION ALL SELECT 'order_items', COUNT(*), (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items') FROM order_items"
