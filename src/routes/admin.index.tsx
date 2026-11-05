import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Banknote, Car, MessageSquare, Tag } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminMetrics, listInquiries, listReservations, listVehicles } from "@/data/api";
import { adminNav } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: `Admin dashboard — ${brand.name}` }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: metrics } = useQuery({ queryKey: ["admin-metrics"], queryFn: getAdminMetrics });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: () => listVehicles({}),
  });
  const { data: inquiries = [] } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: listInquiries,
  });
  const { data: reservations = [] } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: listReservations,
  });

  const stats = metrics
    ? [
        { label: "Live listings", value: `${metrics.liveListings}`, icon: Car },
        { label: "Reserved", value: `${metrics.reservedCount}`, icon: Tag },
        { label: "Open inquiries", value: `${metrics.openInquiries}`, icon: MessageSquare },
        {
          label: "Deposits collected",
          value: formatPrice(metrics.depositsCollected),
          icon: Banknote,
        },
      ]
    : [];

  const bodyStyleCounts = vehicles.reduce<Record<string, number>>((acc, vehicle) => {
    acc[vehicle.bodyStyle] = (acc[vehicle.bodyStyle] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(bodyStyleCounts).map(([name, count]) => ({ name, count }));

  return (
    <DashboardLayout eyebrow="Admin control center" title="Dashboard" nav={adminNav}>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <span className="icon-btn size-10">
              <stat.icon className="size-4 text-accent" />
            </span>
            <p className="mt-4 font-heading text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-mist">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold">Inventory by body style</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.08)" />
                <XAxis dataKey="name" stroke="oklch(0.75 0.031 253)" fontSize={12} />
                <YAxis stroke="oklch(0.75 0.031 253)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.03 259)",
                    border: "1px solid oklch(1 0 0 / 0.14)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.78 0.132 227)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent inquiries</h2>
            <Link to="/admin/inquiries" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {inquiries.slice(0, 5).map((inquiry) => (
              <li key={inquiry.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{inquiry.vehicleName}</p>
                  <p className="truncate text-xs text-mist">{inquiry.name}</p>
                </div>
                <StatusBadge status={inquiry.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent reservations</h2>
          <Link to="/admin/reservations" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs text-mist">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Pickup</th>
                <th className="pb-2 font-medium">Deposit</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.slice(0, 5).map((reservation) => (
                <tr key={reservation.id} className="border-t border-border">
                  <td className="py-2.5 pr-4">{reservation.vehicleName}</td>
                  <td className="py-2.5 pr-4 text-mist">{reservation.customerName}</td>
                  <td className="py-2.5 pr-4 text-mist">{formatDate(reservation.pickupDate)}</td>
                  <td className="py-2.5 pr-4">{formatPrice(reservation.depositAmount)}</td>
                  <td className="py-2.5">
                    <StatusBadge status={reservation.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
