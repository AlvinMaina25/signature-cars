import { Facebook, Instagram } from "lucide-react";

import { brand } from "@/config/brand";

/**
 * Instagram + Facebook icon links. Open in a new tab, driven by brand config.
 * A link is hidden when its URL is empty, and the whole group when both are.
 */
export function SocialLinks({ className = "" }: { className?: string }) {
  const instagram = brand.social.instagram.trim();
  const facebook = brand.social.facebook.trim();
  if (!instagram && !facebook) return null;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${brand.name} on Instagram`}
          className="icon-btn size-9"
        >
          <Instagram className="size-4" aria-hidden="true" />
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${brand.name} on Facebook`}
          className="icon-btn size-9"
        >
          <Facebook className="size-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
