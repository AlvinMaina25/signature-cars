import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { listMyInquiries } from "@/data/api";
import { accountNav } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/inquiries")({
  head: () => ({
    meta: [{ title: `My inquiries — ${brand.name}` }],
  }),
  component: MyInquiries,
});

function MyInquiries() {
  const { data: inquiries = [], isPending } = useQuery({
    queryKey: ["my-inquiries"],
    queryFn: listMyInquiries,
  });

  return (
    <DashboardLayout eyebrow="Your account" title="My Inquiries" nav={accountNav}>
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description="Questions you send about a listing will show up here so you can track replies."
          action={
            <Link to="/browse" className="btn-accent">
              Browse vehicles
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading font-semibold">{inquiry.vehicleName}</p>
                  <p className="mt-1 text-xs text-mist">Sent {formatDate(inquiry.createdAt)}</p>
                </div>
                <StatusBadge status={inquiry.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist">{inquiry.message}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
