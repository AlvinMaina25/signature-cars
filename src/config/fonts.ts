/**
 * Signature Cars Limited — font loading config.
 *
 * Font families and @font-face rules live in the FONT CONFIG block at the top of
 * `src/styles.css` (Fontsource variable fonts, `font-display: swap`). This file
 * holds the one thing CSS cannot do: preload the font file the first screen needs.
 *
 * Only the heading font is preloaded. The variable woff2 is a single file that
 * covers every weight (100–800), so there is no per-weight file to choose between.
 * Heading text is the largest on the page and the one that differs most from the
 * system fallback, so it is the swap a visitor would notice. The body font (Inter)
 * is close to the system fallback and loads normally, without preload, so it does
 * not compete with the hero image and the CSS for bandwidth.
 *
 * Keep the import below in step with the `@import` in `src/styles.css`. Use the
 * Latin subset: it is the only one the site's English and Swahili text needs
 * on first paint (other subsets are fetched on demand through `unicode-range`).
 */
import headingFontLatin from "@fontsource-variable/sora/files/sora-latin-wght-normal.woff2?url";

/** `<link rel="preload">` entries for the root route's `head().links`. */
export const fontPreloadLinks = [
  {
    rel: "preload",
    href: headingFontLatin,
    as: "font",
    type: "font/woff2",
    // Fonts are always fetched in CORS mode; without this the preload is not reused.
    crossOrigin: "anonymous",
  },
] as const;
