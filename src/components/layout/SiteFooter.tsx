import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { brand, brandPhones, telLink, whatsappLink } from "@/config/brand";
import { useWhatsAppButtonVisible } from "@/hooks/useWhatsAppButton";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  // Leave room under the last row for the fixed WhatsApp button (hidden on admin pages).
  const reserveForWhatsApp = useWhatsAppButtonVisible();

  return (
    <footer className="relative z-10 mx-auto max-w-7xl px-6">
      <div className="mt-20 grid gap-10 border-t border-border pt-10 text-sm text-mist md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="w-fit">
            <Logo size="sm" />
          </div>
          <p className="mt-3 max-w-xs leading-relaxed">{brand.tagline}</p>
          <SocialLinks className="mt-5" />
        </div>

        <ul className="space-y-3">
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <span>{brand.address.full}</span>
          </li>
          {brandPhones.map((phone) => (
            <li key={phone.international}>
              <a
                href={telLink(phone.international)}
                className="flex items-center gap-2.5 transition hover:text-foreground"
              >
                <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                {phone.display}
              </a>
            </li>
          ))}
          <li>
            <a
              href={whatsappLink(`Hello ${brand.name}, I would like to ask about a car.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 transition hover:text-foreground"
            >
              <MessageCircle className="size-4 shrink-0 text-accent" aria-hidden="true" />
              WhatsApp us
            </a>
          </li>
          {brand.email && (
            <li>
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-2.5 break-all transition hover:text-foreground"
              >
                <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
                {brand.email}
              </a>
            </li>
          )}
          {brand.hours.startsWith("TODO") ? null : (
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{brand.hours}</span>
            </li>
          )}
        </ul>

        <nav aria-label="Footer" className="flex gap-6 md:flex-col md:gap-3">
          <Link to="/about" className="transition hover:text-foreground">
            About
          </Link>
          <Link to="/financing" className="transition hover:text-foreground">
            Financing
          </Link>
          <Link to="/contact" className="transition hover:text-foreground">
            Contact
          </Link>
        </nav>
      </div>
      <div
        className={cn(
          "mt-10 border-t border-border py-6 text-xs text-mist",
          reserveForWhatsApp && "pb-24",
        )}
      >
        © {new Date().getFullYear()} {brand.name}. All rights reserved.
      </div>
    </footer>
  );
}
