/**
 * SEO builders: AutoDealer JSON-LD, robots.txt and sitemap.xml.
 *
 * Every business detail comes from `src/config/brand.ts`. Nothing here may
 * invent a value: anything the client has not verified (domain, telephone,
 * opening hours) is left out until `brand.ts` says otherwise.
 */

import { brand, getSiteUrl, hasSiteUrl } from "@/config/brand";

/** Public, indexable pages listed in the sitemap. Vehicle pages are added from the database. */
export const sitemapStaticPaths = ["/", "/browse", "/about", "/contact", "/financing"] as const;

/** Vehicle statuses that still have a public listing page worth indexing. */
export const sitemapVehicleStatuses = ["available", "reserved"] as const;

/**
 * schema.org `AutoDealer` structured data for the root layout.
 * - `url`, `@id`, `logo` and `image` need an absolute URL, so they only appear
 *   once a valid domain is set in `brand.siteUrl`.
 * - `telephone` only appears when `brand.seo.publishTelephone` is true.
 * - `openingHours` only appears when `brand.seo.openingHours` is non-empty.
 */
export function autoDealerJsonLd(): Record<string, unknown> {
  const origin = hasSiteUrl() ? getSiteUrl() : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    ...(origin ? { "@id": `${origin}/#autodealer`, url: origin } : {}),
    name: brand.name,
    ...(origin ? { logo: `${origin}/logo.svg`, image: `${origin}/og-image.png` } : {}),
    ...(brand.email ? { email: brand.email } : {}),
    ...(brand.seo.publishTelephone ? { telephone: brand.phones.primary.international } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressCountry: brand.address.country,
    },
    ...(brand.seo.openingHours.length > 0 ? { openingHours: [...brand.seo.openingHours] } : {}),
    sameAs: [brand.social.instagram, brand.social.facebook].filter((url) => url.trim() !== ""),
  };
}

/** Serialises JSON-LD for a `<script type="application/ld+json">`, escaping `<` so it cannot close the tag. */
export function jsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * robots.txt body. The `Sitemap:` line needs an absolute URL, so it is only
 * written once a valid domain is set in `brand.siteUrl`.
 */
export function robotsTxt(): string {
  const lines = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /account", ""];
  if (hasSiteUrl()) lines.push(`Sitemap: ${getSiteUrl()}/sitemap.xml`, "");
  return lines.join("\n");
}

export type SitemapEntry = { path: string; lastmod?: string | undefined };

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** sitemap.xml body. Callers must check `hasSiteUrl()` first; every `<loc>` is absolute. */
export function sitemapXml(entries: SitemapEntry[]): string {
  const origin = getSiteUrl();
  const urls = entries.map(({ path, lastmod }) => {
    const loc = xmlEscape(`${origin}${path === "/" ? "" : path}`);
    const mod = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
    return `  <url><loc>${loc}</loc>${mod}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
