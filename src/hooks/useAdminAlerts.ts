import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export interface AdminAlertCounts {
  inquiries: number;
  reservations: number;
  payments: number;
  total: number;
}

export const ADMIN_COUNTS_KEY = ["admin-counts"] as const;

async function countRows(
  table: "inquiries" | "reservations" | "payments",
  status: "new" | "pending",
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * "Needs attention" counters for the admin menu, like unread-message badges:
 *   inquiries    -> status "new"        (nobody has looked at them yet)
 *   reservations -> status "pending"    (waiting for the admin to confirm)
 *   payments     -> status "pending"    (waiting for the admin to verify)
 * A counter drops when the admin changes that item's status, and rises when
 * a new one arrives (live, via Supabase Realtime). Also puts the total in the
 * browser tab title, e.g. "(3) Admin", so it shows when the tab is in the
 * background. Pass enabled=false for non-admin dashboards.
 */
export function useAdminAlerts(enabled: boolean): AdminAlertCounts | undefined {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ADMIN_COUNTS_KEY,
    enabled,
    refetchInterval: 60_000, // safety net if a realtime event is missed
    queryFn: async (): Promise<AdminAlertCounts> => {
      const [inquiries, reservations, payments] = await Promise.all([
        countRows("inquiries", "new"),
        countRows("reservations", "pending"),
        countRows("payments", "pending"),
      ]);
      return { inquiries, reservations, payments, total: inquiries + reservations + payments };
    },
  });

  // Live updates + a toast when something new arrives.
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ADMIN_COUNTS_KEY });

    const channel = supabase
      .channel("admin-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inquiries" }, (p) => {
        const name = (p.new as { name?: string }).name;
        toast.info("New inquiry", { description: name ? `From ${name}` : undefined });
        refresh();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations" }, () => {
        toast.info("New reservation");
        refresh();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "inquiries" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reservations" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments" }, refresh)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  // Tab title: "(3) Title". Re-applied whenever the page changes the title.
  const total = data?.total ?? 0;
  useEffect(() => {
    if (!enabled) return;
    const strip = (t: string) => t.replace(/^\(\d+\)\s*/, "");
    const apply = () => {
      const wanted = total > 0 ? `(${total}) ${strip(document.title)}` : strip(document.title);
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const titleEl = document.querySelector("title");
    const observer = titleEl ? new MutationObserver(apply) : undefined;
    if (titleEl)
      observer?.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => {
      observer?.disconnect();
      document.title = strip(document.title);
    };
  }, [enabled, total]);

  return data;
}
