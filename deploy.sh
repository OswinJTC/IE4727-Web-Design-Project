#!/usr/bin/env bash
# Copy this project into XAMPP's htdocs so Apache serves it.
# Usage: ./deploy.sh
set -euo pipefail

DEST="/Applications/XAMPP/xamppfiles/htdocs/IE4727/project"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

rsync -a --itemize-changes \
  --exclude='.git' --exclude='.claude' --exclude='.gitignore' \
  --exclude='.DS_Store' --exclude='deploy.sh' \
  --exclude='database_erd.png' --exclude='*.sql' \
  "$SRC"/ "$DEST"/

echo "Deployed to $DEST"
echo "Open: http://localhost:8000/IE4727/project/  (use your Apache port; omit it if 80)"
