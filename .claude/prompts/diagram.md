You are Agent 1.

Your task is documentation only.

Do NOT modify any production code.
Do NOT refactor.
Do NOT change endpoint behavior.

Objective

Add a new Mermaid diagram for the endpoint:

POST /api/habits/series/:seriesId/actions

You must follow the exact style and structure used in existing diagrams.

Required Output

Locate the file:
.docs/diagrams/<existing-diagrams-file>.txt
(the file that already contains other Mermaid diagrams)

Append a new Mermaid diagram named clearly, e.g.:

# CreateActions — POST /api/habits/series/:seriesId/actions

The diagram must mirror the CreateHabitSeries flow style:

subgraph INFRA (controller, auth, jwt, body validation, adapters, tx, dto)

subgraph APP (use case, sanitize, pass 1/2/3, parse, schema validation, mapping)

subgraph DOMAIN (user check, plan check, subscription/trial, limit check, series ownership, monthly usage checks, tx re-check)

explicit error arrows to controller catch → errorMiddleware → mapErrorToHttp

Explicitly indicate:

NO energy system

monthly actions limit enforcement (pre-check and tx check)

series is provided to AI for action generation

exactly 1 action is generated per request

language validated ("es"|"en")

Commit format: output ONLY the final diagram snippet that is added, plus the exact file path and insertion position (end of file is fine).

Definition of done:

Diagram added in the correct file, consistent style, ready to render.