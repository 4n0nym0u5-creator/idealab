#!/bin/sh
set -e
mkdir -p "$(dirname "$DATABASE_PATH")" "$BACKUP_DIR"
if [ ! -f "$DATABASE_PATH" ]; then
  echo "Seeding $DATABASE_PATH"
  npm run db:setup
fi
exec npm start
