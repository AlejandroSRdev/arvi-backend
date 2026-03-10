You are working on a Node.js backend that integrates Stripe subscriptions.

The system already has a use case called `createCheckoutSession`.

Your task is to improve this use case to properly handle:

1) new subscriptions
2) upgrades
3) downgrades
4) portal access when the user already has the selected plan
5) secure validation of Stripe prices

Do NOT introduce new endpoints.

All logic must remain inside the existing `createCheckoutSession` use case.

Do NOT refactor unrelated code.

Only implement the required logic safely.

------------------------------------------------

CONTEXT

The frontend sends a request to subscribe to a plan.

Currently it sends a Stripe priceId.

However, priceIds must NEVER be trusted from the frontend.

The backend must validate them against allowed prices stored in environment variables.

The system already supports two Stripe modes:

- test
- live

And environment variables are already used for Stripe price IDs.

------------------------------------------------

STEP 1 — Create allowed price list

Create a constant that contains the valid Stripe prices.

These must come from the existing environment variables.

Example:

const ALLOWED_PRICES = [
  process.env.STRIPE_PRICE_BASE,
  process.env.STRIPE_PRICE_PRO
];

Do NOT hardcode Stripe price IDs.

Always read them from `.env`.

This ensures the system works correctly in both Stripe test mode and live mode.

------------------------------------------------

STEP 2 — Validate requested price

Before doing anything with Stripe, validate the requested priceId.

Example logic:

if (!ALLOWED_PRICES.includes(requestedPriceId)) {
  throw new Error("Invalid priceId");
}

This prevents frontend manipulation of Stripe prices.

------------------------------------------------

STEP 3 — Retrieve user subscription

If the user already has a subscriptionId stored in the database:

Retrieve the subscription from Stripe:

const subscription = await stripe.subscriptions.retrieve(subscriptionId);

Get the current priceId:

const currentPriceId = subscription.items.data[0].price.id;

------------------------------------------------

STEP 4 — Same plan

If the user is already subscribed to the requested plan:

currentPriceId === requestedPriceId

Do NOT create a new checkout session.

Instead create a Stripe Billing Portal session:

await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: SUCCESS_URL
});

Return the portal URL.

------------------------------------------------

STEP 5 — Upgrade or downgrade

If the user has a subscription but requestedPriceId is different:

Update the existing subscription.

Use:

await stripe.subscriptions.update(subscriptionId, {
  items: [{
    id: subscription.items.data[0].id,
    price: requestedPriceId
  }],
  proration_behavior: "create_prorations"
});

Return a simple success response.

Do NOT create a checkout session here.

------------------------------------------------

STEP 6 — New user

If the user has no subscriptionId:

Create a Stripe checkout session exactly as the system currently does.

mode: "subscription"

Use the validated requestedPriceId.

------------------------------------------------

IMPORTANT RULES

• Do not trust frontend priceId without validation.
• Always read allowed price IDs from `.env`.
• Do not introduce new endpoints.
• Do not refactor unrelated code.
• Do not change Stripe webhook logic.
• Only modify the createCheckoutSession use case.

------------------------------------------------

EXPECTED RESULT

The createCheckoutSession flow becomes:

1) validate priceId
2) if no subscription → create checkout session
3) if same plan → open Stripe portal
4) if different plan → update subscription