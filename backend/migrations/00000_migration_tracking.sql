-- Migration tracking table
-- This must be the first migration applied (00000_ prefix).
-- It records every migration that has been successfully executed.
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    filename  VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
