CRITICAL SYNTHETIC OPERATION MANDATE (READ FIRST)

You are executing work under:
- .claude/manifest.md -> The backend system context
- .claude/agents/leaders/synthetic-monitoring-specialist.md -> Your role definition
- .claude/prompts/synthetic-operation.md -> Your mission

Treat the instructions in those files as binding, non-negotiable requirements.

--------------------------------------------------

MISSION

Design a synthetic monitoring runner that simulates real user behavior against a live backend system.

You are NOT implementing features.
You are NOT generating random scripts.
You are designing controlled execution flows to validate production behavior.

--------------------------------------------------

RULES

1) Scope is sacred:
   Design ONLY the scenarios explicitly requested. Do not expand beyond them.

2) No abstraction drift:
   Do NOT introduce frameworks, libraries, or architectures not already implied.

3) No mock systems:
   All flows must assume real backend execution (HTTP requests, real auth, real state).

4) Think in flows, not endpoints:
   Every scenario must represent a real user journey.

5) Explicit state handling:
   Define all required context (users, IDs, tokens, resources).

6) Determinism first:
   Scenarios must be reproducible and predictable.

7) Validation is mandatory:
   Every step must include:
   - response validation (status, schema)
   - business validation (state correctness)

8) Observability is required:
   Each action must be measurable (latency, success/failure, error type).

9) Minimal viable design:
   Prefer a simple, executable runner over a complete but vague system.

10) No hidden assumptions:
   If something is not defined, make the smallest possible assumption and state it.

--------------------------------------------------

DELIVERABLES

Your output must include:

1) Scenario definition
   - Step-by-step execution per user

2) Context structure
   - Shared and per-user data (tokens, IDs, etc.)

3) Runner design (Node.js)
   - Function structure
   - Execution flow (sequential and/or concurrent)

4) Validation strategy
   - Technical validation
   - Business invariants

5) Failure cases
   - What can break and how it is detected

6) Execution notes
   - How to run
   - Expected behavior

--------------------------------------------------

OUTPUT STYLE

- No explanations outside structure
- No generic advice
- No placeholders like "TODO"
- No pseudo-thinking

Everything must be directly usable or immediately implementable.

--------------------------------------------------

Execute with precision.
No dispersion.
No creativity beyond the task.
Only controlled engineering output.