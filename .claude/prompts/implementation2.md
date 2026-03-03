You are the ENVIRONMENT CONFIGURATION REFINEMENT agent.

CONTEXT:
The Stripe integration is already implemented.
The system previously supported:
    STRIPE_MODE=test | live
    Separate test and live Stripe keys in the environment.

Your task is to restore and professionalize this environment resolution strategy.

You must NOT:
- Modify billing logic.
- Modify webhook logic.
- Modify use cases.
- Modify routing.
- Modify domain models.
- Introduce new features.

Your responsibility is strictly environment configuration and Stripe client initialization.

--------------------------------------------
OBJECTIVE
--------------------------------------------

Implement a clean, deterministic Stripe environment selection mechanism based on:

    STRIPE_MODE = "test" | "live"

--------------------------------------------
REQUIRED ENV STRUCTURE
--------------------------------------------

Assume environment variables exist in this format:

STRIPE_MODE=test

STRIPE_SECRET_KEY_TEST=...
STRIPE_WEBHOOK_SECRET_TEST=...

STRIPE_SECRET_KEY_LIVE=...
STRIPE_WEBHOOK_SECRET_LIVE=...

--------------------------------------------
IMPLEMENTATION REQUIREMENTS
--------------------------------------------

1️⃣ Centralize Stripe configuration resolution in one place (e.g., stripeConfig module).

2️⃣ Resolve keys based on STRIPE_MODE:

If STRIPE_MODE === "live":
    use STRIPE_SECRET_KEY_LIVE
    use STRIPE_WEBHOOK_SECRET_LIVE

If STRIPE_MODE === "test":
    use STRIPE_SECRET_KEY_TEST
    use STRIPE_WEBHOOK_SECRET_TEST

3️⃣ Validate configuration at startup:

- If STRIPE_MODE is missing → throw explicit error.
- If selected key is missing → throw explicit error.
- Do not silently fallback.

4️⃣ Export a resolved configuration object:

{
  mode,
  secretKey,
  webhookSecret
}

5️⃣ Stripe client initialization must consume only the resolved configuration.

--------------------------------------------
LOGGING REQUIREMENTS
--------------------------------------------

At application startup (once):

Log clearly:

"Stripe initialized in TEST mode"
or
"Stripe initialized in LIVE mode"

Do NOT log secret values.

--------------------------------------------
DO NOT
--------------------------------------------

- Do not infer mode from NODE_ENV.
- Do not hardcode keys.
- Do not duplicate resolution logic in multiple files.
- Do not change existing Stripe service API.

--------------------------------------------
OUTPUT EXPECTATIONS
--------------------------------------------

- Show new stripeConfig module.
- Show updated stripe client initialization using resolved config.
- Keep changes minimal and isolated.
- No unrelated refactors.

Goal:
Make Stripe environment switching explicit, safe, and production-grade.