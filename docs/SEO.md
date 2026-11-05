# SEO — client configuration before production

All values live in `src/config/brand.ts`. Until they are filled in, the site stays safe: it simply omits
anything that needs the missing value.

| Item                           | Where                                                                                              | What happens until it is set                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Domain — `TODO(client)`        | `brand.siteUrl`, e.g. `"https://<client-domain>"` (https only; a path is ignored)                  | No canonical links, `og:url`/`og:image`, JSON-LD `url`/`logo`/`image`, or `Sitemap:` line in `robots.txt`. `/sitemap.xml` answers 404. |
| Telephone — `TODO(client)`     | Confirm `brand.phones.primary`, then set `brand.seo.publishTelephone` to `true`                    | JSON-LD has no `telephone`.                                                                                                            |
| Opening hours — `TODO(client)` | `brand.hours` (shown in the footer) **and** `brand.seo.openingHours`, e.g. `["Mo-Sa 08:00-18:00"]` | JSON-LD has no `openingHours`.                                                                                                         |
| Tagline — `TODO(client)`       | `brand.tagline`                                                                                    | Proposal text stays in use.                                                                                                            |

## Before publishing

1. Set `brand.siteUrl`, then redeploy.
2. Check `https://<domain>/robots.txt` shows a `Sitemap:` line and `https://<domain>/sitemap.xml` returns XML (200).
3. View source on `/`, `/about` and a vehicle page: one `<title>`, one description, one canonical matching the page URL,
   one `application/ld+json` block.
4. Submit the sitemap in Google Search Console and Bing Webmaster Tools; validate the JSON-LD with Google's Rich Results Test.
5. Make sure the host serves the site on one canonical hostname (redirect `www`/non-`www` and `http`→`https`), matching `brand.siteUrl`.

## What is indexed

- In the sitemap: `/`, `/browse`, `/about`, `/contact`, `/financing`, and `/vehicles/<slug>` for listings with status
  `available` or `reserved` (sold listings are left out).
- `noindex`: sign-in, sign-up, password pages, `/account/*`, `/admin/*`, and the "vehicle not found" page.
- `robots.txt` also disallows `/admin` and `/account`.
