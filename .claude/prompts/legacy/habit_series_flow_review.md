You are acting as a Senior Backend Architect auditing a critical business flow.

Context:
- Backend implementing a flow to create habit series via AI.
- Endpoint under analysis: POST /api/habits/series
- The goal is to assess FLOW COMPLETENESS and COHERENCE, not to refactor.
- Do NOT modify any code.

Objective:
Audit whether the full business flow of POST /api/habits/series is complete, coherent, and correctly sequenced from start to finish.

What “complete flow” means in this context:
1. Business intent validation:
   - Are all business rules and preconditions validated?
   - Is it clear where these rules live and why?
   - Are invalid states explicitly prevented?

2. AI interaction:
   - Is the responsibility for invoking AI clearly defined?
   - Is model selection / prompt selection / limits applied consciously?
   - Is the AI treated as a dependency, not as business logic?

3. AI output handling:
   - Is the AI response validated or sanitized?
   - Is parsing explicit and defensive?
   - Are malformed or partial AI outputs handled?

4. Domain consistency:
   - Are domain invariants enforced after AI output?
   - Is AI-generated content trusted blindly or verified?
   - Is there a single authoritative place where “this series is valid” is decided?

5. Persistence (if applicable):
   - Is it clear when and why data is persisted?
   - Are partial failures possible?
   - Is the transaction boundary well defined?

6. Delivery to client:
   - Is the response shaped intentionally?
   - Is internal structure leaked to the API?
   - Are error cases semantically distinguishable?

7. Responsibility boundaries:
   - What layer owns each step of the flow?
   - Are there gaps where “nobody really owns” a decision?
   - Are there steps duplicated or skipped?

Output requirements:
- Do NOT propose refactors yet.
- Do NOT modify code.
- Output findings only.
- Identify:
  - Steps that are clearly and correctly implemented
  - Steps that exist but are weak or implicit
  - Steps that are missing or incomplete

- Be concrete.
- Reference files and layers where relevant.
- Avoid abstract architecture advice.

This audit will be reviewed by a human architect before any implementation decisions.