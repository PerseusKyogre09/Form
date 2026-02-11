-- V1 Anti-Abuse: device-based single submission + IP rate limiting

-- 1. Add device_id column to form_responses
ALTER TABLE public.form_responses ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Partial unique index: one submission per (form_id, device_id), ignoring NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_responses_device
  ON public.form_responses (form_id, device_id)
  WHERE device_id IS NOT NULL;

-- 2. Rate limit log table (stores only hashed IPs, never raw)
CREATE TABLE IF NOT EXISTS public.ip_rate_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  form_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ip_rate_log_lookup
  ON public.ip_rate_log (ip_hash, created_at);

-- RLS
ALTER TABLE public.ip_rate_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert" ON public.ip_rate_log;
CREATE POLICY "Allow anon insert"
  ON public.ip_rate_log FOR INSERT
  WITH CHECK (true);

GRANT INSERT ON public.ip_rate_log TO anon, authenticated;

-- Cleanup function: delete rate log entries older than 2 hours
-- Call this via pg_cron or a scheduled function
CREATE OR REPLACE FUNCTION public.cleanup_rate_log()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ip_rate_log WHERE created_at < now() - interval '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
