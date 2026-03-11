# Add precise trace logs to CreateCheckoutSession endpoint to identify all billing branches

Add **high-signal, low-noise trace logging** to the full `CreateCheckoutSession` flow so we can diagnose exactly which billing path is being executed at runtime.

The goal is to clearly distinguish these 3 cases:

1. **new subscription / acquire plan** → creates Stripe Checkout Session
2. **same active plan / manage plan** → opens Stripe Billing Portal
3. **different active plan / update plan** → updates existing Stripe subscription in place

## Scope

Instrument only the minimum relevant code path for this diagnosis:

- `CreateCheckoutSessionUseCase`
- the controller/handler that exposes the endpoint
- Stripe service methods directly involved in this flow, if needed for visibility

Do **not** refactor business logic unless strictly necessary for logging clarity.

## Logging objective

When a request hits the endpoint, logs must allow us to reconstruct the full decision path for a single execution from start to finish.

Each execution must make it obvious:

- which user triggered it
- which plan was requested
- whether the user had a Stripe customer
- whether the user had a `stripeSubscriptionId`
- whether Stripe subscription retrieval succeeded
- what the current Stripe price ID was
- what requested price ID was resolved
- which branch was taken:
  - `NEW_CHECKOUT`
  - `BILLING_PORTAL`
  - `SUBSCRIPTION_UPDATE`
- what the final response shape was:
  - `{ url }`
  - `{ updated: true }`
- whether any error happened, and at which step

## Requirements

### 1. Add a trace/correlation id per request
Generate or propagate a trace id for each endpoint execution.

Use it consistently in every log line of this flow.

Example format:

- `traceId`
- `billingTraceId`
- or reuse an existing request id if the project already has one

If no request id infrastructure exists, generate a simple one inside the controller for this endpoint.

### 2. Log at decision points inside CreateCheckoutSessionUseCase
Add structured logs before and after each meaningful step.

At minimum log:

#### Entry
- trace id
- user id
- requested plan
- normalized plan key

#### Plan validation result
- whether requested plan is valid
- resolved Stripe price id

#### User retrieval result
- whether user was found
- `stripeCustomerId` presence
- `stripeSubscriptionId` presence

#### Customer creation or reuse
- if customer was reused
- if customer was created
- created/reused customer id

#### Existing subscription retrieval
If `stripeSubscriptionId` exists, log:
- subscription id used for retrieval
- retrieval success/failure
- current Stripe price id
- requested Stripe price id

#### Branch decision
Log **exactly one** explicit branch marker:
- `branch=NEW_CHECKOUT`
- `branch=BILLING_PORTAL`
- `branch=SUBSCRIPTION_UPDATE`

#### Stripe operation result
- checkout session created → session id and url presence
- billing portal session created → url presence
- subscription updated → subscription id and resulting price id if available

#### Final return shape
- `responseType=URL`
- `responseType=UPDATED`
- or equivalent

### 3. Add controller-level request/response logs
At the endpoint/controller level, log:

#### Request received
- trace id
- authenticated user id
- requested plan
- endpoint name

#### Response sent
- trace id
- HTTP status
- whether response contains `url`
- whether response contains `updated: true`

#### Error path
If an exception occurs:
- trace id
- error name
- error message
- step/context if available

### 4. Prefer structured logs
Use structured logging if the codebase already has a logger.
If not, use consistent `console.log` / `console.error` formatting.

Prefer compact machine-readable logs such as:

```js
logger.info({
  traceId,
  event: 'billing.checkout.branch_selected',
  branch: 'SUBSCRIPTION_UPDATE',
  userId,
  requestedPlan: planKey,
  currentPriceId,
  requestedPriceId
});

If no logger abstraction exists, keep the shape consistent anyway.

5. Do not log sensitive data

Do not log:

tokens

full card/payment details

full request headers

secrets

raw webhook signatures

Customer ids, subscription ids, session ids, price ids, and user ids are acceptable for this debugging pass.

Expected branch markers

Make the logs explicitly searchable with these exact branch values:

NEW_CHECKOUT

BILLING_PORTAL

SUBSCRIPTION_UPDATE

And these exact event markers where relevant:

billing.checkout.request_received

billing.checkout.plan_validated

billing.checkout.user_loaded

billing.checkout.customer_reused

billing.checkout.customer_created

billing.checkout.subscription_loaded

billing.checkout.branch_selected

billing.checkout.checkout_created

billing.checkout.portal_created

billing.checkout.subscription_updated

billing.checkout.response_sent

billing.checkout.error

Output expected from you

Provide:

the modified code

a short explanation of every file changed

the exact log lines / event names introduced

a short note explaining how I can read the logs to distinguish the 3 runtime cases quickly

Keep the implementation minimal, traceable, and production-safe.