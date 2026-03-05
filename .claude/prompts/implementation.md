You are modifying an existing Stripe webhook processing use case.

File:
Application layer
ProcessStripeWebhookUseCase.js

Goal:
Fix the webhook event handling so the system correctly processes the full Stripe subscription lifecycle when using Stripe Checkout.

Constraints:
- Preserve the existing architecture.
- Do NOT change repository interfaces.
- Do NOT remove idempotency (atomicProcessStripeEvent).
- Maintain retryable vs non-retryable error semantics.
- Maintain existing logging style (billingLog / billingLogError).
- Keep the code simple and consistent with the current file.

Current problem:
The system ignores `checkout.session.completed`, and `invoice.paid` expects metadata that is not guaranteed to exist if the session metadata was not propagated to the subscription.

Tasks:

1) Add support for the event:

checkout.session.completed

This event should activate the subscription for the user.

The handler must:
- read the Stripe session object
- determine userId using:
    session.client_reference_id
    OR session.metadata.userId
- determine planKey using:
    session.metadata.internalPlan
    OR session.metadata.plan
- map the planKey using PLAN_KEY_TO_ID
- update the user via userRepository.atomicProcessStripeEvent

Fields to persist:

plan
planStatus = "ACTIVE"
stripeCustomerId = session.customer
stripeSubscriptionId = session.subscription

2) Add a new handler:

handleInvoicePaymentFailed

Triggered by:
invoice.payment_failed

Behavior:
- resolve userId using resolveUserIdFromInvoice
- set:

planStatus = "PAST_DUE"

Stripe will retry payments automatically; do not cancel the plan.

3) Update processStripeWebhook so it routes events:

checkout.session.completed
invoice.paid
invoice.payment_failed
customer.subscription.deleted

All other events must continue to be logged with:

billingLog('stripe_webhook_unhandled_event')

4) Maintain existing patterns:

- atomicProcessStripeEvent(eventId, userId, updatePayload)
- logging events
- recording logical failures via recordFailedStripeEvent
- retryable errors must still propagate

5) Ensure the new handlers follow the same error-handling pattern as handleInvoicePaid.

Deliverable:
Return the full updated contents of ProcessStripeWebhookUseCase.js with the new handlers and updated router.