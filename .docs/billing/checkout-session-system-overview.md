  ---
  SYSTEM_OVERVIEW

  ---
  Purpose

  POST /api/billing/create-checkout-session initiates a Stripe Checkout session for subscription plan acquisition. The endpoint accepts a plan identifier (BASE or PRO),       
  resolves it to the corresponding Stripe price, and returns a Stripe-hosted checkout URL to the client. This endpoint does not activate or modify the user's subscription     
  state. Subscription state is updated exclusively through the Stripe webhook processing pipeline after successful payment confirmation.

  Actors

  - Frontend (Flutter client): Initiates the request with a JWT-authenticated HTTP call and the desired plan key.
  - RateLimiter (infrastructure middleware): Enforces request rate limits before routing proceeds.
  - JWT Middleware (infrastructure middleware): Verifies user identity via JWT token; rejects unauthenticated requests.
  - BillingController (infrastructure layer): Thin HTTP controller that receives the request and delegates entirely to the application use case. Contains no business logic.   
  - CreateCheckoutSessionUseCase (application layer): Orchestrates the use case — resolves the plan key to a Stripe priceId and coordinates the infrastructure adapter call    
  through the port contract.
  - StripeService adapter (infrastructure layer): Infrastructure adapter that implements the port defined by the application layer. Communicates directly with the external    
  Stripe API.
  - Stripe API (external service): Creates the Checkout session and returns the hosted session URL.

  Execution Flow

  1. The Flutter client sends POST /api/billing/create-checkout-session with a JSON body containing the plan key and a valid JWT in the Authorization header.
  2. The infrastructure routing layer (BillingRoutes) receives the request and applies the middleware chain.
  3. The RateLimiter middleware validates request rate limits; the request is rejected with 429 if limits are exceeded.
  4. The JWT authentication middleware verifies user identity and attaches user context to the request; unauthenticated requests are rejected with 401.
  5. The BillingController receives the validated request and invokes CreateCheckoutSessionUseCase, delegating all orchestration to the application layer.
  6. CreateCheckoutSessionUseCase resolves the plan key (BASE or PRO) to the corresponding Stripe priceId using environment-configured price mappings.
  7. The use case invokes the StripeService adapter (via the infrastructure port), providing session parameters — customer ID, priceId, metadata, success/cancel URLs — and an 
  idempotency key.
  8. The StripeService adapter calls the Stripe API in subscription mode and receives the resulting Checkout session URL.
  9. The URL propagates back from the adapter to the use case, and from the use case to the BillingController.
  10. The BillingController responds with HTTP 200 and { url: string }.

  Errors are thrown as typed error classes, caught in the controller's catch block, forwarded via next(err) to the centralized error middleware, and translated to HTTP        
  responses exclusively in ErrorMapper.js. A Stripe API failure produces a StripeProviderFailureError, which maps to HTTP 502.

  Side Effects

  - A Stripe Checkout session is created on Stripe's infrastructure. The operation is idempotent via a Stripe idempotency key.
  - No database state is written at this endpoint. No user plan fields are modified.
  - Subscription activation occurs exclusively through the Stripe webhook pipeline upon successful payment confirmation from Stripe.

  ---