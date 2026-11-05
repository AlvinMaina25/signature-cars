/**
 * Provider registry.
 *
 * Adding a live rail later means implementing `createIntent` here (server-side)
 * and flipping `enabled` — no changes anywhere else in the application.
 * Live processing is intentionally not implemented yet.
 */

import type { PaymentProvider } from "@/data/types";

import type { PaymentProviderAdapter } from "./types";
import { PAYMENT_PROVIDER_LABELS } from "./types";

function notImplemented(id: PaymentProvider, enabled = false): PaymentProviderAdapter {
  return {
    id,
    label: PAYMENT_PROVIDER_LABELS[id],
    enabled,
    async createIntent() {
      throw new Error(`${PAYMENT_PROVIDER_LABELS[id]} payments are not enabled yet.`);
    },
  };
}

export const paymentProviders: Record<PaymentProvider, PaymentProviderAdapter> = {
  mpesa: notImplemented("mpesa"),
  stripe: notImplemented("stripe"),
  paypal: notImplemented("paypal"),
  bank_transfer: notImplemented("bank_transfer"),
  financing: notImplemented("financing"),
  // Deposits recorded by staff / held for manual confirmation.
  manual: notImplemented("manual", true),
};

export function getPaymentProvider(id: PaymentProvider): PaymentProviderAdapter {
  return paymentProviders[id];
}

export function listEnabledPaymentProviders(): PaymentProviderAdapter[] {
  return Object.values(paymentProviders).filter((provider) => provider.enabled);
}
