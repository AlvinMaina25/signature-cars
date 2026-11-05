import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  emptyVehicleForm,
  VehicleForm,
  vehicleFormToPayload,
  type VehicleFormValues,
} from "@/components/vehicles/VehicleForm";
import { createVehicle } from "@/data/api";
import { adminNav } from "@/lib/nav";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/admin/vehicles/new")({
  head: () => ({
    meta: [{ title: `Add vehicle — ${brand.name}` }],
  }),
  component: AddVehicle,
});

function AddVehicle() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: VehicleFormValues) => createVehicle(vehicleFormToPayload(values)),
    onSuccess: (vehicle) => {
      toast.success("Vehicle added", {
        description: `${vehicle.year} ${vehicle.make} ${vehicle.model} is now in the inventory.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      navigate({ to: "/admin/vehicles" });
    },
  });

  return (
    <DashboardLayout eyebrow="Admin control center" title="Add Vehicle" nav={adminNav}>
      <Link
        to="/admin/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to vehicles
      </Link>
      <div className="glass mt-5 max-w-3xl rounded-2xl p-6">
        <VehicleForm
          initial={emptyVehicleForm}
          submitLabel="Add vehicle"
          pending={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
        />
      </div>
    </DashboardLayout>
  );
}
