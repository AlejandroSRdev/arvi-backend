You are documenting an existing Node.js backend built using Hexagonal Architecture (Ports & Adapters).

Generate a professional Mermaid flowchart for:

POST /api/auth/login

Strict documentation rules:

Reflect the real implemented flow.

Do NOT assume refresh tokens, sessions, rate limiting, or additional logic unless present in code.

Show exactly how user lookup, password verification, and token generation occur.

Represent error handling faithfully.

If multiple error types are mapped by a central middleware, show that structure.

If errors are indistinguishable at HTTP level, represent that accurately.

Do not redesign the flow.

Architecture layers:

infrastructure/

application/

domain/

Requirements:

Clearly separate architectural layers using subgraphs.

Show user lookup and password comparison through adapters if implemented that way.

Represent how errors propagate through middleware.

Do NOT invent status codes or semantic classifications.

Output ONLY the Mermaid diagram