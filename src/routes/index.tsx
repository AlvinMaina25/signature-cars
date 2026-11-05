import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import heroCar from "@/assets/hero-car.jpg";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { brand, telLink, pageMeta, canonicalLinks } from "@/config/brand";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { listFeaturedVehicles } from "@/data/api";
import { useFavorites } from "@/hooks/useFavorites";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta({
      title: `${brand.name} — Used Cars in Nairobi`,
      description: `Browse used cars from ${brand.name} on ${brand.address.area}, ${brand.address.city}. See prices in KES, estimate financing and reserve a car online.`,
      path: "/",
    }),
    links: canonicalLinks("/"),
  }),
  // Fetch on the server so the featured cars are in the first HTML instead of
  // appearing after JS loads + a second round trip. Falls back to client fetch on error.
  loader: async () => {
    try {
      return await listFeaturedVehicles();
    } catch {
      return undefined;
    }
  },
  component: Home,
});

function Home() {
  const { data: featured = [] } = useQuery({
    queryKey: ["vehicles", "featured"],
    queryFn: listFeaturedVehicles,
    initialData: Route.useLoaderData(),
  });
  const { isFavorite, toggle } = useFavorites();
  const hero = featured[0];
  const saved = hero ? isFavorite(hero.id) : false;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 pt-6 lg:grid-cols-12 lg:pt-10">
          <div className="rise lg:col-span-7">
            <span className="pill">
              <span className="size-1.5 rounded-full bg-accent" />
              Used cars in Nairobi
            </span>
            <h1 className="mt-6 font-heading text-5xl font-bold leading-[1.05] sm:text-6xl">
              Find your next
              <br />
              <span className="bg-gradient-to-r from-accent to-glow bg-clip-text text-transparent">
                car in Nairobi.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-mist">
              Browse the cars available at {brand.name}, with prices in KES. Call, WhatsApp or visit
              us: {brand.address.street}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/browse" className="btn-accent">
                Browse vehicles
              </Link>
              <Link to="/contact" className="btn-glass">
                Contact us
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <div className="label-xs">Call us</div>
                <a
                  href={telLink(brand.phones.primary.international)}
                  className="mt-1 block font-heading text-lg font-bold transition hover:text-accent"
                >
                  {brand.phones.primary.display}
                </a>
              </div>
              <div>
                <div className="label-xs">Visit us</div>
                <div className="mt-1 text-sm text-mist">
                  {brand.address.area}, {brand.address.city}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass rounded-3xl p-6 shadow-glass">
              {hero ? (
                <>
                  <Link
                    to="/vehicles/$vehicleId"
                    params={{ vehicleId: hero.slug }}
                    className="block overflow-hidden rounded-2xl"
                  >
                    <img
                      src={hero.images[0] ?? heroCar}
                      alt={`${hero.year} ${hero.make} ${hero.model}`}
                      width={1024}
                      height={768}
                      fetchPriority="high"
                      decoding="async"
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                  </Link>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-lg font-semibold">
                        {hero.year} {hero.make} {hero.model}
                      </h3>
                      <p className="truncate text-sm text-mist">
                        {hero.engine} · {hero.horsepower} hp · {hero.transmission}
                      </p>
                    </div>
                    <Link
                      to="/vehicles/$vehicleId"
                      params={{ vehicleId: hero.slug }}
                      className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      Reserve
                    </Link>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-heading text-xl font-bold">
                      {formatPrice(hero.price)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(hero.id)}
                        aria-label={saved ? "Remove from favorites" : "Save to favorites"}
                        aria-pressed={saved}
                        className="icon-btn size-10"
                      >
                        <Heart
                          className={`size-4 ${saved ? "fill-accent text-accent" : "text-mist"}`}
                        />
                      </button>
                      <Link
                        to="/vehicles/$vehicleId"
                        params={{ vehicleId: hero.slug }}
                        className="btn-light px-4 py-2"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={heroCar}
                    alt="Featured vehicle"
                    width={1024}
                    height={768}
                    fetchPriority="high"
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                  <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-white/5" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/5" />
                  <div className="mt-5 h-6 w-1/3 animate-pulse rounded bg-white/5" />
                </>
              )}
            </div>
          </div>
        </div>

        <section className="mt-16">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold">Featured this week</h2>
            <Link to="/browse" className="text-sm text-mist transition hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
