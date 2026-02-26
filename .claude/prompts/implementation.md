Maintain strict fidelity to:
- The project manifest (architecture, stack, conventions, layering).
- Your assigned agent role (clean implementation, no refactors, no scope expansion).

Do NOT modify unrelated code.
Do NOT introduce pagination by cursor.
Do NOT add features outside this endpoint.

------------------------------------------------------------
OBJECTIVE
------------------------------------------------------------

Implement a robust GET endpoint:

GET /habit-series

This endpoint must return the authenticated user's habit series.

------------------------------------------------------------
FIRESTORE DATA MODEL
------------------------------------------------------------

Habit series path:
users/{uid}/habitSeries/{seriesId}

Fields currently present:
- createdAt
- updatedAt

Hard delete is used in the system.
If a document exists, it is considered active.

The counter limits.activeSeriesCount exists in users/{uid},
but this endpoint MUST NOT modify it.

------------------------------------------------------------
BUSINESS RULES
------------------------------------------------------------

1. Only return series belonging to the authenticated user.
2. Only return existing documents (hard delete already removes inactive ones).
3. Order results by createdAt DESC.
4. Support optional limit parameter.
5. Default limit = 20.
6. Maximum limit allowed = 50.
7. If limit is invalid (non-numeric or <= 0), return 400.

------------------------------------------------------------
AUTHORIZATION RULES
------------------------------------------------------------

- uid must come strictly from authentication middleware.
- Never accept uid via request parameters.
- Multi-tenant isolation must rely on path users/{uid}/habitSeries.

------------------------------------------------------------
HTTP CONTRACT
------------------------------------------------------------

Route:
GET /habit-series

Query parameters:
- limit (optional)

Responses:

200 OK:
{
  "data": [
    {
      "id": "seriesId",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "count": number
}

401 Unauthorized:
If token is missing or invalid.

400 Bad Request:
If limit parameter is invalid.

------------------------------------------------------------
IMPLEMENTATION REQUIREMENTS
------------------------------------------------------------

1. Validate limit parameter.
   - If not provided → use default 20.
   - If > 50 → clamp to 50.
   - If invalid → 400.

2. Get uid from auth middleware.

3. Build reference:
   users/{uid}/habitSeries

4. Query:
   - orderBy('createdAt', 'desc')
   - limit(limitValue)

5. Execute query.

6. Map results to DTO:
   - id (document id)
   - createdAt
   - updatedAt

7. Return:
   {
     data: [...],
     count: snapshot.size
   }

------------------------------------------------------------
PERFORMANCE REQUIREMENTS
------------------------------------------------------------

- Do NOT use offset.
- Do NOT fetch subcollections.
- Do NOT fetch unnecessary fields.
- Keep query minimal and efficient.

------------------------------------------------------------
LOGGING (MINIMAL)
------------------------------------------------------------

Log:
- uid
- limit used
- number of results returned
- request timestamp

Do NOT log tokens.

------------------------------------------------------------
TEST REQUIREMENTS
------------------------------------------------------------

Add or update tests to validate:

1. Normal request returns correct number of series.
2. limit works correctly.
3. limit > 50 is clamped.
4. invalid limit returns 400.
5. user only sees their own series.

------------------------------------------------------------
EXPECTED OUTPUT
------------------------------------------------------------

1. Modified/created files following project structure.
2. Implementation code.
3. Short explanation of correctness.
4. Commands to run tests/lint if applicable.