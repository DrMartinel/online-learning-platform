#!/usr/bin/env bash
# utils/migrate.sh
#
# On-demand migration runner. Applies any pending SQL migrations from
# backend/migrations/ to the running Supabase DB container.
#
# Usage:
#   sh utils/migrate.sh            # from project root
#   pnpm run db:migrate
#
# Requirements:
#   - The supabase-db container must be running.
#   - POSTGRES_PASSWORD and POSTGRES_DB must be set in .env
#   - ADMIN_EMAIL and ADMIN_PASSWORD are optional (used by seed migrations).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/backend/migrations"
ENV_FILE="$PROJECT_ROOT/.env"

# ---------------------------------------------------------------------------
# Load .env values
# ---------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE" >&2
    exit 1
fi

set +e
set +o pipefail
POSTGRES_PASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)"
ADMIN_EMAIL="$(grep -E '^ADMIN_EMAIL=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)"
ADMIN_PASSWORD="$(grep -E '^ADMIN_PASSWORD=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)"
set -e
set -o pipefail

# Fallback defaults for admin credentials
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@1234}"

if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
    echo "ERROR: POSTGRES_PASSWORD or POSTGRES_DB not found in $ENV_FILE" >&2
    exit 1
fi

DB_CONTAINER="supabase-db"
PGUSER="supabase_admin"

# ---------------------------------------------------------------------------
# Verify the container is running
# ---------------------------------------------------------------------------
if ! docker inspect --format='{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q "true"; then
    echo "ERROR: Container '$DB_CONTAINER' is not running. Start the stack first." >&2
    exit 1
fi

# Helper: run a psql command inside the container
run_psql() {
    docker exec -i "$DB_CONTAINER" \
        env PGPASSWORD="$POSTGRES_PASSWORD" \
        psql -v ON_ERROR_STOP=1 \
             --username "$PGUSER" \
             --dbname "$POSTGRES_DB" \
             --no-password \
             "$@"
}

# ---------------------------------------------------------------------------
# Ensure tracking table exists
# ---------------------------------------------------------------------------
echo "==> Ensuring migration tracking table exists..."
run_psql -c "
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
"

# ---------------------------------------------------------------------------
# Apply pending migrations
# ---------------------------------------------------------------------------
echo "==> Scanning migrations in $MIGRATIONS_DIR ..."

applied=0
skipped=0
failed=0

for sql_path in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$sql_path" ] || continue
    filename="$(basename "$sql_path")"

    already_applied=$(run_psql -tAc \
        "SELECT COUNT(1) FROM public.schema_migrations WHERE filename = '$filename';")

    if [ "$already_applied" -gt "0" ]; then
        echo "  [ SKIP ] $filename"
        skipped=$((skipped + 1))
    else
        echo "  [APPLY ] $filename ..."
        # Pipe the local SQL file into psql running in the container.
        # Seed migrations can read ADMIN_EMAIL/ADMIN_PASSWORD via current_setting().
        if docker exec -i "$DB_CONTAINER" \
            env PGPASSWORD="$POSTGRES_PASSWORD" \
            psql -v ON_ERROR_STOP=1 \
                 --username "$PGUSER" \
                 --dbname "$POSTGRES_DB" \
                 --no-password \
                 -c "SET app.admin_email TO '$ADMIN_EMAIL'; SET app.admin_password TO '$ADMIN_PASSWORD';" \
                 -f - < "$sql_path"; then
            run_psql -c \
                "INSERT INTO public.schema_migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING;"
            echo "  [ DONE ] $filename"
            applied=$((applied + 1))
        else
            echo "  [ FAIL ] $filename" >&2
            failed=$((failed + 1))
            # Stop on first failure to avoid cascading issues
            break
        fi
    fi
done

echo ""
echo "==> Migration summary: $applied applied, $skipped skipped, $failed failed."

if [ "$failed" -gt 0 ]; then
    exit 1
fi
