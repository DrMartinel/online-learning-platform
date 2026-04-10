#!/bin/bash
set -e

# Wait for local postgres to be ready (it should be running, as this is an init script)
# Iterate over user migrations
echo "Executing user migrations from /app/backend/migrations..."

# The postgres user is supabase_admin during migrations if using run migrations as superuser
for sql in /app/backend/migrations/*.sql; do
    if [ -f "$sql" ]; then
        echo "Running $sql..."
        psql -v ON_ERROR_STOP=1 --username "supabase_admin" -d "$POSTGRES_DB" -f "$sql"
    fi
done
