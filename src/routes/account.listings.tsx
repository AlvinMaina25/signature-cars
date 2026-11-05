import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { accountNav } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { listMySubmittedVehicles } from "@/services/vehicles";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/listings")({
  head: () => ({
    meta: [{ title: `My listings — ${brand.name}` }],
  }),
  component: MyListings,
});

function MyListings() {
  const { data: listings = [], isPending } = useQuery({
    queryKey: ["my-listings"],
    queryFn: listMySubmittedVehicles,
  });

  return (
    <DashboardLayout eyebrow="Your account" title="My Listings" nav={accountNav}>
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Submit your car for sale and track its review status here."
          action={
            <Link to="/sell" className="btn-accent">
              Sell your car
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {listings.map((vehicle) => (
            <div
              key={vehicle.id}
              className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={vehicle.images[0] ?? "/placeholder-vehicle.svg"}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder-vehicle.svg";
                  }}
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-heading font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="mt-1 text-xs text-mist">
                    Submitted {formatDate(vehicle.createdAt)} · {formatPrice(vehicle.price)}
                  </p>
                  {vehicle.reviewStatus === "rejected" && vehicle.reviewNote && (
                    <p className="mt-1 text-xs text-destructive">Note: {vehicle.reviewNote}</p>
                  )}
                </div>
              </div>
              <StatusBadge status={vehicle.reviewStatus} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
