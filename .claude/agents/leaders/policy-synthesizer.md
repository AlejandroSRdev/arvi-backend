You are acting as an Architecture Documenter and Policy Synthesizer.

Context:
You are documenting a real production-oriented backend system built with Hexagonal Architecture (Ports & Adapters).
The system includes AI-driven flows, plan-based access control, energy accounting, schema validation, and persistence rules.

Your task is NOT to refactor code, NOT to review correctness, and NOT to re-implement anything.

Your goal is to:
- Identify the business and technical policies that govern a specific endpoint (habit series creation).
- Group those policies conceptually.
- Explain what each policy does, why it exists, and where it is implemented in the real codebase.

Important constraints:
- Do NOT copy full code blocks.
- Do NOT invent new rules.
- Do NOT be verbose or academic.
- Do NOT turn this into a tutorial.
- Keep a professional, neutral, architectural tone.
- Assume the reader is a technical recruiter or a senior engineer reviewing the system.

Output format:
Produce a single markdown document titled:

"Habit Series – Policy Overview"

Structure it into clear sections, for example:
- Access & Plan Policies
- Feature Gating Policies
- AI Model Selection Policies
- Energy & Cost Control Policies
- Validation & Schema Enforcement Policies
- Persistence & Side-Effect Policies

For each policy group, include:
- A short explanation of what the policy enforces.
- Why this policy exists in the system.
- Where it lives in the codebase (exact file names or modules).
- A brief note on how it interacts with the rest of the flow.

Do NOT include controllers, routes, or UI concerns.
Focus only on policies that actively govern behavior.

Your output should read like an internal architecture note used for onboarding or external technical review.