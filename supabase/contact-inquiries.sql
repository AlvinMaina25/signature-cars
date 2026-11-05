-- Contact-page messages in the Inquiries list.
--
-- Run this once in the Supabase SQL Editor (safe to re-run).
--
-- The Contact page covers things that are not about one car (financing,
-- trade-in appraisals, sourcing requests), so:
--   1. an inquiry no longer has to belong to a car (car_id becomes optional)
--   2. inquiries get a "topic" column, filled in from the Contact form
--   3. inquiries are published to Supabase Realtime so new messages appear on
--      the admin Inquiries page without a reload
-- Existing inquiries are untouched.

alter table public.inquiries alter column car_id drop not null;

alter table public.inquiries add column if not exists topic text;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'inquiries'
  ) then
    alter publication supabase_realtime add table public.inquiries;
  end if;
end $$;
