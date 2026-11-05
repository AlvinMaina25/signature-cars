import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { getVehiclesByIds } from "@/data/api";
import { useFavorites } from "@/hooks/useFavorites";
import { accountNav } from "@/lib/nav";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/favorites")({
  head: () => ({
    meta: [{ title: `Favorites — ${brand.name}` }],
  }),
  component: Favorites,
});

function Favorites() {
  const { favorites } = useFavorites();
  const { data: vehicles = [], isPending } = useQuery({
    queryKey: ["favorites", favorites],
    queryFn: () => getVehiclesByIds(favorites),
    enabled: favorites.length > 0,
  });

  return (
    <DashboardLayout eyebrow="Your account" title="Favorites" nav={accountNav}>
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap the heart icon on any listing to save it here for later."
          action={
            <Link to="/browse" className="btn-accent">
              Browse vehicles
            </Link>
          }
        />
      ) : isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-72 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
