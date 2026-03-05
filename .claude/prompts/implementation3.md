You are debugging Stripe checkout session creation failing with:
"No such price: 'price_1SY6AaFnbJHY3wkaHxiKHgtu'"

Goal:
1) Identify where price IDs are configured/mapped per plan (BASE/PRO/etc).
2) Determine if the backend is running in STRIPE_MODE=test and using the correct secret key.
3) Validate the likely root cause:
   - mixing live vs test price IDs
   - wrong Stripe account/keys
   - old/archived price IDs
   - wrong environment variables loaded in the deployment
4) Implement improvements:
   - Validate price ID format and presence on startup (fail-fast with explicit logs)
   - Log stripeMode + which priceId is being used when creating checkout session
   - Provide a clear error message that includes planKey and stripeMode
   - Ensure mapping chooses price IDs based on stripeMode

Constraints:
- Do not add external dependencies.
- Keep code changes minimal.
- Do not hardcode secret keys.
- Avoid leaking secrets in logs.

Deliverables:
- Explain probable cause(s) with evidence from code paths.
- Provide code changes: improved mapping & logging.
- Provide a short operator checklist: what to verify in Stripe dashboard (test vs live prices).