You are fixing a critical business rule: monthly actions quota per plan.

Context:
Plans already define allowed monthly actions per plan (e.g., PRO, BASE, etc).
Currently only maxActiveSeries is enforced; monthly actions are not correctly initialized/updated.

Goals:
1) Ensure User has limits fields to support monthly actions:
   - limits.monthlyActionsMax (number)
   - limits.monthlyActionsRemaining (number)
   - limits.monthlyActionsResetAt (timestamp, optional but recommended)
2) On user creation:
   - initialize these limits according to plan (default freemium)
   - monthlyActionsRemaining = monthlyActionsMax
3) On plan activation/change (Stripe events):
   - update monthlyActionsMax according to the new plan
   - set monthlyActionsRemaining = monthlyActionsMax (simple approach for now)
   - set/reset monthlyActionsResetAt appropriately (e.g., now + 30 days or next month boundary)
4) On action creation endpoint/use-case:
   - atomically decrement monthlyActionsRemaining by 1
   - if remaining is 0, reject with domain error (quota exceeded)
   - ensure idempotency if action creation supports idempotency keys
   - ensure concurrency safety (transaction / compare-and-swap), consistent with existing patterns

Constraints:
- Do not redesign the whole billing system.
- Keep minimal, production-operable behavior.
- Make sure the user creation path uses the same plan policy source of truth.
- Update tests if they exist, add at least 2 minimal tests: (a) user created has correct limits, (b) action decrements and blocks at 0.

Deliverables:
- Identify the plan policy source of truth and where to wire the limits update.
- Provide code changes and brief rationale.