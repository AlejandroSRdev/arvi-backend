You are editing a Node.js backend with a hexagonal architecture.

Task: simplify subscription state in User entity.

Current fields (example):
- plan
- planStatus
- subscriptionStatus
- subscriptionUpdatedAt
- stripeCustomerId
- stripeSubscriptionId

Goal:
1) Remove subscriptionStatus and subscriptionUpdatedAt from the User entity and all persistence mappings.
2) Add two fields:
   - subscribedAt (nullable timestamp)
   - canceledAt (nullable timestamp)

Event handling updates:
- checkout.session.completed:
  - set plan = <mapped plan>
  - set planStatus = "ACTIVE"
  - set stripeCustomerId, stripeSubscriptionId
  - set subscribedAt = now (only if not already set)
  - set canceledAt = null
- customer.subscription.deleted:
  - set plan = "freemium"
  - set planStatus = "CANCELED"
  - set canceledAt = now
  - do NOT delete stripeCustomerId (keep)
  - stripeSubscriptionId can be kept or nulled — follow current conventions, but be consistent
- invoice.paid:
  - do NOT require metadata plan; if missing, safely ignore.
  - optionally refresh stripeSubscriptionId if present and user doesn't have it

Also check:
- any DTOs, Firestore serializers, schema validators, domain models, TypeScript types (if any), tests, docs, and migrations.

Constraints:
- Preserve idempotency and atomicProcessStripeEvent.
- Preserve existing logging patterns.
- Do not introduce new architecture layers.

Deliverables:
- List files changed with a brief justification.
- Provide patch/diff or updated code sections.