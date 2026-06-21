#!/bin/bash
set -e

# Run user migrations from /app/backend/migrations at DB initialization time.
# Tracks applied migrations in public.schema_migrations so this script is
# safe to re-run and stays consistent with the on-demand utils/migrate.sh tool.

PGUSER="supabase_admin"

run_psql() {
    psql -v ON_ERROR_STOP=1 --username "$PGUSER" -d "$POSTGRES_DB" "$@"
}

echo "==> Ensuring migration tracking table exists..."
run_psql -c "
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
"

echo "==> Applying user migrations from /app/backend/migrations..."
for sql in /app/backend/migrations/*.sql; do
    [ -f "$sql" ] || continue
    filename="$(basename "$sql")"

    already_applied=$(run_psql -tAc \
        "SELECT COUNT(1) FROM public.schema_migrations WHERE filename = '$filename';")

    if [ "$already_applied" -gt "0" ]; then
        echo "  SKIP $filename (already applied)"
    else
        echo "  APPLY $filename ..."
        run_psql -f "$sql"
        run_psql -c \
            "INSERT INTO public.schema_migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING;"
        echo "  DONE $filename"
    fi
done

echo "==> All migrations complete."
