-- Seller-submitted listings.
--
-- Ordinary (non-admin) users can now submit a car for sale through /sell.
-- Every submission lands with review_status = 'pending' and is invisible to
-- the public until an admin approves it. Run this once in the Supabase
-- SQL Editor.
--
-- Mirrors the project's existing RLS convention: a public SELECT policy for
-- what's visible to everyone, an "Admins manage <table>" ALL policy (already
-- in place, untouched), and now a narrow, explicit policy for what a seller
-- can do to their own submission.

create type public.review_status as enum ('pending', 'approved', 'rejected');

alter table public.cars
  add column seller_id uuid references auth.users(id) on delete set null,
  add column review_status public.review_status not null default 'approved',
  add column review_note text;

create index cars_seller_id_idx on public.cars (seller_id);
create index cars_review_status_idx on public.cars (review_status);

-- Public listings only ever show approved cars now (previously: all cars).
drop policy "Cars are publicly readable" on public.cars;
create policy "Cars are publicly readable" on public.cars
  for select using (review_status = 'approved');

-- A seller can see their own submissions at any review status, so they can
-- track "pending" / "rejected" in their account area.
create policy "Sellers view own cars" on public.cars
  for select to authenticated using (seller_id = auth.uid());

-- A seller can submit a car, but only ever as themself, only ever pending
-- review, and never pre-featured — they cannot self-approve or self-promote.
create policy "Sellers submit cars" on public.cars
  for insert to authenticated with check (
    seller_id = auth.uid()
    and review_status = 'pending'
    and featured = false
  );

-- car_images: same "approved only" rule for the public, plus sellers can
-- manage (add/replace/remove) photos on their own still-pending submission.
drop policy "Car images are publicly readable" on public.car_images;
create policy "Car images are publicly readable" on public.car_images
  for select using (
    exists (
      select 1 from public.cars c
      where c.id = car_images.car_id and c.review_status = 'approved'
    )
  );

create policy "Sellers manage own pending car images" on public.car_images
  for all to authenticated
  using (
    exists (
      select 1 from public.cars c
      where c.id = car_images.car_id and c.seller_id = auth.uid() and c.review_status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.cars c
      where c.id = car_images.car_id and c.seller_id = auth.uid() and c.review_status = 'pending'
    )
  );
