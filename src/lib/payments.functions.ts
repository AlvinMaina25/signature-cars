/**
 * Server-side reservation + payment writes.
 *
 * Payments carry no browser-writable permissions in the database, so every
 * payment row is created and transitioned here, after the caller's identity is
 * verified. This is where a real M-Pesa / Stripe / PayPal call will slot in.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const reservationInput = z.object({
  carId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  currency: z.string().min(3).max(3).default("KES"),
  pickupDate: z.string().optional(),
  provider: z
    .enum(["mpesa", "stripe", "paypal", "bank_transfer", "financing", "manual"])
    .default("manual"),
});

/**
 * Creates a reservation for the signed-in user and opens a `pending` payment
 * record for it. A reservation may collect several payment records over time
 * (retries, balance instalments, refunds) — this only opens the first one.
 */
export const createReservationWithPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reservationInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        car_id: data.carId,
        amount: data.amount,
        currency: data.currency,
        pickup_date: data.pickupDate || null,
      })
      .select("id")
      .single();

    if (reservationError) {
      if (reservationError.code === "23505" || reservationError.code === "23P01") {
        throw new Error("This car already has an active reservation.");
      }
      throw new Error(`Could not create the reservation: ${reservationError.message}`);
    }

    // Payments are service-role only: the browser can never write a status.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        reservation_id: reservation.id,
        user_id: userId,
        car_id: data.carId,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (paymentError) {
      throw new Error(`Could not open a payment record: ${paymentError.message}`);
    }

    return {
      reservationId: reservation.id,
      paymentId: payment.id,
      status: payment.status,
    };
  });

const statusInput = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(["pending", "processing", "successful", "failed", "cancelled", "refunded"]),
  providerReference: z.string().max(200).optional(),
});

/**
 * Admin-only payment transition. Used by back office today and by verified
 * provider callbacks later. The status value itself is never trusted from the
 * browser without this role check.
 */
export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => statusInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!admin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payments")
      .update({
        status: data.status,
        ...(data.providerReference ? { provider_reference: data.providerReference } : {}),
      })
      .eq("id", data.paymentId);

    if (error) throw new Error(`Could not update the payment: ${error.message}`);
    return { ok: true };
  });
