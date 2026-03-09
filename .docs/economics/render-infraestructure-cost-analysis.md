# Render Infrastructure Cost Analysis
Date: 2026-03-07  
Status: Reference — Infrastructure Baseline

---

# 1. Context

Arvi currently runs its backend on **Render** as a managed PaaS.

The objective of this document is to define:

- minimum infrastructure cost
- scaling thresholds
- when a migration to a different cloud provider becomes economically reasonable

This analysis focuses only on **compute infrastructure**, excluding:

- Firestore database
- AI model execution
- Stripe billing

---

# 2. Current Render Pricing Model

As of March 2026 Render provides two relevant tiers for early SaaS systems:

## Free

Capabilities:

- Full-stack deployments
- Managed infrastructure
- Custom domains
- CDN
- Security defaults
- Email support

Limitations:

- sleeping services
- cold start latency
- limited resources
- not suitable for production workloads requiring low latency

Typical usage:

- development
- staging
- validation

---

## Professional — $19/month

Adds:

- 500GB bandwidth included
- horizontal autoscaling
- preview environments
- isolated environments
- team collaboration
- private link connections
- chat support

Most importantly:

**services remain active and do not sleep.**

This is required for:

- production API latency
- reliable Stripe webhooks
- consistent backend availability

---

# 3. Minimum Infrastructure Cost

The minimal production configuration for Arvi is:

Render backend service:

$19 / month

Additional infrastructure:

Firestore usage: ~$0–3  
Logs / miscellaneous: ~$1

Estimated baseline infrastructure cost:

≈ $20–23 / month

---

# 4. Break-Even Users (Infrastructure Only)

Base plan price:

$2.99 / month

Infrastructure break-even:

20 / 2.99 ≈ 7 users

Therefore:

**~7 paying users cover the entire infrastructure cost.**

All additional users operate with extremely high margin.

---

# 5. Render Scaling Capability

A single Node backend instance with light workload typically supports:

≈ 50–200 requests / second

For Arvi this corresponds roughly to:

5,000–20,000 active users depending on usage intensity.

Because:

- compute load is low
- database is external (Firestore)
- AI inference is external (API providers)

Render can therefore support the early scaling phase without architectural changes.

---

# 6. When Render Stops Being Economically Efficient

Render remains economically efficient until infrastructure cost approaches:

$300–500 / month

At this scale, switching to infrastructure providers such as:

- AWS
- Azure
- GCP

may reduce compute cost due to:

- lower raw VM pricing
- container orchestration
- spot instances

However migration introduces additional operational complexity:

- infrastructure management
- deployment pipelines
- networking configuration
- observability setup

Therefore early migration is rarely justified.

---

# 7. Recommended Strategy

Phase 1 — Development  
Render Free

Phase 2 — Production Launch  
Render Professional ($19)

Phase 3 — Early Growth  
Remain on Render while infra < $200/month

Phase 4 — Scale Evaluation  
Evaluate migration only when infra approaches $500/month

---

# 8. Conclusion

Render provides an extremely efficient infrastructure baseline for Arvi.

Key characteristics:

- minimal operational complexity
- predictable cost
- sufficient performance for early SaaS scale

Infrastructure cost is therefore **not a primary economic constraint** for the system.