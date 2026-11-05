import type { QueryClient } from "@tanstack/react-query";

/**
 * Everything that shows reservation, payment or car status. A change to any
 * one of them can ripple into the others (see supabase/reservation-sync.sql),
 * so every screen that displays them is refreshed together.
 */
const RELATED_KEYS = [
  ["admin-reservations"],
  ["admin-payments"],
  ["admin-metrics"],
  ["admin-counts"],
  ["admin-vehicles"],
  ["admin-vehicle"],
  ["my-reservations"],
  ["my-payments"],
  ["vehicle"],
  ["vehicles"],
] as const;

export function refreshInquiryData(queryClient: QueryClient) {
  return Promise.all(
    [["admin-inquiries"], ["my-inquiries"], ["admin-metrics"], ["admin-counts"]].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

export function refreshReservationData(queryClient: QueryClient) {
  return Promise.all(RELATED_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
