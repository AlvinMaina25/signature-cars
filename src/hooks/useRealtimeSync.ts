import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { refreshInquiryData, refreshReservationData } from "@/lib/sync";

/**
 * Keeps open dashboards in step with the database. When a reservation, a
 * payment or a car changes (an admin updating a status, a customer cancelling,
 * a payment clearing), every status screen refetches without a page reload.
 *
 * Row level security still applies: customers only receive changes to their
 * own rows, admins receive everything. Needs the tables to be in the
 * `supabase_realtime` publication (supabase/reservation-sync.sql).
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    // One status change touches several tables, so coalesce the bursts.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refreshReservationData(queryClient), 300);
    };
    let inquiryTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshInquiries = () => {
      clearTimeout(inquiryTimer);
      inquiryTimer = setTimeout(() => void refreshInquiryData(queryClient), 300);
    };

    const channel = supabase
      .channel(`status-sync-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cars" }, refresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        refreshInquiries,
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      clearTimeout(inquiryTimer);
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
