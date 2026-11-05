/**
 * Payment foundation.
 *
 * The app never talks to a payment provider directly. It asks for a payment
 * *intent* through this interface; a provider adapter (M-Pesa, Stripe, PayPal)
 * fulfils it server-side later. Payment status is owned by the database and is
 * only ever written by trusted server-side code — never by the browser.
 *
 * Nothing sensitive is modelled here: no card numbers, CVVs, PINs or provider
 * secrets. Only the provider's own transaction reference is stored.
 */

import type { PaymentProvider, PaymentStatus } from "@/data/types";

export interface PaymentIntentRequest {
  reservationId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  /** Non-sensitive contact detail some rails need, e.g. an M-Pesa phone number. */
  payerContact?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  status: PaymentStatus;
  /** Provider transaction id, when the provider returns one immediately. */
  providerReference?: string;
  /** Hosted checkout URL, when the provider uses a redirect flow. */
  redirectUrl?: string;
}

/** Contract every future payment rail implements, server-side only. */
export interface PaymentProviderAdapter {
  readonly id: PaymentProvider;
  readonly label: string;
  readonly enabled: boolean;
  createIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>;
}

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  mpesa: "M-Pesa",
  stripe: "Card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  financing: "Financing",
  manual: "Manual",
};
