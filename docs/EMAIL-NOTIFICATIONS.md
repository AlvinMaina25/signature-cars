# Inquiry email notifications

Every new row in `public.inquiries` (Contact page + car-page inquiries) is emailed
to the business. The row is always saved first, so an email failure never loses a
message; it still appears in Admin → Inquiries.

Flow: form → `inquiries` insert → database trigger → Edge Function
`notify-inquiry` → Resend → business inbox (Reply-To = the customer).

## One-time setup

1. Create a Resend account (use the business Gmail while there is no domain).
2. `supabase functions deploy notify-inquiry`
3. Set secrets:
   `supabase secrets set RESEND_API_KEY=... WEBHOOK_SECRET=<long random> NOTIFY_TO=<TODO client email> NOTIFY_FROM="Signature Cars Limited <onboarding@resend.dev>"`
   (`NOTIFY_TO` accepts several comma-separated addresses.)
4. Put the same `WEBHOOK_SECRET` into `supabase/inquiry-email-webhook.sql` and run it
   in the Supabase SQL Editor.
5. Test: send a Contact form message and check the inbox (and spam).

## When the real domain exists

Verify it in Resend (add the SPF + DKIM DNS records), then change `NOTIFY_FROM` to
e.g. `Signature Cars Limited <noreply@yourdomain.co.ke>`. Without a verified domain Resend
only delivers to the account owner's own email.

## Spam

Both forms have a hidden honeypot field; submissions that fill it are silently dropped.
