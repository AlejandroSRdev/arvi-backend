You are documenting an existing Node.js backend built using Hexagonal Architecture (Ports & Adapters).

Generate a professional Mermaid flowchart for:

POST /api/auth/register

Important rules:

The diagram must reflect the real flow as implemented.

Do NOT assume additional middleware, features, or error mappings.

Only include steps that actually occur in the current codebase.

Represent error handling exactly as implemented.

If domain errors fall through to a generic handler, show that explicitly.

Do not improve or redesign the flow. Document it faithfully.

System structure:

infrastructure/ → Express controllers, middleware, adapters

application/ → use cases

domain/ → entities and business rules

Requirements:

Show middleware execution only if it truly exists.

Represent controller → use case → domain → infrastructure transitions clearly.

Show invariant checks and uniqueness validation if they exist.

Represent password hashing and persistence exactly where they occur.

Show how errors propagate (including generic fall-through behavior).

Do NOT assign specific HTTP status codes unless they are explicitly defined in code.

Output ONLY the Mermaid diagram.