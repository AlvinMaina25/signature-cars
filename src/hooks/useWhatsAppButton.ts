import { useRouterState } from "@tanstack/react-router";

/**
 * The floating WhatsApp button is shown on every page except the staff-only
 * admin area. Matching is case-insensitive because the router matches paths
 * that way too (`/ADMIN` still renders the admin route).
 */
function isAdminPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return path === "/admin" || path.startsWith("/admin/");
}

/** True when the floating WhatsApp button should be on screen for the current route. */
export function useWhatsAppButtonVisible(): boolean {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return !isAdminPath(pathname);
}
