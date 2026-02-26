Maintain strict fidelity to:
- The project manifest (architecture, stack, layering, conventions).
- Your assigned agent role (clean documentation, no refactors, no scope expansion).

Do NOT modify code.
Do NOT alter existing diagrams.
Only extend documentation consistently.

------------------------------------------------------------
OBJECTIVE
------------------------------------------------------------

Register the GET /habit-series endpoint in the documentation by adding a new Mermaid diagram using:

flowchart TD

The diagram must follow the same structure, naming style, indentation, and visual conventions used in:

.docs/diagrams/diagrams-code.txt

Do NOT change the format used in that file.
Replicate its structural style precisely.

------------------------------------------------------------
ENDPOINT BEHAVIOR (AS IMPLEMENTED)
------------------------------------------------------------

Route:
GET /habit-series

Behavior:

1. Validate limit query parameter.
   - If missing → default = 20
   - If > 50 → clamp to 50
   - If invalid → return 400

2. Extract uid from authentication middleware.
   - If missing/invalid → 401

3. Build Firestore reference:
   users/{uid}/habitSeries

4. Query:
   - orderBy createdAt DESC
   - limit(limitValue)

5. Execute query.

6. Map snapshot to DTO:
   - id
   - createdAt
   - updatedAt

7. Return:
   200 with:
   {
     data: [...],
     count: snapshot.size
   }

------------------------------------------------------------
DIAGRAM REQUIREMENTS
------------------------------------------------------------

- Use Mermaid syntax:
  ```mermaid
  flowchart TD

Must include:

Start node

Auth validation branch

Limit validation branch

Firestore query step

Mapping step

Response 200

Error paths (400, 401)

Keep diagram clean and readable.

Follow naming conventions and structure already present in diagrams-code.txt.

Do not overcomplicate.

No speculative future features.

No cursor pagination (not implemented).

OUTPUT FORMAT

Return:

The exact Mermaid diagram block only.

No explanation text.

No additional commentary.

Fully consistent with existing documentation style.