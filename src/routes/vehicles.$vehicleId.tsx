import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Heart, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import {
  brand,
  getSiteUrl,
  telLink,
  whatsappLink,
  pageMeta,
  canonicalLinks,
  noIndexMeta,
} from "@/config/brand";
import {
  createInquiry,
  createReservation,
  getProfile,
  getVehicle,
  updateProfile,
} from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { refreshInquiryData, refreshReservationData } from "@/lib/sync";
import { formatMileage, formatPrice, monthlyPayment, vehicleName } from "@/lib/format";
import type { Vehicle } from "@/data/types";

export const Route = createFileRoute("/vehicles/$vehicleId")({
  head: ({ loaderData }) => {
    // `loaderData` is typed by the router as the loader's return union.
    const vehicle = loaderData as Vehicle | null | undefined;
    if (!vehicle) {
      return {
        // Missing/removed listing: keep it out of search results.
        meta: [
          ...pageMeta({
            title: `Vehicle not found — ${brand.name}, ${brand.address.city}`,
            description: `This listing is no longer available. Browse current used cars from ${brand.name} in ${brand.address.city}.`,
          }),
          noIndexMeta,
        ],
      };
    }
    const name = vehicleName(vehicle);
    const path = `/vehicles/${vehicle.slug}`;
    return {
      meta: pageMeta({
        title: `${name} for sale in ${brand.address.city} — ${brand.name}`,
        description: `${name}, ${formatPrice(vehicle.price)}. ${vehicle.transmission}, ${vehicle.fuel.toLowerCase()}, ${formatMileage(vehicle.mileage)}. Enquire or reserve with ${brand.name}, ${brand.address.area}, ${brand.address.city}.`,
        path,
      }),
      links: canonicalLinks(path),
    };
  },
  loader: async ({ params }) => {
    try {
      return await getVehicle(params.vehicleId);
    } catch {
      return undefined;
    }
  },
  component: VehicleDetail,
});

