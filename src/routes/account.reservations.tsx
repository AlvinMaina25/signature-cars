import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ReservationProgress } from "@/components/reservations/ReservationProgress";
import { cancelMyReservation, listMyReservations, listPayments } from "@/data/api";
import type { Payment } from "@/data/types";
import { accountNav } from "@/lib/nav";
import { reservationMessage } from "@/lib/reservation-copy";
import { formatDate, formatPrice } from "@/lib/format";
import { refreshReservationData } from "@/lib/sync";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/account/reservations")({
  head: () => ({
    meta: [{ title: `My reservations — ${brand.name}` }],
  }),
  component: MyReservations,
});

// Safety net in case live updates are unavailable (e.g. realtime not enabled yet).
const FALLBACK_POLL_MS = 30_000;

function MyReservations() {
  const queryClient = useQueryClient();

  const { data: reservations = [], isPending } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: listMyReservations,
    refetchInterval: FALLBACK_POLL_MS,
  });

  // Row level security limits this to the signed-in customer's own payments.
  const { data: payments = [] } = useQuery({
    queryKey: ["my-payments"],
    queryFn: listPayments,
    refetchInterval: FALLBACK_POLL_MS,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelMyReservation,
    onSuccess: () => {
      toast.success("Reservation cancelled");
      void refreshReservationData(queryClient);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not cancel the reservation"),
  });

  const paymentsByReservation = new Map<string, Payment[]>();
  for (const payment of payments) {
    const list = paymentsByReservation.get(payment.reservationId) ?? [];
    list.push(payment);
    paymentsByReservation.set(payment.reservationId, list);
  }

  return (
    <DashboardLayout eyebrow="Your account" title="My Reservations" nav={accountNav}>
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No reservations yet"
          description="Reserve a car and it will appear here."
          action={
            <Link to="/browse" className="btn-accent">
              Browse vehicles
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            // payments are listed newest first; the latest one reflects the current state
            const payment = paymentsByReservation.get(reservation.id)?.[0];
            const cancellable =
              reservation.status === "pending" || reservation.status === "confirmed";

            return (
              <article key={reservation.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold">{reservation.vehicleName}</p>
                    <p className="mt-1 text-xs text-mist">
                      Requested {formatDate(reservation.createdAt)}
                      {reservation.pickupDate && (
                        <> · Pickup {formatDate(reservation.pickupDate)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatPrice(reservation.depositAmount)} deposit
                    </span>
                    <StatusBadge status={reservation.status} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
                  <ReservationProgress status={reservation.status} />
                  <div className="max-w-sm text-sm text-mist">
                    <p>{reservationMessage(reservation.status, brand.name)}</p>
                    {payment && (
                      <p className="mt-2 flex items-center gap-2">
                        Deposit payment <StatusBadge status={payment.status} />
                      </p>
                    )}
                  </div>
                </div>

                {cancellable && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Cancel this reservation?")) {
                          cancelMutation.mutate(reservation.id);
                        }
                      }}
                    >
                      Cancel reservation
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
