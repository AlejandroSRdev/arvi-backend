You are performing a controlled refactor in a production backend.

Objective:
Fix CreateUser flow to align with the new Stripe-based billing model.

Context:
- Stripe is now the source of truth for paid subscriptions.
- Users must not default to "pro".
- All new users must start in "freemium".
- The User entity and repository already contain new Stripe-related fields (stripeCustomerId, stripeSubscriptionId, planStatus, etc.).
- The current implementation hardcodes plan: "pro" and Limits.pro() in CreateUser.js.
- The AuthController response body also hardcodes plan: "pro".

Tasks:

1. Update CreateUser.js:
   - Remove any hardcoded "pro" plan assignment.
   - Initialize user with:
     - plan: "freemium"
     - planStatus: appropriate default (e.g., "INACTIVE" or null depending on current model)
     - stripeCustomerId: null
     - stripeSubscriptionId: null
     - limits consistent with freemium plan (use PlanPolicy, not hardcoded limits).
   - Ensure no legacy billing logic remains.

2. Update AuthController:
   - Remove hardcoded "pro" in response.
   - Ensure response reflects actual plan returned from the use case.

3. Ensure:
   - No changes break existing login flow.
   - No changes affect Stripe webhook processing.
   - No paid plan is activated outside webhook flow.
   - No temporary values remain.

Constraints:
- Do not modify Stripe webhook logic.
- Do not introduce new business rules.
- Do not redesign PlanPolicy.
- Only adjust user creation and response layer.

Output:
- Provide updated CreateUser.js.
- Provide updated AuthController.js (only modified parts).
- Brief summary of changes made.