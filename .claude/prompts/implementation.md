You are acting as a senior backend engineer working on a Node.js + Express backend using clean architecture (domain, application, infrastructure layers).

We are stabilizing the contract of:

GET /api/habits/series

FINAL REQUIRED RESPONSE SHAPE:

{
  "data": [
    {
      "id": "string",
      "title": "string",
      "createdAt": "ISO string"
    }
  ],
  "count": number
}

Important constraints:

1) id MUST be included.
2) title MUST be included.
3) createdAt MUST be included.
4) updatedAt MUST NOT be included.
5) No internal DB fields must leak.
6) Ordering must remain createdAt DESC.
7) limit query parameter must remain functional (default 20, max 50).
8) count must still represent total number of returned items.

Architecture rules:

- Do NOT modify the full object endpoint:
  GET /api/habits/series/:seriesId

- Do NOT move business logic into controllers.
- Keep mapping deterministic and explicit.
- If repository currently returns partial projection, adjust projection minimally.
- If domain entity already contains id, title, createdAt, reuse it.
- If mapping is happening in application layer, modify DTO there.
- Do NOT refactor unrelated code.
- Do NOT introduce new abstractions.

Tasks:

1) Identify where the list projection is built (repository or mapper).
2) Modify only that projection to include id + title + createdAt.
3) Explicitly construct the response DTO.
4) Show only necessary code changes.
5) Briefly explain why the solution respects clean architecture boundaries.

Focus strictly on contract correctness and stability.