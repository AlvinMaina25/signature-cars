import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const accountNav: DashboardNavItem[] = [
  { to: "/account", label: "Overview" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/favorites", label: "Favorites" },
  { to: "/account/inquiries", label: "My Inquiries" },
  { to: "/account/reservations", label: "My Reservations" },
  { to: "/account/listings", label: "My Listings" },
];

export const adminNav: DashboardNavItem[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/vehicles", label: "Vehicles" },
  { to: "/admin/inquiries", label: "Inquiries", alert: "inquiries" },
  { to: "/admin/reservations", label: "Reservations", alert: "reservations" },
  { to: "/admin/payments", label: "Payments", alert: "payments" },
];
