import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteVehicle, listVehicles, updateVehicle } from "@/data/api";
import type { Vehicle } from "@/data/types";
import { adminNav } from "@/lib/nav";
import { formatPrice } from "@/lib/format";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/admin/vehicles/")({
  head: () => ({
    meta: [{ title: `Vehicle management — ${brand.name}` }],
  }),
  component: VehicleManagement,
});

function VehicleManagement() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const { data: vehicles = [], isPending } = useQuery({
    queryKey: ["admin-vehicles", query],
    queryFn: () => listVehicles({ query }),
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(vehicleId),
    onSuccess: () => {
      toast.success("Vehicle removed");
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      vehicleId,
      reviewStatus,
      reviewNote,
    }: {
      vehicleId: string;
      reviewStatus: Vehicle["reviewStatus"];
      reviewNote?: string | null;
    }) => updateVehicle(vehicleId, { reviewStatus, reviewNote }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.reviewStatus === "approved" ? "Listing approved" : "Listing rejected",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onError: (error) => {
      toast.error("Couldn't update this listing", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const pendingCount = vehicles.filter((v) => v.reviewStatus === "pending").length;

  return (
    <DashboardLayout eyebrow="Admin control center" title="Vehicle Management" nav={adminNav}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory"
            aria-label="Search inventory"
            className="field pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning">
              {pendingCount} awaiting review
            </span>
          )}
          <Link to="/admin/vehicles/new" className="btn-accent">
            <Plus className="size-4" />
            Add vehicle
          </Link>
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl p-4">
        {isPending ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="No vehicles found"
            description="Try a different search term, or add a new vehicle to the inventory."
            action={
              <Link to="/admin/vehicles/new" className="btn-accent">
                Add vehicle
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs text-mist">
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Mileage</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Review</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-border">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={vehicle.images[0] ?? "/placeholder-vehicle.svg"}
                          alt=""
                          width={64}
                          height={44}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-vehicle.svg";
                          }}
                          className="h-11 w-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="truncate text-xs text-mist">
                            {vehicle.trim}
                            {vehicle.sellerId && " · Seller submission"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{formatPrice(vehicle.price)}</td>
                    <td className="py-3 pr-4 text-mist">{vehicle.mileage.toLocaleString()} mi</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={vehicle.reviewStatus} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {vehicle.reviewStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                reviewMutation.mutate({
                                  vehicleId: vehicle.id,
                                  reviewStatus: "approved",
                                  reviewNote: null,
                                })
                              }
                              disabled={reviewMutation.isPending}
                              aria-label="Approve listing"
                              className="icon-btn size-8 text-success"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt(
                                  `Reject ${vehicle.year} ${vehicle.make} ${vehicle.model}? Optionally add a note for the seller:`,
                                );
                                if (reason === null) return;
                                reviewMutation.mutate({
                                  vehicleId: vehicle.id,
                                  reviewStatus: "rejected",
                                  reviewNote: reason || null,
                                });
                              }}
                              disabled={reviewMutation.isPending}
                              aria-label="Reject listing"
                              className="icon-btn size-8 text-destructive"
                            >
                              <X className="size-3.5" />
                            </button>
                          </>
                        )}
                        <Link
                          to="/admin/vehicles/$vehicleId"
                          params={{ vehicleId: vehicle.id }}
                          className="btn-glass px-3 py-1.5 text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
                              )
                            ) {
                              deleteMutation.mutate(vehicle.id);
                            }
                          }}
                          aria-label="Delete vehicle"
                          className="icon-btn size-8 text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
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
