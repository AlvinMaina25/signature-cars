import { supabase } from "@/integrations/supabase/client";
import type { Reservation } from "@/data/types";

import { toReservation, type ReservationRow } from "./mappers";

const SELECT =
  "id, user_id, car_id, amount, currency, status, pickup_date, created_at, cars ( year, make, model ), profiles ( full_name, email )";

export async function listReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load reservations: ${error.message}`);
  return ((data ?? []) as unknown as ReservationRow[]).map(toReservation);
}

export async function listMyReservations(): Promise<Reservation[]> {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return [];
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your reservations: ${error.message}`);
  return ((data ?? []) as unknown as ReservationRow[]).map(toReservation);
}

export async function updateReservationStatus(
  reservationId: string,
  status: Reservation["status"],
): Promise<void> {
  const { error } = await supabase.from("reservations").update({ status }).eq("id", reservationId);
  if (error) throw new Error(`Could not update the reservation: ${error.message}`);
}

/**
 * A customer cancelling their own open reservation. The database only allows
 * this one transition from the browser; it then releases the car and settles
 * any payment (see supabase/reservation-sync.sql).
 */
export async function cancelMyReservation(reservationId: string): Promise<void> {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId)
    .in("status", ["pending", "confirmed"])
    .select("id");
  if (error) throw new Error(`Could not cancel the reservation: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("This reservation can no longer be cancelled.");
  }
}
