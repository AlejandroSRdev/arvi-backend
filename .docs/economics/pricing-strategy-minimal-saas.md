# Arvi / Habit Series
# Pricing & Minimum SaaS Strategy
**Date:** 2026-03-02  
**Status:** Active Decision (V1 Locked)

---

## 1. Strategic Context

The objective is **not** to build a perfect product.

The objective is to build a **technically operable SaaS system**:
- Subscription-based
- With real billing
- With enforced usage limits
- With controlled AI cost
- With clean backend architecture

This is a structural milestone, not a growth milestone.

---

## 2. Product Scope (Minimum SaaS Operable)

### Current Core Feature
- Users generate personalized habit series.
- Each series is static once created.
- Future extension: allow creating additional actions per series.

### SaaS Minimum Requirements
To justify subscription:
- Series persist over time.
- Users can create multiple series.
- Users can interact with series (completion state).
- AI generation is gated by subscription limits.

No gamification.
No points economy.
No ranking.
No advanced analytics.

Only:
- Persistent state
- Controlled generation
- Recurring value

---

## 3. Real AI Cost Baseline

From execution analysis (2026-02-25 sample):

- Mean cost per series creation: **$0.00128466**
- Recommended safety baseline (+25%): **$0.00160583**

Cost variability is extremely stable.
Scaling cost is dominated by Gemini input size and GPT output length.

Conclusion:
AI cost is negligible relative to subscription pricing.
Business risk is product retention, not infrastructure cost.

---

## 4. Pricing Model (V1 Locked)

### Trial
- Duration: 3 days
- Up to 5 active series
- Up to 25 monthly actions
- No payment required

Purpose:
- Reduce friction
- Allow real experience of loop
- Minimal financial risk

---

### Base Plan — $2.99 / month
- Up to 10 active series
- Up to 50 monthly actions

Positioning:
Low entry subscription.
Accessible.
Designed for validation phase.

---

### Pro Plan — $5.99 / month
- Up to 20 active series
- Up to 100 monthly actions
- Designed for advanced or power users

Positioning:
High ceiling without being "unlimited".

---

## 5. Key Strategic Principles

1. No unlimited plans in V1.
2. Limits are structural, not cost-driven.
3. Monthly reset required.
4. Stripe in USD.
5. Backend enforces all limits.
6. Product expansion is secondary to operability.

---

## 6. Architectural Implications

Backend must implement:

- Subscription entity (separate from User)
- Plan type (trial, base, pro, freemium)
- Usage counters (series_created, actions_created)
- Billing cycle tracking
- Monthly reset mechanism
- Stripe webhook handling
- Access middleware enforcing limits

All business rules must live in the backend.
AI never decides access.

---

## 7. What This Is NOT

- Not a polished consumer product.
- Not a gamified system.
- Not a growth-optimized SaaS.
- Not final pricing.

This is a structural phase:
"Make it real. Make it charge. Make it enforce."

---

## 8. Definition of Success

The system is considered SaaS-operable when:

- Users can subscribe via Stripe.
- Subscription state is persisted and validated server-side.
- Limits are enforced correctly.
- Monthly reset works deterministically.
- Trial transitions correctly to paid or expired state.

Only after this is stable will product expansion continue.

---

End of document.