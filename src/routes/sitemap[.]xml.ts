import { createFileRoute } from "@tanstack/react-router";

import { hasSiteUrl } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";
import {
  sitemapStaticPaths,
  sitemapVehicleStatuses,
  sitemapXml,
  type SitemapEntry,
} from "@/lib/seo";

const textHeaders = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

// Sitemap URLs must be absolute. Until the client's domain is set in
// `brand.siteUrl` (TODO(client): domain) there is nothing valid to publish, so
// the route answers 404 instead of emitting made-up URLs.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        if (!hasSiteUrl()) {
          return new Response("Sitemap unavailable: the site domain is not configured.", {
            status: 404,
            headers: textHeaders,
          });
        }

        const { data, error } = await supabase
          .from("cars")
          .select("slug, status, updated_at")
          .in("status", [...sitemapVehicleStatuses])
          .order("updated_at", { ascending: false });

        // A partial sitemap could drop listings from search results, so fail
        // loudly and let crawlers retry instead.
        if (error) {
          return new Response("Sitemap temporarily unavailable.", {
            status: 503,
            headers: { ...textHeaders, "Retry-After": "600" },
          });
        }

        const entries: SitemapEntry[] = [
          ...sitemapStaticPaths.map((path) => ({ path })),
          ...(data ?? []).map((car) => ({
            path: `/vehicles/${encodeURIComponent(car.slug)}`,
            lastmod: car.updated_at,
          })),
        ];

        return new Response(sitemapXml(entries), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
