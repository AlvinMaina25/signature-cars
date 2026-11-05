import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Signature Cars Limited logo — the single place the mark and wordmark are drawn.
 * Use this in every header, footer, auth and admin surface instead of
 * re-creating the lockup by hand.
 *
 *   <Logo />                         full lockup, default size
 *   <Logo variant="mark" size="lg" /> standalone symbol
 *   <Logo size={40} />                numeric size = mark height in px
 *
 * Colours come from the existing CSS tokens (brand, foreground, accent), so the
 * logo follows the theme. The wordmark text comes from `brand.wordmark`.
 *
 * The mark geometry matches `public/logo-mark.svg` and `public/logo.svg`
 * (static copies for favicons, social images and external use). If you change
 * one, change both.
 */

const SIZES = { sm: 32, md: 36, lg: 48 } as const;

export type LogoSize = keyof typeof SIZES | number;

export interface LogoProps {
  /** "full" = mark + wordmark, "mark" = symbol only. */
  variant?: "full" | "mark";
  /** Preset ("sm" 32px, "md" 36px, "lg" 48px) or a number: the mark's height in px. */
  size?: LogoSize;
  className?: string;
}

/** The "S": a rounded two-stroke monogram (light top sweep, accent bottom), on a tile. */
function LogoMark({ px, labelled }: { px: number; labelled: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={px}
      height={px}
      className="shrink-0"
      {...(labelled ? { role: "img", "aria-label": brand.name } : { "aria-hidden": true })}
      focusable="false"
    >
      <rect width="64" height="64" rx="15" className="fill-brand" />
      <rect
        x=".75"
        y=".75"
        width="62.5"
        height="62.5"
        rx="14.25"
        strokeWidth="1.5"
        className="fill-none stroke-accent/50"
      />
      <path
        d="M45 19H27c-6 0-9 3.5-9 7.5S23 33 32 33"
        className="fill-none stroke-foreground"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 33c9 0 14 2.5 14 6.5S43 45 37 45H19"
        className="fill-none stroke-accent"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const px = typeof size === "number" ? size : SIZES[size];

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <LogoMark px={px} labelled />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center", className)} style={{ gap: px * 0.3 }}>
      <LogoMark px={px} labelled={false} />
      <span
        className="truncate font-heading leading-none tracking-[0.045em] text-foreground"
        style={{ fontSize: px * 0.5 }}
      >
        <span className="font-bold">{brand.wordmark.plain}</span>{" "}
        <span className="font-medium text-accent">{brand.wordmark.accent}</span>
      </span>
    </span>
  );
}
