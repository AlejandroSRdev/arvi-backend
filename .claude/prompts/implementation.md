# Implement clean Stripe subscription update flow for plan changes

Implement a clean refactor of the billing flow so that:

- **new subscription** → creates a Stripe Checkout Session
- **same active plan** → opens Stripe Billing Portal
- **different active plan** → updates the existing Stripe subscription in place
- **the database remains synchronized only through webhooks**, not directly from the checkout/update use case

## Scope

Work only on the minimum set of files required for this refactor.

## Required behavior

### 1. CreateCheckoutSessionUseCase
Refactor the current use case so that:

- if the user has **no `stripeSubscriptionId`**:
  - create a normal Stripe Checkout Session
- if the user **has `stripeSubscriptionId`**:
  - retrieve the Stripe subscription
  - get the current active price from `subscription.items.data[0].price.id`
  - if the current price is the same as the requested plan price:
    - return a Billing Portal session
  - if the current price is different:
    - call `stripeService.updateSubscription(...)`
    - do **not** create a new checkout session
    - do **not** cancel the old subscription
    - return a non-broken explicit response such as `{ updated: true }`

### 2. Stripe service
Ensure there is a clean method for updating subscriptions in Stripe.

Expected behavior:

- update the existing subscription item with the new price
- use Stripe’s normal proration behavior for upgrades/downgrades
- do not create a second subscription
- do not cancel the previous subscription first

Use a method with a clean contract, for example:

- input: `subscriptionId`, `itemId`, `priceId`
- output: Stripe subscription result or a normalized result object

### 3. Controller / HTTP response contract
Adjust the controller that calls this use case so it can safely handle both response shapes:

- `{ url: string }`
- `{ updated: true }`

Requirements:

- if `result.url` exists → return it normally
- if `result.updated === true` → return a valid JSON response without frontend-breaking nulls
- do **not** return `{ url: null }`

### 4. Webhook synchronization
Do **not** update the user plan directly inside the checkout/update use case.

Instead, confirm or complete webhook handling so that plan synchronization is driven by Stripe events.

At minimum, the webhook flow must correctly support:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted` (if already part of current flow)

For `customer.subscription.updated`, ensure the user plan in the database is resolved from the current Stripe price ID and updated accordingly.

### 5. Metadata continuity
Ensure Stripe subscription metadata is sufficient for webhook reconciliation.

When creating a new checkout session, make sure the resulting subscription can still be mapped back to the user in webhook processing.

If needed, add `subscription_data.metadata` with at least:
- `userId`

Keep existing metadata conventions consistent with the current codebase.

## Constraints

- Preserve the existing architectural style and responsibility boundaries
- Do not introduce unnecessary abstractions
- Do not rewrite unrelated billing logic
- Do not introduce direct DB plan mutation in the use case
- Do not keep the temporary “new checkout for plan change” behavior
- Do not return nullable `url` fields

## Output expected from you

Provide:

1. the modified code
2. a short explanation of each changed file
3. any migration or compatibility note if the frontend response handling changes
4. any edge case you noticed during implementation

Keep the implementation minimal, coherent, and production-safe.