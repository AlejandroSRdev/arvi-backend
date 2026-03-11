We need to refactor our Stripe billing flow to correctly handle plan upgrades and downgrades.

Current issue
-------------
Our current implementation incorrectly updates the Stripe subscription directly inside the `createCheckoutSession` use case when a user already has an active subscription and requests a different plan.

This causes incorrect behavior:
- the subscription is updated before any payment is confirmed
- the backend may return `{ updated: true }`
- the UI may interpret the change as completed
- the database and Stripe state can become inconsistent
- in some cases the user ends up with two subscriptions

Business rule we want
---------------------
A plan change (upgrade or downgrade) must only happen AFTER a successful payment.

Therefore:

1) If the user requests the SAME plan
   → open Stripe Billing Portal

2) If the user requests a DIFFERENT plan
   → create a checkout session for payment
   → DO NOT update the Stripe subscription yet
   → include metadata indicating a plan change
   → the webhook will later execute the subscription update

Important rule:
The webhook must be the single source of truth for plan activation.

Required implementation changes
--------------------------------

1. Update the `createCheckoutSession` use case.

When the user already has `stripeSubscriptionId` and requests a different plan:

REMOVE this logic:

- any call to `stripe.updateSubscription`
- returning `{ updated: true }`

Instead:

Create a Stripe Checkout Session with:

mode: "payment"

Include metadata so the webhook knows this is a plan change:

metadata:
{
  userId: userId,
  action: "plan_change",
  currentSubscriptionId: user.stripeSubscriptionId,
  targetPriceId: requestedPriceId
}

Return the checkout URL normally.

Important:
This checkout session must NOT create a new subscription.

The goal is only to collect payment before performing the plan change.

2. Preserve current behavior for SAME PLAN requests.

If the requested plan is the same as the current one:

return stripeService.createBillingPortalSession({
  customerId,
  returnUrl: successUrl
})

3. Modify the `ProcessStripeWebhook` use case.

Handle the event:

event.type === "checkout.session.completed"

Read the metadata from the session.

If:

metadata.action === "plan_change"

then perform the plan update:

- retrieve the current subscription
- update the subscription price

Example logic:

stripe.subscriptions.update(
  metadata.currentSubscriptionId,
  {
    items: [{
      id: existingSubscriptionItemId,
      price: metadata.targetPriceId
    }]
  }
)

Important:
You must use the existing subscription item id, otherwise Stripe will create a second item.

4. After updating the subscription, update the user plan in the database.

Example:

updateUser(userId, {
  plan: mapPriceIdToPlan(metadata.targetPriceId)
})

5. Ensure webhook idempotency.

Stripe may send the same event multiple times.

Prevent duplicate updates by checking whether the user already has the target plan before executing the update.

6. Add structured logs for debugging.

In createCheckoutSession:

log:
- userId
- currentPlan
- targetPlan
- stripeSubscriptionId
- checkoutSessionId

In webhook:

log:
- event.type
- metadata.action
- subscriptionId
- targetPriceId
- result of updateSubscription

Expected final behavior
-----------------------

Upgrade or downgrade flow:

User presses change plan
        ↓
createCheckoutSession
(mode: payment)
metadata.action = "plan_change"
        ↓
Stripe checkout page
        ↓
Payment succeeds
        ↓
Stripe webhook
        ↓
ProcessStripeWebhook reads metadata
        ↓
updateSubscription(existing subscription)
        ↓
update user plan in DB

Constraints
-----------

Do not introduce new external dependencies.

Keep the existing architecture:

- use cases
- stripeService
- userRepository

Only adjust the billing logic where required.

Return the full modified code for:

- createCheckoutSession use case
- ProcessStripeWebhook use case
- any small changes needed in stripeService