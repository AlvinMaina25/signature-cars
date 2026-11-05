-- Reservation / payment / car status sync + realtime.
--
-- Run this once in the Supabase SQL Editor (it is safe to re-run).
-- Like supabase/storage-vehicle-images.sql it is applied by hand, not via
-- the drizzle migration flow.
--
-- What it does
--   1. reservation -> confirmed  : car becomes "reserved"
--      reservation -> cancelled  : car goes back to "available" (never touches a
--                                  car that is already "sold"); open payments
--                                  (pending/processing) become "cancelled" and
--                                  successful payments become "refunded"
--   2. payment -> successful     : a still-"pending" reservation becomes "confirmed"
--      (which in turn reserves the car, via rule 1)
--   3. customers may only cancel their own reservation (they can no longer set
--      any other status from the browser)
--   4. reservations, payments and cars are published to Supabase Realtime so open
--      pages refresh by themselves
--
-- The rules live in the database so they hold no matter who changes a status:
-- the admin screens, a customer cancelling, or a future M-Pesa callback.

-- ---------------------------------------------------------------------------
-- 1. Reservation status changes -> car + payments
-- ---------------------------------------------------------------------------
create or replace function public.sync_on_reservation_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'confirmed' then
    update public.cars
       set status = 'reserved'
     where id = new.car_id
       and status = 'available';

  elsif new.status = 'cancelled' then
    update public.cars
       set status = 'available'
     where id = new.car_id
       and status = 'reserved';

    update public.payments
       set status = 'cancelled'
     where reservation_id = new.id
       and status in ('pending', 'processing');

    update public.payments
       set status = 'refunded'
     where reservation_id = new.id
       and status = 'successful';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_sync_status on public.reservations;
create trigger reservations_sync_status
  after update of status on public.reservations
  for each row execute function public.sync_on_reservation_status();

-- ---------------------------------------------------------------------------
-- 2. Payment cleared -> reservation confirmed
-- ---------------------------------------------------------------------------
create or replace function public.sync_on_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'successful' then
    update public.reservations
       set status = 'confirmed'
     where id = new.reservation_id
       and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_sync_status on public.payments;
create trigger payments_sync_status
  after update of status on public.payments
  for each row execute function public.sync_on_payment_status();

-- These functions are triggers only; nobody should call them directly.
revoke all on function public.sync_on_reservation_status() from public, anon, authenticated;
revoke all on function public.sync_on_payment_status() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Customers can only cancel their own open reservation
--    (before: they could write any status on their own row)
-- ---------------------------------------------------------------------------
drop policy if exists "Users cancel own reservations" on public.reservations;
create policy "Users cancel own reservations" on public.reservations
  for update to authenticated
  using (auth.uid() = user_id and status in ('pending', 'confirmed'))
  with check (auth.uid() = user_id and status = 'cancelled');

-- ---------------------------------------------------------------------------
-- 4. Realtime
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['reservations', 'payments', 'cars'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
