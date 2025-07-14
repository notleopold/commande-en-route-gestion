-- Enable extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule trash cleanup to run daily at 2 AM
SELECT cron.schedule(
  'trash-cleanup-daily',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://joxqhkwwokfygnygmbto.supabase.co/functions/v1/trash-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveHFoa3d3b2tmeWdueWdtYnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDkwMTEsImV4cCI6MjA2ODA4NTAxMX0.RDPRcAMRNsH0qfCm7DVC7pWmKRw9Pork5hyqsDDlRP8"}'::jsonb,
        body:=concat('{"scheduled_run": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);