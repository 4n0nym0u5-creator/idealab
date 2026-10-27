#!/bin/sh
set -e
mkdir -p "${PGLITE_PATH:-/data/pglite}" "${BACKUP_DIR:-/data/backups}"
if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_URL" ]; then
  echo "Migrating Postgres and seeding it if empty"
  npm run db:setup
fi
exec npm start
