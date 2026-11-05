import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import type { Vehicle } from "@/data/types";
import { formatMileage, formatPrice } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(vehicle.id);

  return (
    <article className="glass glass-hover rounded-2xl p-4">
      <Link
        to="/vehicles/$vehicleId"
        params={{ vehicleId: vehicle.slug }}
        className="block overflow-hidden rounded-xl"
      >
        <div className="relative">
          <img
            src={vehicle.images[0] ?? "/placeholder-vehicle.svg"}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            width={1024}
            height={640}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder-vehicle.svg";
            }}
            className="aspect-[16/10] w-full rounded-xl object-cover transition duration-500 hover:scale-[1.04]"
          />
          {vehicle.badge && (
            <span className="absolute top-3 left-3 rounded-full bg-accent/90 px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
              {vehicle.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="truncate text-sm text-mist">
            {vehicle.engine} · {vehicle.horsepower} hp
          </p>
        </div>
        <span className="shrink-0 text-xs text-mist">{formatMileage(vehicle.mileage)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-heading font-bold">{formatPrice(vehicle.price)}</span>
        <button
          type="button"
          onClick={() => toggle(vehicle.id)}
          aria-label={saved ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={saved}
          className="icon-btn size-9"
        >
          <Heart
            className={`size-4 transition ${saved ? "fill-accent text-accent" : "text-mist"}`}
          />
        </button>
      </div>
    </article>
  );
}
