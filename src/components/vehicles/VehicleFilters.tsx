import { Search } from "lucide-react";

import type { VehicleFilters as Filters } from "@/data/types";
import { formatPrice } from "@/lib/format";

const bodyStyles = ["all", "Coupe", "Sedan", "SUV", "Convertible", "Grand Tourer"] as const;
const fuels = ["all", "Petrol", "Hybrid", "Electric"] as const;
const transmissions = ["all", "Automatic", "Manual"] as const;

export function VehicleFilterPanel({
  filters,
  onChange,
  onReset,
  resultCount,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  resultCount: number;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist" />
        <input
          value={filters.query ?? ""}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search make, model or spec"
          aria-label="Search vehicles"
          className="field pl-10"
        />
      </div>

      <fieldset className="mt-6">
        <legend className="label-xs mb-2">Body style</legend>
        <div className="flex flex-wrap gap-1.5">
          {bodyStyles.map((style) => {
            const active = (filters.bodyStyle ?? "all") === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => onChange({ bodyStyle: style })}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/5 text-mist ring-1 ring-white/10 hover:text-foreground"
                }`}
              >
                {style === "all" ? "All" : style}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label-xs mb-2">Fuel</legend>
        <div className="flex flex-wrap gap-1.5">
          {fuels.map((fuel) => {
            const active = (filters.fuel ?? "all") === fuel;
            return (
              <button
                key={fuel}
                type="button"
                onClick={() => onChange({ fuel })}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/5 text-mist ring-1 ring-white/10 hover:text-foreground"
                }`}
              >
                {fuel === "all" ? "All" : fuel}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label-xs mb-2">Transmission</legend>
        <div className="flex flex-wrap gap-1.5">
          {transmissions.map((t) => {
            const active = (filters.transmission ?? "all") === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ transmission: t })}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/5 text-mist ring-1 ring-white/10 hover:text-foreground"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="label-xs">Max price</span>
          <span className="font-heading text-sm font-semibold text-accent">
            {formatPrice(filters.maxPrice ?? 15000000)}
          </span>
        </div>
        <input
          type="range"
          min={1000000}
          max={30000000}
          step={500000}
          value={filters.maxPrice ?? 15000000}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          aria-label="Maximum price"
          className="mt-3 w-full accent-accent"
        />
      </div>

      <div className="mt-6">
        <label className="label-xs mb-2" htmlFor="sort">
          Sort by
        </label>
        <select
          id="sort"
          value={filters.sort ?? "newest"}
          onChange={(e) => onChange({ sort: e.target.value as NonNullable<Filters["sort"]> })}
          className="field appearance-none bg-brand"
        >
          <option value="newest">Newest listings</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="mileage-asc">Lowest mileage</option>
        </select>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <span className="text-xs text-mist">{resultCount} matches</span>
        <button type="button" onClick={onReset} className="btn-glass px-4 py-2 text-xs">
          Reset
        </button>
      </div>
    </div>
  );
}
