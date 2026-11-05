-- One-time conversion: the 8 demo cars currently have `price` stored as
-- USD-scale numbers (e.g. 45000). Now that the app displays KES everywhere,
-- run this once so they show a realistic KES figure instead of "Ksh 45,000".
--
-- Uses an approximate rate of 1 USD = 129 KES (mid-market, Sept 2026).
-- This is a cosmetic fix for demo data only — there's no live FX conversion
-- anywhere in the app, so new listings should just be entered directly in
-- KES going forward (which is what the updated admin form now expects).
--
-- Rounds to the nearest 1,000 KES for clean numbers.

update public.cars
set price = round(price * 129 / 1000) * 1000
where price < 1000000; -- safety guard: skip any row already in KES scale

-- Also relabel the currency code stored on any existing reservations/payments
-- test rows, so admin screens don't show "USD 150,000" next to a KES amount.
update public.reservations set currency = 'KES' where currency = 'USD';
update public.payments set currency = 'KES' where currency = 'USD';
