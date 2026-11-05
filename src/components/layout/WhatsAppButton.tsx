import { MessageCircle } from "lucide-react";

import { brand, whatsappLink } from "@/config/brand";
import { useWhatsAppButtonVisible } from "@/hooks/useWhatsAppButton";

/**
 * Floating "chat on WhatsApp" button, rendered once from the root route.
 *
 * - The destination always comes from `whatsappLink()` in `src/config/brand.ts`.
 * - Hidden on admin pages (see `useWhatsAppButtonVisible`).
 * - Fixed bottom-right. `SiteFooter` reserves space under its last row while this
 *   button is visible, so the button never sits on top of footer content when the
 *   page is scrolled to the end.
 * - z-40 keeps it above page content and the header (z-30) but below dialogs and
 *   sheets (z-50), so overlays still cover it.
 * - The pulse ring is decorative; `prefers-reduced-motion` turns it off in
 *   `styles.css`.
 */
export function WhatsAppButton() {
  const visible = useWhatsAppButtonVisible();
  if (!visible) return null;

  return (
    <a
      href={whatsappLink(`Hello ${brand.name}, I would like to ask about a car.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${brand.name} on WhatsApp`}
      className="fixed right-4 bottom-4 z-40 grid size-12 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-glass transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:right-6 md:bottom-6 md:size-14 print:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-whatsapp-pulse rounded-full bg-whatsapp opacity-0"
      />
      <MessageCircle className="relative size-6 md:size-7" aria-hidden="true" />
    </a>
  );
}
