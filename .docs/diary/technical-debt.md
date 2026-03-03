# technical-debt.md  
## Conscious Technical Debt

This file documents **explicitly acknowledged technical debt** in the Arvi Backend Service.

Conscious technical debt refers to known architectural or implementation limitations that are intentionally accepted under current constraints and will be addressed when justified by operational pressure.

Only deliberate and documented compromises belong here.

---

## 1️⃣ Domain Errors Returned as Generic HTTP 500

**Current Behavior**

- `User.create` throws plain `Error`.
- Errors do not extend `BaseError`.
- `errorMiddleware` maps them to:

```json
HTTP 500
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Unexpected error occurred"
}
```

### Impact

- **Indistinguishable Errors**: Domain validation failures are treated the same as real server crashes.
- **Lack of Semantic Distinction**: No differentiation between client errors (e.g., 400 / 422) and server errors (e.g., 500).
- **Reduced Observability**: Limited visibility into the nature of errors at the HTTP layer.

### Reason for Acceptance

- **Phase**: Early operational phase.
- **Focus**: Priority is on gaining real usage exposure rather than immediate semantic refinement.

### Planned Improvement

Introduce `DomainError` extending `BaseError`.  
Map domain violations to proper HTTP status codes.


## 2026-03-03 — Stripe Checkout Session Technical Debt

### 1. Potential Race Condition — Stripe Customer Creation
If two concurrent checkout requests are executed for the same user without a persisted `stripeCustomerId`, multiple Stripe customers could be created.
- Needs transactional protection or repository-level locking.
- Consider atomic "create-if-null" pattern.

### 2. Idempotency Key Scope
Current idempotency key: `checkout:{userId}:{planKey}`
- Prevents duplicate concurrent sessions.
- May be too rigid for long-term retries (e.g., user retries days later).
- Consider scoping idempotency to short-lived attempts (timestamp or UUID).

### 3. Missing Domain Policy on Active Subscriptions
No explicit domain rule prevents:
- Creating checkout for already active subscription.
- Re-purchasing same plan unintentionally.

A domain-level validation policy should define allowed transitions (e.g., BASE → PRO, PRO → PRO, etc.).

### Out-of-Order Event Processing

Current webhook logic assumes event arrival order reflects real subscription state progression.

Scenario risk:
1. `invoice.paid` (activation)
2. `customer.subscription.deleted` (cancellation)
3. Delayed `invoice.paid` arrives afterward

Because state transitions are applied based on processing order (not event creation timestamp),
a delayed event could incorrectly re-activate a canceled subscription.

Stripe usually delivers events in order, but this is not strictly guaranteed.

Future hardening:
- Compare event `created` timestamp before applying state change.
- Or persist and validate subscription status transitions explicitly.
- Or enforce monotonic state transitions in domain policy.