# Signature Cars Limited — Admin Guide

This guide covers only what the admin area does today. Anything not listed here
is not built.

## Signing in

1. Go to `/login` and sign in with your email and password.
2. If your account has the `admin` role you can open `/admin`. Accounts without
   the role are sent to `/account` instead. Signed-out visitors are sent to `/login`.
3. The admin menu has five pages: **Dashboard**, **Vehicles**, **Inquiries**,
   **Reservations** and **Payments**.

Admin access is granted in Supabase, not in the app: a row in the
`user_roles` table with `role = 'admin'` for that user's `auth.users` id.
There is no screen for granting or removing the admin role.

## Adding a vehicle

1. Admin → **Vehicles** → add a vehicle (`/admin/vehicles/new`).
2. Fill in make, model, trim, year, price (KES), mileage, body style, fuel,
   transmission, engine, horsepower, 0–60 mph, drivetrain, colours, location,
   VIN, description and highlights (one per line).
3. Set **Status** (see "Availability" below). Optionally add a **Badge** and
   tick **Feature on homepage**.
4. Upload photos (see below), then save.

## Editing a vehicle

Admin → **Vehicles**, open the car (`/admin/vehicles/<id>`), change any field and
save. The same page lets you remove the vehicle (you are asked to confirm).

## Uploading vehicle images

- Photos are uploaded from the vehicle form ("Click to upload photos").
- JPEG or PNG only, up to 5 MB each.
- At least 3 and at most 8 photos per listing. The first photo is the cover image.
- Remove a photo with the × on its thumbnail.
- Files are stored in the Supabase Storage bucket `vehicle-images`
  (set up with `supabase/storage-vehicle-images.sql`; only admins can write to it).

## Vehicle availability

The **Status** field on the vehicle form has three values: `available`,
`reserved` and `sold`. Change it and save to update what visitors see.

## Reviewing seller submissions

Signed-in customers can submit a car from **Sell your car**. These appear in
Admin → **Vehicles** as _pending_. Approve or reject each one (a rejection can
carry a note that the seller sees). Only approved listings are public.

## Customer enquiries

Admin → **Inquiries** lists enquiries sent from vehicle pages, with the
customer's name, email, phone (if given) and the car. Filter by tab (all, new,
in-progress, answered, closed) and change an enquiry's status from its
drop-down. The app does not send replies: contact the customer by phone,
WhatsApp or email, then update the status.

## Reservations

Admin → **Reservations** lists reservations made on vehicle pages. Update each
one to `pending`, `confirmed`, `completed` or `cancelled`.

## Payments

Admin → **Payments** is an overview of recorded payments, where you can update
a payment's status. Live payment processing (M-Pesa, card, PayPal, bank
transfer, financing) is **not** enabled: the providers in
`src/services/payments/registry.ts` are placeholders that return
"not enabled yet".

## Accounts

- Customers create accounts at `/signup`, and can reset passwords via
  `/forgot-password`.
- Customers manage their own details at `/account/profile` and see their
  favourites, enquiries, reservations and submitted listings under `/account`.
- Admins cannot list, edit or delete customer accounts from the app; use the
  Supabase dashboard for that.

## Business configuration

Business name, address, phone numbers, email, social links, tagline, map
location, currency and site URL are all in **`src/config/brand.ts`**. This is a
code change (edit the file and redeploy); there is no settings screen.
Open items are marked `TODO(client)`:

| Item                                                      | Where                                              |
| --------------------------------------------------------- | -------------------------------------------------- |
| Business hours                                            | `brand.hours` (footer hides hours until set)       |
| Site domain (canonical URLs, share image, absolute links) | `brand.siteUrl`                                    |
| Exact map pin                                             | `brand.address.mapQuery`                           |
| Tagline approval                                          | `brand.tagline`                                    |
| About page story, financing process                       | `src/routes/about.tsx`, `src/routes/financing.tsx` |

## Identifiers that must keep their names

These contain legacy or technical names that are not shown to customers.
Renaming them would break existing data or visitors' browsers.

| Identifier                                                             | Reason                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `<old-site>.favorites` (localStorage key, `src/services/favorites.ts`) | Read once to migrate visitors' saved cars to `<todo-email>.favorites` |
| `vehicle-images` bucket, database tables                               | Existing data and policies depend on them                             |

## Alert badges

The Inquiries, Reservations and Payments menu items show a red count of items
that need attention, like unread messages: **new** inquiries, **pending**
reservations and **pending** payments. The count goes down when you change
that item's status, goes up live when something new arrives (with a small
"New inquiry" pop-up), and the total also appears in the browser tab title,
e.g. "(3) Admin". Code: `src/hooks/useAdminAlerts.ts`.
