# Signature Cars Limited

Website for **Signature Cars Limited**, a Nairobi dealership selling and importing new and
used vehicles from Japan (Ngong Road, near Jamhuri, opposite Impala Club, next to Junction Mall).

Built with TanStack Start, React, TypeScript, Tailwind CSS and Supabase.
Originally generated with [Lovable](https://lovable.dev) and kept in sync with it.

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run format`, `npm test`.
Type-check with `npx tsc --noEmit`.

## Business information

All business details (name, address, phone numbers, email, social links, WhatsApp
link helper, map links) live in one file: [`src/config/brand.ts`](src/config/brand.ts).
Import from there instead of hardcoding contact details.

Items still waiting on the client are marked `TODO(client)` — search the codebase
for that marker (business hours, tagline approval, domain, exact map pin).

## Admin guide

How to manage vehicles, images, enquiries and reservations: [`docs/ADMIN.md`](docs/ADMIN.md).

## SEO

Page titles, descriptions, Open Graph and Twitter tags come from `pageMeta()` in
`src/config/brand.ts`. Canonical URLs, `og:url` and share images are emitted only
once `brand.siteUrl` is set to the real domain (`TODO(client)`). Admin, account
and sign-in pages are marked `noindex`.

## Legacy identifiers

The favorites `localStorage` key is `ericcardeals.favorites` (kept on purpose so existing
visitors' saved cars are not lost). The older `auraauto.favorites` key is also still read in
`src/services/favorites.ts` so those saved cars are migrated once.
Database tables and storage bucket IDs were not renamed.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase
