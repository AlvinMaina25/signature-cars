import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

import { AuroraBackdrop } from "./AuroraBackdrop";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export interface DashboardNavItem {
  to: string;
  label: string;
  /** Admin menu only: show a "needs attention" count badge for this section. */
  alert?: "inquiries" | "reservations" | "payments";
}

export function DashboardLayout({
  eyebrow,
  title,
  nav,
  children,
}: {
  eyebrow: string;
  title: string;
  nav: DashboardNavItem[];
  children: ReactNode;
}) {
  // Admin and account dashboards stay live without a page reload.
  useRealtimeSync();
  const alerts = useAdminAlerts(nav.some((item) => item.alert));

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-background via-brand to-background font-body text-foreground">
      <AuroraBackdrop />
      <SiteHeader />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6">
        <span className="pill">
          <span className="size-1.5 rounded-full bg-accent" />
          {eyebrow}
        </span>
        <h1 className="mt-5 font-heading text-3xl font-bold sm:text-4xl">{title}</h1>

        <nav className="mt-7 -mx-1 flex gap-1 overflow-x-auto pb-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-mist transition hover:bg-white/5 hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground hover:bg-accent" }}
            >
              {item.label}
              {item.alert && alerts && alerts[item.alert] > 0 && (
                <span
                  className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] leading-5 font-bold text-white"
                  aria-label={`${alerts[item.alert]} need attention`}
                >
                  {alerts[item.alert] > 99 ? "99+" : alerts[item.alert]}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
