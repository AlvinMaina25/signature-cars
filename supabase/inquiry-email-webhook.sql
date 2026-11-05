-- Email the business on every new inquiry.
--
-- Before running this:
--   1. Deploy the Edge Function:   supabase functions deploy notify-inquiry
--   2. Set its secrets:
--        supabase secrets set RESEND_API_KEY=... WEBHOOK_SECRET=<long random string> \
--          NOTIFY_TO=<TODO client email> NOTIFY_FROM="Signature Cars Limited <onboarding@resend.dev>"
--   3. Replace the SAME random string below (REPLACE_WITH_WEBHOOK_SECRET).
--
-- Then run this once in the Supabase SQL Editor (safe to re-run).
-- Equivalent to creating a Database Webhook in Dashboard > Database > Webhooks.

drop trigger if exists notify_inquiry_email on public.inquiries;

create trigger notify_inquiry_email
  after insert on public.inquiries
  for each row
  execute function supabase_functions.http_request(
    'https://cncbkomkqtifuxdgkhuw.supabase.co/functions/v1/notify-inquiry',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"REPLACE_WITH_WEBHOOK_SECRET"}',
    '{}',
    '5000'
  );
