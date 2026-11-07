// Payments. Donations go to Stripe Payment Links (below); subscriptions are
// placeholders, since Hoot is free.
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

/** Are subscription payments connected in this build? (Not yet: Hoot is free.) */
export const paymentsConfigured = false;

// Donations: Stripe Payment Links where the donor chooses the amount (CA$/US$10
// suggested, 1 minimum, 5,000 maximum, thank-you message on Stripe's page).
// Links are public by design; no secret key is involved.
export const DONATION_LINKS = {
  cad: 'https://buy.stripe.com/8x2aEZ9gS3qze695xh38400',
  usd: 'https://buy.stripe.com/14A9AVct44uD7HLf7R38401',
} as const;
export const donationsConfigured = true;

/** People in the US give in US dollars; everyone else in Canadian dollars. */
export function donationCurrency(country: string | null | undefined): 'cad' | 'usd' {
  return country === 'us' ? 'usd' : 'cad';
}

/** Opens Stripe's donation page (in a new tab, so Hoot stays open). */
export function startDonation(country: string | null | undefined): PaymentResult {
  const url = DONATION_LINKS[donationCurrency(country)];
  const w = window.open(url, '_blank', 'noopener');
  if (!w) window.location.assign(url); // pop-up blocked: go there directly
  return { ok: true };
}

export async function startSubscription(_plan: Plan): Promise<PaymentResult> {
  return { ok: false, reason: 'not-configured' };
}
