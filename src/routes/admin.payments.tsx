import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { listPayments, updatePaymentStatus } from "@/data/api";
import type { PaymentStatus } from "@/data/types";
import { adminNav } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { brand } from "@/config/brand";
import { refreshReservationData } from "@/lib/sync";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [{ title: `Payments overview — ${brand.name} Admin` }],
  }),
  component: AdminPayments,
});

const statuses: PaymentStatus[] = [
  "pending",
  "processing",
  "successful",
  "failed",
  "cancelled",
  "refunded",
];

function AdminPayments() {
  const queryClient = useQueryClient();
  const { data: payments = [], isPending } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: listPayments,
    refetchInterval: 30_000, // safety net if live updates are unavailable
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updatePaymentStatus({ data: { paymentId: id, status } }),
    onSuccess: () => {
      toast.success("Payment updated");
      void refreshReservationData(queryClient);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const totalPaid = payments
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { label: "Collected", value: formatPrice(totalPaid), icon: CheckCircle2 },
    { label: "Pending", value: formatPrice(totalPending), icon: Clock },
    { label: "Refunded", value: formatPrice(totalRefunded), icon: RotateCcw },
    { label: "Total transactions", value: `${payments.length}`, icon: Banknote },
  ];

  return (
    <DashboardLayout eyebrow="Admin control center" title="Payments Overview" nav={adminNav}>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <span className="icon-btn size-10">
              <stat.icon className="size-4 text-accent" />
            </span>
            <p className="mt-4 font-heading text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-mist">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 glass rounded-2xl p-4">
        {isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Transactions will appear here once deposits are collected."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs text-mist">
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="py-3 pr-4 font-mono text-xs text-mist">{payment.reference}</td>
                    <td className="py-3 pr-4">{payment.customerName}</td>
                    <td className="py-3 pr-4">{payment.vehicleName}</td>
                    <td className="py-3 pr-4 text-mist">{payment.method}</td>
                    <td className="py-3 pr-4 text-mist">{formatDate(payment.createdAt)}</td>
                    <td className="py-3 pr-4">{formatPrice(payment.amount)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={payment.status} />
                        <select
                          aria-label={`Update status for ${payment.reference} payment`}
                          className="field w-auto appearance-none bg-brand py-1.5 text-xs"
                          value={payment.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: payment.id,
                              status: e.target.value as PaymentStatus,
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
