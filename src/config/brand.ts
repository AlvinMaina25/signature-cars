/**
 * Signature Cars Limited — central brand configuration.
 *
 * Single source of truth for every piece of business information shown on the
 * site (name, contact details, social links, location). Import from here
 * instead of hardcoding details in components or routes.
 *
 * Anything marked TODO(client) has NOT been supplied by the client yet.
 * Do not invent values — ask the client, then replace the placeholder here.
 */

export const brand = {
  name: "Signature Cars Limited",

  /** Wordmark split used by the header/auth logo: plain part + accented part. */
  wordmark: { plain: "SIGNATURE", accent: "CARS" },

  /** Single letter shown in the small logo tile next to the wordmark. */
  monogram: "S",

  /** Supplied by the client: dealership profile (see the site's About page). */
  tagline: "Sale and importation of new and used vehicles from Japan — Ngong Road, Nairobi",

  address: {
    /** Single-line address for display. */
    full: "Ngong Road, near Jamhuri, opposite Impala Club, next to Junction Mall, Nairobi, Kenya",
    street: "Ngong Road (near Jamhuri / opposite Impala Club, next to Junction Mall)",
    /** Road/area name for use inside sentences. */
    area: "Ngong Road",
    city: "Nairobi",
    country: "Kenya",
    /**
     * Search text used for the map embed and directions. This is a text
     * search, so the pin is approximate.
     * TODO(client): supply the exact Google Maps pin or coordinates.
     */
    mapQuery: "Junction Mall, Ngong Road, Nairobi, Kenya",
  },

  /** Primary line first; the two extra contact numbers follow in order. */
  phones: {
    primary: { display: "+254 722 736522", international: "+254722736522" },
    secondary: { display: "+254 729 279995", international: "+254729279995" },
    tertiary: { display: "+254 721 933049", international: "+254721933049" },
  },

  /** TODO(client): email address not supplied yet. Empty hides email links. */
  email: "",

  /** Supplied by the client (verified from their business profile). */
  hours: "Mon – Sat: 9:00 AM – 6:00 PM · Sun: 12:00 PM – 6:00 PM",

  /** TODO(client): social profiles not supplied yet. Empty hides the icons. */
  social: {
    instagram: "",
    facebook: "",
  },

  /**
   * Public site URL. TODO(client): domain was not provided.
   * Set to the production origin, e.g. "https://<client-domain>" (https only).
   * Until a valid https:// URL is set here, canonical links, `og:url`,
   * `og:image`, the sitemap and the JSON-LD `url`/`logo` are all left out, and
   * `getSiteUrl()` falls back to the address of the page the visitor is on.
   */
  siteUrl: "TODO(client): domain",

  /**
   * Switches for the structured data (JSON-LD) built in `src/lib/seo.ts`.
   * Nothing here is published until the client has verified it.
   */
  seo: {
    /** Phone numbers come from the client's verified business profile. */
    publishTelephone: true as boolean,
    /**
     * schema.org `openingHours` strings matching `hours` above.
     * An empty list means no `openingHours` is published.
     */
    openingHours: ["Mo-Sa 09:00-18:00", "Su 12:00-18:00"] as readonly string[],
  },

  currency: "KES",
} as const;

/** All phone numbers in display order, handy for mapping over. */
export const brandPhones = [
  brand.phones.primary,
  brand.phones.secondary,
  brand.phones.tertiary,
] as const;

/** `tel:` link for an international-format number. */
export function telLink(international: string): string {
  return `tel:${international}`;
}

/**
 * WhatsApp click-to-chat link for the primary number.
 * Format: https://wa.me/<number>?text=<encoded>. The number is digits only,
 * with country code and no "+" (WhatsApp requirement).
 */
export function whatsappLink(message?: string): string {
  const number = brand.phones.primary.international.replace(/\D/g, "");
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Google Maps embed (no API key) for the supplied Ngong Road location. */
export function mapEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(brand.address.mapQuery)}&output=embed`;
}

/** Opens Google Maps with directions to the business. */
export function directionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    brand.address.mapQuery,
  )}`;
}

/**
 * The configured production origin ("https://example.com", no path), or
 * undefined while `brand.siteUrl` is still the TODO(client) placeholder or is
 * not a valid https:// URL with a real host. Everything that needs an absolute
 * URL goes through this so an invalid value can never leak into canonicals,
 * the sitemap or structured data.
 */
function configuredOrigin(): string | undefined {
  try {
    const url = new URL(brand.siteUrl);
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/**
 * Site origin for building absolute links (e.g. in WhatsApp messages).
 * Uses `brand.siteUrl` once the client supplies a real https:// domain;
 * otherwise the current page's origin in the browser, or "" on the server.
 */
export function getSiteUrl(): string {
  const origin = configuredOrigin();
  if (origin) return origin;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** True once the client has supplied a valid https:// domain in `brand.siteUrl`. */
export function hasSiteUrl(): boolean {
  return configuredOrigin() !== undefined;
}

/**
 * Canonical `<link>` for a path, e.g. canonicalLinks("/about").
 * Returns an empty list until a real domain is set in `brand.siteUrl`
 * (TODO(client): domain), because a canonical URL must be absolute and a
 * guessed one would point search engines at the wrong place.
 */
export function canonicalLinks(path: string): { rel: "canonical"; href: string }[] {
  if (!hasSiteUrl()) return [];
  return [{ rel: "canonical", href: `${getSiteUrl()}${path === "/" ? "" : path}` }];
}

/**
 * Title, description, Open Graph and Twitter tags for a page, kept in one place
 * so they cannot drift apart. `og:url` and `og:image` are only emitted once a
 * real domain exists (they must be absolute URLs).
 */
export type MetaTag =
  { title: string } | { name: string; content: string } | { property: string; content: string };

export function pageMeta(opts: { title: string; description: string; path?: string }): MetaTag[] {
  const { title, description, path } = opts;
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: brand.name },
    { property: "og:locale", content: "en_KE" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (hasSiteUrl()) {
    // public/og-image.png is the 1200x630 brand share image (see AGENTS.md).
    const image = `${getSiteUrl()}/og-image.png`;
    if (path !== undefined) {
      meta.push({ property: "og:url", content: `${getSiteUrl()}${path === "/" ? "" : path}` });
    }
    meta.push(
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${brand.name} logo` },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: `${brand.name} logo` },
    );
  }
  return meta;
}

/** Keeps private/auth pages (admin, account, sign-in) out of search results. */
export const noIndexMeta = { name: "robots", content: "noindex, nofollow" } as const;
