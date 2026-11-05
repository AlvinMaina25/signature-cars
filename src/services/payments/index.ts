import { supabase } from "@/integrations/supabase/client";
import type { Payment } from "@/data/types";
import { createReservationWithPayment } from "@/lib/payments.functions";

import { toPayment, type PaymentRow } from "../mappers";

export * from "./types";
export * from "./registry";

const SELECT =
  "id, reservation_id, user_id, car_id, amount, currency, provider, provider_reference, status, created_at, cars ( year, make, model ), profiles ( full_name, email )";

/** Admins see every payment; customers see only their own (row level security). */
export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load payments: ${error.message}`);
  return ((data ?? []) as unknown as PaymentRow[]).map(toPayment);
}

/** Full payment history for one reservation, oldest first. */
export async function listReservationPayments(reservationId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(SELECT)
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load payment history: ${error.message}`);
  return ((data ?? []) as unknown as PaymentRow[]).map(toPayment);
}

export { createReservationWithPayment };
