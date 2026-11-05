import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import {
  VehicleForm,
  vehicleFormToPayload,
  vehicleToForm,
  type VehicleFormValues,
} from "@/components/vehicles/VehicleForm";
import { deleteVehicle, getVehicle, updateVehicle } from "@/data/api";
import { adminNav } from "@/lib/nav";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/admin/vehicles/$vehicleId")({
  head: () => ({
    meta: [{ title: `Edit vehicle — ${brand.name}` }],
  }),
  component: EditVehicle,
});

function EditVehicle() {
  const { vehicleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vehicle, isPending } = useQuery({
    queryKey: ["admin-vehicle", vehicleId],
    queryFn: () => getVehicle(vehicleId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: VehicleFormValues) =>
      updateVehicle(vehicleId, vehicleFormToPayload(values)),
    onSuccess: () => {
      toast.success("Vehicle updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vehicle", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      navigate({ to: "/admin/vehicles" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(vehicleId),
    onSuccess: () => {
      toast.success("Vehicle removed");
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      navigate({ to: "/admin/vehicles" });
    },
  });

  return (
    <DashboardLayout eyebrow="Admin control center" title="Edit Vehicle" nav={adminNav}>
      <div className="flex items-center justify-between">
        <Link
          to="/admin/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to vehicles
        </Link>
        {vehicle && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove ${vehicle.year} ${vehicle.make} ${vehicle.model}?`)) {
                deleteMutation.mutate();
              }
            }}
            className="btn-glass px-4 py-2 text-xs text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete vehicle
          </button>
        )}
      </div>

      {isPending ? (
        <div className="glass mt-5 h-96 max-w-3xl animate-pulse rounded-2xl" />
      ) : !vehicle ? (
        <div className="mt-5">
          <EmptyState
            title="Vehicle not found"
            description="It may have already been removed from the inventory."
            action={
              <Link to="/admin/vehicles" className="btn-accent">
                Back to vehicles
              </Link>
            }
          />
        </div>
      ) : (
        <div className="glass mt-5 max-w-3xl rounded-2xl p-6">
          <VehicleForm
            key={vehicle.id}
            initial={vehicleToForm(vehicle)}
            submitLabel="Save changes"
            pending={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate(values)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
