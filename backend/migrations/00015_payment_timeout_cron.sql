-- Migration 00015_payment_timeout_cron.sql
-- Enables pg_cron and creates a scheduled job to expire pending payments after 10 minutes

-- 1. Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Safely unschedule if the job already exists to make this migration idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('expire_pending_payments');
EXCEPTION WHEN OTHERS THEN
  -- Ignore error if the job does not exist yet
END;
$$;

-- 3. Schedule the cron job to run every minute
SELECT cron.schedule(
    'expire_pending_payments',
    '* * * * *',
    $$
        UPDATE payments 
        SET status = 'FAILED', updated_at = NOW() 
        WHERE status = 'PENDING' 
        AND created_at < NOW() - INTERVAL '10 minutes';
    $$
);
