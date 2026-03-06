ENDPOINT
HTTP Method: POST
Path: /api/billing/create-checkout-session


PURPOSE
Create a Stripe Checkout session for subscription plan acquisition.


ACTORS

- Frontend (Flutter client)
- Backend HTTP controller
- Stripe API
- Firestore database


EXECUTION FLOW

1. Frontend sends a request to the backend to initiate plan acquisition.
2. Request reaches BillingRoutes.
3. RateLimiter middleware validates request rate limits.
4. JWT authentication middleware verifies user identity.
5. CreateCheckoutSessionEndpoint controller receives the request.
6. Controller calls CreateCheckoutSessionUseCase.
7. Application use case resolves plan → Stripe priceId mapping.
8. Use case invokes StripeService adapter.
9. StripeService creates a Stripe Checkout session using Stripe API.
10. Stripe returns the checkout session URL.
11. Backend returns the URL to the frontend.


REQUEST

Content-Type:
application/json

Body Schema:

{
  plan: "BASE" | "PRO"
}

Example Request:

{
  "plan": "BASE"
}


RESPONSE

Status Code:
200

Body Schema:

{
  url: string
}

Example Response:

{
  "url": "https://checkout.stripe.com/session/..."
}


SIDE EFFECTS

External API call:
- Stripe Checkout Session is created.

Session configuration:

{
  mode: "subscription",
  payment_method_types: ["card"],
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  metadata,
  subscription_data: { metadata },
  success_url: `${process.env.SUCCESS_BASE_URL}?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: process.env.CANCEL_URL
}

Request executed with idempotencyKey.


NOTES

- User must be authenticated via JWT.
- This endpoint does NOT activate the subscription.
- Subscription state is updated only after Stripe webhook processing.
- Stripe session creation is idempotent using Stripe idempotency keys.