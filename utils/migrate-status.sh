#!/usr/bin/env bash
# utils/migrate-status.sh
#
# Shows which migrations have been applied and which are pending.
# Does NOT apply anything.
#
# Usage:
#   sh utils/migrate-status.sh     # from project root
#   pnpm run db:migrate:status

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
set -e
set -o pipefail

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
# Ensure tracking table exists (read-only intent, but table must exist)
# ---------------------------------------------------------------------------
run_psql -c "
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);" > /dev/null 2>&1

# ---------------------------------------------------------------------------
# Print status
# ---------------------------------------------------------------------------
SEPARATOR="────────────────────────────────────────────────────────────────"

echo ""
echo "  Migration Status"
echo "  $SEPARATOR"
printf "  %-5s %-50s %s\n" "State" "Filename" "Executed At"
echo "  $SEPARATOR"

total=0
applied_count=0
pending_count=0

for sql_path in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$sql_path" ] || continue
    filename="$(basename "$sql_path")"
    total=$((total + 1))

    row=$(run_psql -tAc \
        "SELECT executed_at FROM public.schema_migrations WHERE filename = '$filename';")

    if [ -n "$row" ]; then
        printf "  %-5s %-50s %s\n" "✓" "$filename" "$row"
        applied_count=$((applied_count + 1))
    else
        printf "  %-5s %-50s %s\n" "●" "$filename" "(pending)"
        pending_count=$((pending_count + 1))
    fi
done

echo "  $SEPARATOR"
echo "  Total: $total  |  Applied: $applied_count  |  Pending: $pending_count"
echo ""

if [ "$pending_count" -gt 0 ]; then
    echo "  Run 'pnpm run db:migrate' to apply pending migrations."
    echo ""
fi
