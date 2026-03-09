Goal:
Implement a minimal and deterministic trial plan system.

Requirements:

1. When a user registers, they automatically receive the TRIAL plan.

2. The TRIAL plan must last for the duration defined in:
PLANS.TRIAL.durationDays

3. Store in the user document:
- plan
- planStartedAt
- planExpiresAt

4. Implement helper functions:

resolveUserPlan(user)
→ returns planId or null if expired

getPlanLimits(planId)
→ returns limits defined in PLANS

5. The trial expires automatically based on time comparison.
No cron jobs or background tasks.

6. Registration flow must assign trial plan correctly.

7. The system must gracefully handle expired trials.

Output:
- updated register use case
- resolveUserPlan helper
- getPlanLimits helper