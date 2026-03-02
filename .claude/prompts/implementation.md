You are acting as a senior backend engineer working on a Node.js + Express backend using clean architecture (domain, application, infrastructure).

Context:

There are two endpoints:

1) GET /api/habits/series/:seriesId
   → Returns full habit series object (already correct, DO NOT TOUCH).

2) GET /api/habits/series
   → Returns lightweight list for UI listing.

Current implementation (IMPORTANT):

/**
 * GET /api/habits/series
 *
 * Returns the authenticated user's habit series ordered by createdAt DESC.
 *
 * Query parameters:
 * - limit (optional): number of results to return (default 20, max 50)
 *
 * Response (200 OK):
 * {
 *   data: [{ id, createdAt, updatedAt }],
 *   count: number
 * }
 */

Required change:

We must modify the list response so that it returns:

{
  data: [{ title, createdAt }],
  count: number
}

Important constraints:

- DO NOT modify GET /api/habits/series/:seriesId.
- DO NOT break clean architecture boundaries.
- DO NOT expose raw database documents.
- DO NOT move business logic to controllers.
- If the title already exists in the domain entity, reuse it.
- If the repository currently projects only id, update the projection minimally.
- Preserve ordering (createdAt DESC).
- Preserve limit behavior.
- Preserve count logic.
- updatedAt must no longer be returned.
- id must no longer be returned in this endpoint.
- Ensure title is guaranteed non-null (validate or enforce if necessary).

Tasks:

1) Identify where the list projection/mapping occurs (repository or mapper layer).
2) Modify only the necessary layer to include title in the projection.
3) Return an explicit DTO for the list endpoint.
4) Show exact code modifications only (not full file rewrites).
5) Briefly explain why the change respects clean architecture and separation of concerns.

Do not refactor unrelated logic.
Do not change business rules.
Focus strictly on adjusting the response shape for UI listing.