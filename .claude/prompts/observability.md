TASK
Add structured observability to the endpoint:

GET /user/dashboard

The goal is to make the request lifecycle clearly traceable in production logs.

This task must follow the backend architecture and logging conventions defined in the project manifest.

------------------------------------------------

CONTEXT

This endpoint aggregates user data for the frontend dashboard.

It retrieves:

- user profile (email, plan)
- usage limits
- active series count
- remaining actions for the month

Currently the endpoint lacks sufficient observability to debug issues such as:

- missing profile data
- incorrect limits
- unexpected null values
- failures in repository calls

------------------------------------------------

OBJECTIVE

Instrument the dashboard endpoint so that the following stages are clearly visible in logs:

1. Request arrival
2. User identity extraction
3. Use case execution
4. Result computation
5. Response delivery
6. Error situations

The logs must allow a developer to understand exactly what happened during a request.

------------------------------------------------

IMPLEMENTATION REQUIREMENTS

Observability must be added in the controller that handles:

GET /user/dashboard

Add logs in the following places:

1. Controller entry

Log that the request reached the endpoint.

Include:
- endpoint name
- userId (if available)

Example:

Logger.info("[dashboard] request received", {
  userId
})

------------------------------------------------

2. Before executing the use case

Log that the use case execution is starting.

Example:

Logger.info("[dashboard] executing GetUserDashboardUseCase", {
  userId
})

------------------------------------------------

3. After the use case returns

Log a summary of the result.

Do NOT log sensitive or large payloads.

Only log useful structural indicators.

Example fields:

- plan
- activeSeriesCount
- monthlyActionsRemaining

Example:

Logger.info("[dashboard] dashboard computed", {
  userId,
  plan: dashboard.profile?.plan,
  activeSeriesCount: dashboard.limits?.activeSeriesCount,
  monthlyActionsRemaining: dashboard.limits?.monthlyActionsRemaining
})

------------------------------------------------

4. Before sending the response

Confirm the response is about to be returned.

Example:

Logger.info("[dashboard] response sent", {
  userId
})

------------------------------------------------

5. Error handling

Wrap the controller logic in a try/catch block.

If an error occurs:

- log it using Logger.error
- include userId if available
- include error.message
- include error.stack
- rethrow the error so the centralized error middleware handles it.

Example pattern:

try {

   ...

} catch (error) {

   Logger.error("[dashboard] error", {
      userId,
      message: error.message,
      stack: error.stack
   })

   throw error
}

------------------------------------------------

CONSTRAINTS

You must NOT:

- modify business logic
- change repository behavior
- alter API responses
- introduce new dependencies
- replace the centralized Logger.js
- create ad-hoc errors instead of using the centralized /errors system

Observability must be additive only.

------------------------------------------------

EXPECTED RESULT

After this instrumentation, the logs for a successful request should resemble:

[dashboard] request received
[dashboard] executing GetUserDashboardUseCase
[dashboard] dashboard computed
[dashboard] response sent

If an error occurs:

[dashboard] request received
[dashboard] executing GetUserDashboardUseCase
[dashboard] error

This should allow debugging production issues without stepping through code.