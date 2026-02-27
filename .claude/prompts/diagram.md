You are Claude, acting as a senior backend engineer responsible for maintaining architectural documentation.

A new endpoint has been implemented:

GET /api/habits/series/:seriesId

Your task is to document this endpoint in Mermaid format,
following EXACTLY the style and conventions used in:

.docs/diagrams/diagrams-code.txt

------------------------------------------------------------
CRITICAL INSTRUCTIONS
------------------------------------------------------------

1) First:
   Open and analyze .docs/diagrams/diagrams-code.txt
   Understand:
   - Diagram type used (flowchart, sequenceDiagram, etc.)
   - Node naming conventions
   - File path annotations
   - Layer grouping (routes, controllers, repositories, Firestore, domain)
   - Direction (LR or TB)
   - Styling rules (if any)
   - Formatting consistency

2) You MUST replicate the exact style.
   Do not invent a new diagram format.
   Do not change direction.
   Do not introduce new naming conventions.

3) Only add the diagram for the new endpoint.
   Do not modify other diagrams.
   Do not remove anything.
   Append it in the appropriate section.

------------------------------------------------------------
ARCHITECTURAL FLOW TO REPRESENT
------------------------------------------------------------

Client
  ↓
HabitSeriesRoutes.js
  ↓
HabitSeriesController.getHabitSeriesByIdEndpoint
  ↓
FirestoreHabitSeriesRepository.getHabitSeriesById
  ↓
Firestore:
    users/{uid}/habitSeries/{seriesId}
    users/{uid}/habitSeries/{seriesId}/actions
  ↓
01domain/entities/HabitSeries
  ↓
HTTP 200 (or 404 / 400 / 500)

Include:

- Validation step
- Auth middleware (authenticate)
- NOT_FOUND path
- INTERNAL_ERROR path
- Successful serialization path

------------------------------------------------------------
REQUIREMENTS
------------------------------------------------------------

- Use Mermaid syntax only.
- Match existing indentation style.
- Match naming precision (file paths if previously shown).
- If previous diagrams include file path comments, include them.
- Keep it clean and consistent.

------------------------------------------------------------
OUTPUT FORMAT
------------------------------------------------------------

Return ONLY the Mermaid diagram block.
Do not explain.
Do not describe.
Do not add commentary.
Do not summarize.

Just the diagram code ready to paste into .docs/diagrams/diagrams-code.txt.