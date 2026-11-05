import type { ReactNode } from "react";

import { AuroraBackdrop } from "./AuroraBackdrop";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-background via-brand to-background font-body text-foreground">
      <AuroraBackdrop />
      <SiteHeader />
      <main className="relative z-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Standard page intro used by every secondary public page. */
export function PageIntro({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
}) {
  return (
    <div className="rise mx-auto max-w-7xl px-6 pt-8 pb-12">
      <span className="pill">
        <span className="size-1.5 rounded-full bg-accent" />
        {eyebrow}
      </span>
      <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] sm:text-5xl">{title}</h1>
      {lead && <p className="mt-5 max-w-xl text-base leading-relaxed text-mist">{lead}</p>}
    </div>
  );
}
