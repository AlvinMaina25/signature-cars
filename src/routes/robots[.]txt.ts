import { createFileRoute } from "@tanstack/react-router";

import { robotsTxt } from "@/lib/seo";

// Served dynamically (instead of from public/) so the Sitemap line can follow
// `brand.siteUrl` and is omitted until the client's domain is configured.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
