import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageIntro, PublicLayout } from "@/components/layout/PublicLayout";
import {
  emptyVehicleForm,
  VehicleForm,
  vehicleFormToPayload,
  type VehicleFormValues,
} from "@/components/vehicles/VehicleForm";
import { supabase } from "@/integrations/supabase/client";
import { createSellerListing } from "@/services/vehicles";
import { brand, pageMeta, canonicalLinks } from "@/config/brand";

export const Route = createFileRoute("/sell")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  head: () => ({
    meta: pageMeta({
      title: `Sell your car in Nairobi — ${brand.name}`,
      description: `Submit your car to ${brand.name} in ${brand.address.city}. Listings are reviewed before they appear on the site.`,
      path: "/sell",
    }),
    links: canonicalLinks("/sell"),
  }),
  component: SellCar,
});

function SellCar() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (values: VehicleFormValues) => createSellerListing(vehicleFormToPayload(values)),
    onSuccess: () => {
      toast.success("Listing submitted", {
        description: `${brand.name} will review your listing and publish it once approved.`,
      });
      navigate({ to: "/account/listings" });
    },
    onError: (error) => {
      toast.error("Couldn't submit your listing", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Sell your car"
        title={
          <>
            List your car,
            <br />
            <span className="bg-gradient-to-r from-accent to-glow bg-clip-text text-transparent">
              reach buyers.
            </span>
          </>
        }
        lead="Tell us about your car and add real photos. We review every submission before it goes live."
      />

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="glass max-w-3xl rounded-2xl p-6">
          <VehicleForm
            mode="seller"
            initial={emptyVehicleForm}
            submitLabel="Submit for review"
            pending={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </div>
      </div>
    </PublicLayout>
  );
}