function VehicleDetail() {
  const { vehicleId } = Route.useParams();
  const { data: vehicle, isPending } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => getVehicle(vehicleId),
    initialData: Route.useLoaderData(),
  });
  const { isFavorite, toggle } = useFavorites();
  const [tab, setTab] = useState<"inquire" | "reserve">("inquire");

  if (isPending) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="glass h-[60vh] animate-pulse rounded-3xl" />
        </div>
      </PublicLayout>
    );
  }

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-6 py-20">
          <EmptyState
            title="This listing is no longer available"
            description="The vehicle may have been sold or removed. Browse the current collection instead."
            action={
              <Link to="/browse" className="btn-accent">
                Browse vehicles
              </Link>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  const name = vehicleName(vehicle);
  const saved = isFavorite(vehicle.id);
  const vehicleUrl = `${getSiteUrl()}/vehicles/${vehicle.slug}`;
  const whatsappHref = whatsappLink(
    `Hello ${brand.name}, I am interested in the ${name} priced at ${formatPrice(vehicle.price)}. ${vehicleUrl}`,
  );

  const specs = [
    ["Engine", vehicle.engine],
    ["Power", `${vehicle.horsepower} hp`],
    ["0–60 mph", `${vehicle.zeroToSixty}s`],
    ["Transmission", vehicle.transmission],
    ["Drivetrain", vehicle.drivetrain],
    ["Fuel", vehicle.fuel],
    ["Mileage", formatMileage(vehicle.mileage)],
    ["Body style", vehicle.bodyStyle],
    ["Exterior", vehicle.exteriorColor],
    ["Interior", vehicle.interiorColor],
    ["Location", vehicle.location],
    ["VIN", vehicle.vin],
  ] as const;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-6 pt-4 pb-12">
        <nav className="flex items-center gap-2 text-xs text-mist">
          <Link to="/browse" className="transition hover:text-foreground">
            Browse
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rise">
            <VehicleGallery images={vehicle.images} alt={name} />

            <div className="glass mt-6 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold">About this car</h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">{vehicle.description}</p>

              <h3 className="mt-7 font-heading text-base font-semibold">Highlights</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {vehicle.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-mist">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass mt-6 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold">Specification</h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-border py-2.5 text-sm"
                  >
                    <dt className="text-mist">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass rounded-3xl p-6 shadow-glass">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="label-xs">
                    {vehicle.year} · {vehicle.trim}
                  </p>
                  <h1 className="mt-1 font-heading text-2xl font-bold">
                    {vehicle.make} {vehicle.model}
                  </h1>
                </div>
                <StatusBadge status={vehicle.status} />
              </div>

              <p className="mt-4 font-heading text-3xl font-bold">{formatPrice(vehicle.price)}</p>
              <p className="mt-1 text-sm text-mist">
                or {formatPrice(monthlyPayment(vehicle.price))}/mo · 60 months · 10% down
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <a href={telLink(brand.phones.primary.international)} className="btn-glass">
                  <Phone className="size-4" aria-hidden="true" />
                  Call
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp about this car"
                  className="btn-accent"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("inquire")}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                    tab === "inquire"
                      ? "bg-accent text-accent-foreground"
                      : "bg-white/5 text-mist ring-1 ring-white/10"
                  }`}
                >
                  Inquire
                </button>
                <button
                  type="button"
                  onClick={() => setTab("reserve")}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                    tab === "reserve"
                      ? "bg-accent text-accent-foreground"
                      : "bg-white/5 text-mist ring-1 ring-white/10"
                  }`}
                >
                  Reserve
                </button>
                <button
                  type="button"
                  onClick={() => toggle(vehicle.id)}
                  aria-label={saved ? "Remove from favorites" : "Save to favorites"}
                  aria-pressed={saved}
                  className="icon-btn size-10 shrink-0"
                >
                  <Heart className={`size-4 ${saved ? "fill-accent text-accent" : "text-mist"}`} />
                </button>
              </div>

              <div className="mt-5">
                {tab === "inquire" ? (
                  <InquiryForm vehicleId={vehicle.id} vehicleName={name} />
                ) : (
                  <ReservationForm vehicleId={vehicle.id} vehicleName={name} />
                )}
              </div>

              <p className="mt-4 text-center text-[11px] text-mist">
                No payment is taken on this page
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function InquiryForm({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });

  const mutation = useMutation({
    mutationFn: () => createInquiry({ vehicleId, vehicleName, ...form }),
    onSuccess: () => {
      toast.success("Inquiry sent", {
        description: `${brand.name} will be in touch about this car.`,
      });
      setForm({ name: "", email: "", phone: "", message: "", website: "" });
      void refreshInquiryData(queryClient);
    },
    onError: (error) =>
      toast.error("Could not send your inquiry", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <input
        required
        className="field"
        placeholder="Full name"
        aria-label="Full name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        required
        type="email"
        className="field"
        placeholder="Email address"
        aria-label="Email address"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="field"
        placeholder="Phone (optional)"
        aria-label="Phone number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <textarea
        required
        rows={3}
        className="field resize-none"
        placeholder="What would you like to know?"
        aria-label="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
        {mutation.isPending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}

function ReservationForm({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!user,
  });

  // null = the customer has not typed a name yet, so show the one on their account.
  const [typedName, setTypedName] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [depositAmount, setDepositAmount] = useState(150000);

  const customerName = typedName ?? profile?.fullName ?? "";
  const email = profile?.email || user?.email || "";

  const mutation = useMutation({
    mutationFn: async () => {
      const fullName = customerName.trim();
      // The name shown to the admin comes from the account profile, so a name
      // typed here is saved there. The whole profile is passed through so the
      // phone number is not cleared by the update.
      if (profile && fullName && fullName !== profile.fullName) {
        await updateProfile({ ...profile, fullName });
      }
      return createReservation({
        vehicleId,
        vehicleName,
        customerName: fullName,
        email,
        pickupDate,
        depositAmount,
      });
    },
    onSuccess: () => {
      void refreshReservationData(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Reservation requested", {
        description: `${brand.name} will contact you to confirm your reservation.`,
        action: {
          label: "Track it",
          onClick: () => void navigate({ to: "/account/reservations" }),
        },
      });
      setPickupDate("");
      setDepositAmount(150000);
      setTypedName(null);
    },
    onError: (error) =>
      toast.error("Could not reserve this car", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-white/5" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <p className="font-heading font-semibold">Sign in to reserve this car</p>
          <p className="mt-1.5 text-sm text-mist">
            Reservations are linked to your account, so you can track their progress and see when{" "}
            {brand.name} confirms yours.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-accent flex-1 text-center">
            Sign in
          </Link>
          <Link to="/signup" className="btn-glass flex-1 text-center">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div>
        <label className="label-xs mb-1.5" htmlFor="reserve-name">
          Full name
        </label>
        <input
          required
          id="reserve-name"
          autoComplete="name"
          className="field"
          placeholder="Full name"
          value={customerName}
          onChange={(e) => setTypedName(e.target.value)}
        />
      </div>
      <div>
        <label className="label-xs mb-1.5" htmlFor="reserve-email">
          Email address
        </label>
        <input
          id="reserve-email"
          type="email"
          readOnly
          className="field opacity-70"
          value={email}
        />
        <p className="mt-1.5 text-[11px] text-mist">
          Taken from your account, and where we send updates.
        </p>
      </div>
      <div>
        <label className="label-xs mb-1.5" htmlFor="pickup">
          Preferred collection date
        </label>
        <input
          required
          id="pickup"
          type="date"
          className="field"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
        />
      </div>
      <div>
        <label className="label-xs mb-1.5" htmlFor="deposit">
          Deposit
        </label>
        <select
          id="deposit"
          className="field appearance-none bg-brand"
          value={depositAmount}
          onChange={(e) => setDepositAmount(Number(e.target.value))}
        >
          <option value={100000}>Ksh 100,000</option>
          <option value={150000}>Ksh 150,000</option>
          <option value={250000}>Ksh 250,000</option>
        </select>
      </div>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}
      <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
        {mutation.isPending ? "Reserving…" : "Reserve this car"}
      </button>
    </form>
  );
}
