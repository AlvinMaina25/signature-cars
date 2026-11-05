<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Project: Signature Cars Limited

- Brand: **Signature Cars Limited** (Nairobi dealership selling and importing new and used
  vehicles from Japan). The site was previously branded "Eric Car Deals" (and earlier still
  "AuraAuto / Aura Motors") — do not reintroduce those names.
- All business info (name, address, phones, email, socials, WhatsApp/map helpers)
  comes from `src/config/brand.ts`. Never hardcode contact details elsewhere.
- Do not invent business facts (awards, statistics, testimonials, staff names,
  opening hours, nationwide claims). Use a `TODO(client)` placeholder instead.
- The only intentional remaining reference to an old brand is the legacy
  `ericcardeals.favorites` localStorage key in `src/services/favorites.ts`, kept for
  the one-time favorites migration.
- Keep the existing architecture, routes, database schema, auth and payments intact.

## Logo & visual identity

- The single logo component is `src/components/Logo.tsx`
  (`<Logo variant="full|mark" size="sm|md|lg|number" />`). Use it in headers,
  footers, auth and admin surfaces — never re-create the mark or wordmark by hand.
  It draws the mark as inline SVG with the existing CSS tokens (brand, foreground,
  accent) and takes the wordmark text from `brand.wordmark`.
- Static copies for favicons, social images and external use live in `public/`:
  `logo.svg`, `logo-mark.svg`, `favicon.svg`, `favicon.ico`, `favicon.png`,
  `apple-touch-icon.png` (180×180) and `og-image.png` (1200×630). They use the hex
  equivalents of the same tokens; `logo.svg` renders its wordmark as live `<text>` in Sora
  (with a system-font fallback, since `<img>` SVGs cannot load webfonts). If the
  mark changes, update `Logo.tsx` and these files together.
- The wordmark in `Logo.tsx` is live text in the heading font, so the wordmark in
  `logo.svg` is drawn in that same font (Sora: 700 for "SIGNATURE", 500 for
  "CARS"). If the heading font changes, redraw both so they still match `Logo.tsx`.
- Do not introduce new brand colours in the logo or its assets.
- The footer hides business hours while `brand.hours` still starts with
  "TODO" — never invent hours, just fill in `src/config/brand.ts`.

## Typography

- Heading font: **Sora**. Body font: **Inter**. Both are self-hosted variable fonts from
  Fontsource (`@fontsource-variable/*`), with `font-display: swap`. Do not add Google Fonts
  `<link>`s or other font CDNs.
- Use the `font-heading` and `font-body` utilities, never a font name. Every `h1`–`h4` already
  gets the heading font from the base layer in `src/styles.css`; add `font-heading` only to
  non-heading text that should match (prices, stats, card titles). Body text and form fields
  inherit the body font. Do not reintroduce `font-grotesk` or Space Grotesk.
- Font families are named in one place: the **FONT CONFIG** block at the top of `src/styles.css`.
  The only other font reference is the preload import in `src/config/fonts.ts`, which preloads
  the heading font's Latin file (the single variable file covers every weight) and nothing else.
  To change a font: install the new `@fontsource-variable/*` package, update the `@import` and
  family name in the FONT CONFIG block, update the preload import in `src/config/fonts.ts`,
  then redraw the wordmark in `logo.svg` and `og-image.png` (see Logo above).
- The fallback stack (`--font-fallback`) is native system fonts, so text is visible straight away
  and still readable if a font file fails to load.

## SEO

- Page titles/descriptions/Open Graph tags come from `pageMeta()` in `src/config/brand.ts`; canonicals from
  `canonicalLinks()`. Every public route calls both. Private/auth routes use `noIndexMeta`. Titles must name
  "Signature Cars Limited" and, where natural, "Nairobi"; each route's description must be unique.
- The `AutoDealer` JSON-LD is built by `autoDealerJsonLd()` in `src/lib/seo.ts` and rendered once in
  `src/routes/__root.tsx`. Do not add another `AutoDealer`/`LocalBusiness` block in a child route.
- `robots.txt` and `sitemap.xml` are server routes (`src/routes/robots[.]txt.ts`, `src/routes/sitemap[.]xml.ts`),
  not files in `public/` — a static `public/robots.txt` would shadow the route. Do not re-add one.
- Absolute URLs (canonical, `og:url`, `og:image`, JSON-LD `url`/`logo`, the `Sitemap:` line, the sitemap itself) only
  appear once `brand.siteUrl` is a valid `https://` URL. Never hardcode or guess a domain.
- JSON-LD `telephone` and `openingHours` stay out until `brand.seo.publishTelephone` is set to `true` and
  `brand.seo.openingHours` is filled in. Setup checklist: `docs/SEO.md`.
