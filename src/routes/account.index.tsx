import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Heart, MessageSquare, User } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getProfile, getVehiclesByIds, listMyInquiries, listMyReservations } from "@/data/api";
import { useFavorites } from "@/hooks/useFavorites";
import { accountNav } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [{ title: `Your account — ${brand.name}` }],
  }),
  component: AccountOverview,
});

function AccountOverview() {
  const { favorites } = useFavorites();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: favoriteVehicles = [] } = useQuery({
    queryKey: ["favorites", favorites],
    queryFn: () => getVehiclesByIds(favorites),
  });
  const { data: inquiries = [] } = useQuery({
    queryKey: ["my-inquiries"],
    queryFn: listMyInquiries,
  });
  const { data: reservations = [] } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: listMyReservations,
  });

  const stats = [
    {
      label: "Saved vehicles",
      value: favoriteVehicles.length,
      icon: Heart,
      to: "/account/favorites",
    },
    {
      label: "Open inquiries",
      value: inquiries.length,
      icon: MessageSquare,
      to: "/account/inquiries",
    },
    {
      label: "Active reservations",
      value: reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length,
      icon: CalendarClock,
      to: "/account/reservations",
    },
  ] as const;

  return (
    <DashboardLayout eyebrow="Your account" title="Welcome back" nav={accountNav}>
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="glass glass-hover rounded-2xl p-5">
            <span className="icon-btn size-10">
              <stat.icon className="size-4 text-accent" />
            </span>
            <p className="mt-4 font-heading text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-mist">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Profile</h2>
            <Link to="/account/profile" className="text-xs text-accent hover:underline">
              Edit
            </Link>
          </div>
          {profile && (
            <div className="mt-4 flex items-center gap-3">
              <span className="icon-btn size-11 shrink-0">
                <User className="size-5 text-accent" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{profile.fullName}</p>
                <p className="truncate text-sm text-mist">{profile.email}</p>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-mist">
            Member since {profile ? formatDate(profile.memberSince) : "—"}
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent inquiries</h2>
            <Link to="/account/inquiries" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <p className="mt-4 text-sm text-mist">
              No inquiries yet — browse the collection to ask a question.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {inquiries.slice(0, 3).map((inquiry) => (
                <li key={inquiry.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{inquiry.vehicleName}</span>
                  <StatusBadge status={inquiry.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
