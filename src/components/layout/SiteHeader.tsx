import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { brand, telLink } from "@/config/brand";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

const links = [
  { to: "/browse", label: "Browse" },
  { to: "/sell", label: "Sell your car" },
  { to: "/financing", label: "Financing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useFavorites();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <header className="relative z-30">
      <div className="border-b border-border text-xs text-mist">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
            <a
              href={telLink(brand.phones.primary.international)}
              className="inline-flex items-center gap-1.5 transition hover:text-foreground"
            >
              <Phone className="size-3.5 text-accent" aria-hidden="true" />
              {brand.phones.primary.display}
            </a>
            {brand.email && (
              <a
                href={`mailto:${brand.email}`}
                className="hidden items-center gap-1.5 transition hover:text-foreground sm:inline-flex"
              >
                <Mail className="size-3.5 text-accent" aria-hidden="true" />
                {brand.email}
              </a>
            )}
            <Link
              to="/contact"
              className="hidden items-center gap-1.5 transition hover:text-foreground md:inline-flex"
            >
              <MapPin className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              {brand.address.street}, {brand.address.city}
            </Link>
          </div>
          <SocialLinks className="[&_a]:size-7" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-6">
        <Link to="/" className="flex min-w-0 items-center" aria-label={`${brand.name} home`}>
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-8 text-sm text-mist md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link to="/account/favorites" className="icon-btn relative size-9" aria-label="Favorites">
            <Heart className="size-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden text-sm text-mist transition hover:text-foreground sm:block"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/account"
                className="hidden text-sm text-mist transition hover:text-foreground sm:block"
              >
                {user.email}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-light hidden px-4 py-2 sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm text-mist transition hover:text-foreground sm:block"
              >
                Sign in
              </Link>
              <Link to="/signup" className="btn-light hidden px-4 py-2 sm:inline-flex">
                Get Started
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="icon-btn size-9 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-6 md:hidden">
          <div className="glass rise flex flex-col gap-1 rounded-2xl p-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-mist transition hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 space-y-1 border-t border-border pt-3 text-sm text-mist">
              <a
                href={telLink(brand.phones.secondary.international)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-foreground"
              >
                <Phone className="size-4 text-accent" aria-hidden="true" />
                {brand.phones.secondary.display}
              </a>
              {brand.email && (
                <a
                  href={`mailto:${brand.email}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-foreground sm:hidden"
                >
                  <Mail className="size-4 text-accent" aria-hidden="true" />
                  <span className="truncate">{brand.email}</span>
                </a>
              )}
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="flex items-start gap-2 rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-foreground"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {brand.address.street}, {brand.address.city}
              </Link>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="btn-glass col-span-2"
                    >
                      Admin
                    </Link>
                  )}
                  <Link to="/account" onClick={() => setOpen(false)} className="btn-glass">
                    Account
                  </Link>
                  <button type="button" onClick={handleSignOut} className="btn-accent">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-glass">
                    Sign in
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="btn-accent">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
