import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { listInquiries, updateInquiryStatus } from "@/data/api";
import type { InquiryStatus } from "@/data/types";
import { adminNav } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/admin/inquiries")({
  head: () => ({
    meta: [{ title: `Inquiries — ${brand.name} Admin` }],
  }),
  component: AdminInquiries,
});

const statuses: InquiryStatus[] = ["new", "in-progress", "answered", "closed"];
const tabs = ["all", ...statuses] as const;

function AdminInquiries() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const { data: inquiries = [], isPending } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: listInquiries,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      updateInquiryStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    },
  });

  const filtered = tab === "all" ? inquiries : inquiries.filter((i) => i.status === tab);

  return (
    <DashboardLayout eyebrow="Admin control center" title="Inquiries" nav={adminNav}>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              tab === t
                ? "bg-accent text-accent-foreground"
                : "bg-white/5 text-mist ring-1 ring-white/10 hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {isPending ? (
          [0, 1, 2].map((i) => <div key={i} className="glass h-28 animate-pulse rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <EmptyState title="No inquiries here" description="Nothing matches this filter yet." />
        ) : (
          filtered.map((inquiry) => (
            <div key={inquiry.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading font-semibold">{inquiry.vehicleName}</p>
                  <p className="mt-1 text-xs text-mist">
                    {inquiry.name} · {inquiry.email}
                    {inquiry.phone ? ` · ${inquiry.phone}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-mist">Sent {formatDate(inquiry.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inquiry.status} />
                  <select
                    aria-label={`Update status for ${inquiry.vehicleName} inquiry`}
                    className="field w-auto appearance-none bg-brand py-1.5 text-xs"
                    value={inquiry.status}
                    onChange={(e) =>
                      statusMutation.mutate({
                        id: inquiry.id,
                        status: e.target.value as InquiryStatus,
                      })
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status} className="capitalize">
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist">{inquiry.message}</p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
