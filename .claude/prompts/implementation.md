You are Claude, acting as a senior backend engineer in a layered Node.js + Express + Firestore architecture.

Your task is to implement a new endpoint:

GET /api/habits/series/:seriesId

This endpoint MUST return the full HabitSeries object exactly as defined in:

01domain/entities/HabitSeries.js

The domain entity is the single source of truth.
You must base the response strictly on that entity.
Do NOT invent structure.
Do NOT reshape fields.
Do NOT omit properties.
Do NOT add properties that are not part of the entity.

The API must serialize and return the HabitSeries domain entity faithfully.

------------------------------------------------------------
ARCHITECTURE CONTEXT
------------------------------------------------------------

Stack:
- Express
- Firestore (firebase-admin)
- Layered structure:
    routes → controller → repository → Firestore
- Auth middleware already applied at router level:
    router.use(authenticate)
- Auth injects:
    req.user = { id, uid }

Controllers access:
    req.user?.uid

Firestore structure:

users/{uid}/habitSeries/{seriesId}
users/{uid}/habitSeries/{seriesId}/actions/{actionId}

The full object already exists in Firestore.

------------------------------------------------------------
ROUTING CONTEXT
------------------------------------------------------------

In server.js there is:

app.use('/api/habits', habitSeriesRoutes)

You must:
- Add the new route in HabitSeriesRoutes.js
- Ensure it is correctly mounted under '/api/habits'
- Verify that server.js does not require additional changes
- If import or mount adjustments are required, include them explicitly

Do NOT assume.
Check and ensure the route is effectively reachable as:

GET /api/habits/series/:seriesId

------------------------------------------------------------
VALIDATION RULES
------------------------------------------------------------

- seriesId must exist
- seriesId.trim() !== ''
- If invalid:
    400
    {
      error: "VALIDATION_ERROR",
      message: "seriesId is required"
    }

Auth:
Handled by middleware.
Do not modify.

------------------------------------------------------------
REPOSITORY REQUIREMENTS
------------------------------------------------------------

Implement:

getHabitSeriesById(uid, seriesId)

Repository responsibilities:
1) Read series document
2) If not exists → return null
3) Read actions subcollection
4) Map Firestore data into the HabitSeries domain entity
5) Return an instance of HabitSeries

IMPORTANT:
- Import HabitSeries from 01domain/entities/HabitSeries.js
- Construct the object using that entity
- Follow existing timestamp serialization logic used in GET list
- Convert Firestore Timestamp → ISO string
- Preserve null-safety

------------------------------------------------------------
CONTROLLER BEHAVIOR
------------------------------------------------------------

If repository returns null:
    404
    {
      error: "NOT_FOUND",
      message: "Habit series not found"
    }

If success:
    200
    Return serialized HabitSeries entity directly
    (Do NOT wrap inside { data: ... })

Error handling:
Follow existing controller pattern.
On unexpected failure:
    500
    {
      error: "INTERNAL_ERROR",
      message: "Failed to retrieve habit series"
    }

------------------------------------------------------------
FILES TO MODIFY
------------------------------------------------------------

1) 03infrastructure/http/routes/HabitSeriesRoutes.js
    - Add GET '/series/:seriesId'

2) 03infrastructure/http/controllers/HabitSeriesController.js
    - Add getHabitSeriesByIdEndpoint

3) 03infrastructure/repositories/FirestoreHabitSeriesRepository.js
    - Add getHabitSeriesById method

4) server.js
    - Verify the router mount
    - If required, include the necessary import/mount adjustment
    - Ensure endpoint is reachable

------------------------------------------------------------
OUTPUT FORMAT
------------------------------------------------------------

Return ONLY:

1) Route addition snippet
2) Full controller method
3) Full repository method
4) Any required server.js adjustment
5) Necessary imports

No explanations.
No commentary.
Production-ready code only.