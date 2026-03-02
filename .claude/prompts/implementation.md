PROMPT PARA CLAUDE — PREPARAR TEST POSTMAN CREATE ACTION

You are preparing the backend for real manual testing using Postman.

Your task is NOT to refactor anything.

Your task is to provide everything needed to manually test:

POST /api/habits/series/:seriesId/actions

Do NOT modify code.
Do NOT optimize architecture.
Do NOT introduce changes.
Only expose what is needed for testing.

1. Confirm Endpoint Contract

Return the exact final contract:

Method

POST

URL

/api/habits/series/:seriesId/actions

Include:

Example full URL with localhost port

Example seriesId

2. Required Headers

Specify:

Authorization: Bearer <JWT>

Content-Type: application/json

Clarify:

Whether idempotencyKey is required

Whether difficulty is required in body or AI-generated

Any other required fields

3. Exact Request Body Example

Provide a valid example body that will succeed.

Example format:

{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}

OR include fields if needed.

Do not guess — inspect actual controller validation.

4. Required Database Preconditions

Specify exactly what must exist before testing:

User must exist.

Subscription must be active.

Trial not expired.

MonthlyUsage document must exist or will be auto-created.

HabitSeries must exist and belong to user.

Provide example Firestore documents (JSON-like structure).

5. Expected Success Response (201)

Return full example JSON response exactly as returned by DTO.

6. Expected Error Scenarios

Provide example responses for:

401 invalid JWT

403 trial expired

403 monthly limit reached

404 series not found

Return real JSON shape used by error middleware.

7. How to Simulate Limit Exceeded

Explain precisely:

How many actions must already exist.

How to modify MonthlyUsage to trigger rejection.

8. Final Checklist Before Testing

Provide a short checklist:

Server running

Stripe webhook not required for this test

JWT generated correctly

Correct seriesId

Definition of Done:

You provide a fully reproducible Postman test guide without requiring code changes.

No architecture discussion.
No refactor.
No commentary.

Only actionable test instructions.