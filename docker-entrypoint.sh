#!/bin/sh
set -e

echo "→ Applying database migrations..."
npx prisma migrate deploy

echo "→ Starting application... (default admin comes from ADMIN_EMAIL/ADMIN_PASSWORD)"
exec "$@"
