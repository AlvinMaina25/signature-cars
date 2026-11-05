-- Vehicle image uploads: public Storage bucket + RLS.
--
-- Run this once in the Supabase SQL Editor for the "auto cars" project
-- (Project Settings -> SQL Editor). It is not wired into the drizzle
-- migration flow because storage.* is a Supabase-managed schema, not part
-- of drizzle/schema.ts — same reason the earlier car_images URL fix was
-- applied as a manual SQL statement rather than a drizzle migration.
--
-- Mirrors the existing RLS convention used for every other table in this
-- project (see drizzle/migrations/0000_recreate_marketplace_schema.sql):
--   "<table> are publicly readable"  -> SELECT, role public
--   "Admins manage <table>"          -> ALL,    role authenticated, gated by has_role()

-- 1. Create the bucket (public, so getPublicUrl() works with no signing).
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

-- 2. Public read.
create policy "Vehicle images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'vehicle-images');

-- 3. Admin-only writes (insert/update/delete), reusing the has_role() function
--    already defined for the rest of the app.
create policy "Admins manage vehicle images"
on storage.objects
for all
to authenticated
using (bucket_id = 'vehicle-images' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'vehicle-images' and public.has_role(auth.uid(), 'admin'));
