You are documenting an existing Node.js backend built using Hexagonal Architecture (Ports & Adapters).

Generate a professional Mermaid flowchart for:

POST /api/habits/series

Documentation constraints:

The diagram must reflect the real implemented flow.

Do NOT simplify multi-step AI pipelines.

If the implementation contains multiple AI passes, represent each pass explicitly.

If structured JSON validation occurs, show it.

If energy validation and deduction are separate steps, represent them separately.

If domain errors fall through to generic error handling, show that explicitly.

Do not assume RAG, caching, or optimizations unless implemented.

System structure:

infrastructure/ → controllers, middleware, Firestore adapter, AI adapters

application/ → generateHabitSeries use case

domain/ → business rule validation (limits, energy, invariants)

Requirements:

Show authentication middleware only if it exists.

Represent the three AI passes cleanly and sequentially (Pass 1 → Pass 2 → Pass 3).

Include structured output validation step(s) if implemented.

Show user data retrieval.

Show energy validation before generation and energy deduction after success.

Represent error propagation faithfully (including generic fallback).

Do NOT assign specific HTTP codes unless explicitly present in code.

Output ONLY the Mermaid diagram.