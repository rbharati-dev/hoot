// Payments: placeholders until a payment provider is connected.
//
// Everything the screens need goes through these two functions, so wiring in
// Stripe later means changing this file only.
//
// TODO(stripe): implement both with Stripe Checkout.
//   1. Add a tiny server endpoint (e.g. a Firebase Cloud Function) that creates
//      a Checkout Session with the secret key (never put that key in the app):
//        - donations: mode 'payment', one line item with `amountCents` (USD)
//        - subscriptions: mode 'subscription', the Price ID for the plan
//      and returns the session URL. Pass the Firebase uid as
//      `client_reference_id` so the webhook can find the account.
//   2. Here: POST to that endpoint, then `window.location.assign(url)`.
//   3. A Stripe webhook (checkout.session.completed, customer.subscription.*)
//      writes the Plus entitlement to the account, which the app reads.
//   4. Return { ok: true } only after the redirect starts; map failures to
//      'offline' | 'failed'.

export type PaymentResult = { ok: true } | { ok: false; reason: 'not-configured' | 'offline' | 'failed' };
export type Plan = 'monthly' | 'yearly';

/** Are payments connected in this build? (They are not yet.) */
export const paymentsConfigured = false;

export async function startDonation(_amountCents: number): Promise<PaymentResult> {
  return { ok: false, reason: 'not-configured' };
}

export async function startSubscription(_plan: Plan): Promise<PaymentResult> {
  return { ok: false, reason: 'not-configured' };
}
