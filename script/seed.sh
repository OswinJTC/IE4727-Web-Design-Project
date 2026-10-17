#!/usr/bin/env bash
# Create the foodhub database and load the dummy data into XAMPP's MySQL.
# Usage: ./script/seed.sh [--dry-run]
# Safe to re-run: schema.sql only creates what is missing and seed.sql skips dishes that already exist.
set -euo pipefail

MYSQL="/Applications/XAMPP/xamppfiles/bin/mysql"
SQL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sql" && pwd)"
FILES=(schema.sql seed.sql)

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

if [[ ! -x "$MYSQL" ]]; then
  echo "mysql client not found at $MYSQL. Is XAMPP installed?" >&2
  exit 1
fi

# XAMPP default login: root, empty password (local testing only)
if ! "$MYSQL" -uroot -e "SELECT 1" >/dev/null 2>&1; then
  echo "Cannot connect to MySQL. In XAMPP: Manage Servers > start MySQL Database (should be green)." >&2
  exit 1
fi

for f in "${FILES[@]}"; do
  if [[ ! -f "$SQL_DIR/$f" ]]; then
    echo "Missing $SQL_DIR/$f" >&2
    exit 1
  fi
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "(dry run) would import $SQL_DIR/$f"
  else
    echo "Importing $f ..."
    "$MYSQL" -uroot < "$SQL_DIR/$f"
  fi
done

if [[ $DRY_RUN -eq 0 ]]; then
  echo "Done. Dishes per category:"
  "$MYSQL" -uroot foodhub -e "SELECT category, COUNT(*) AS dishes FROM menu_items GROUP BY category ORDER BY category"
fi
