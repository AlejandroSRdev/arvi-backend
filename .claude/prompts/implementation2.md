TASK: Implement a dashboard endpoint that aggregates user profile and limits data for the frontend.

CONTEXT

The frontend needs a single request to retrieve the basic state of the user.

Currently the data exists in different parts of the backend:

- user profile
- plan
- usage limits
- active series count

Instead of calling multiple endpoints, we want a single aggregation endpoint.

OBJECTIVE

Create a new endpoint:

GET /user/dashboard

This endpoint returns the current state of the user needed by the frontend.

AUTHENTICATION

This endpoint must require JWT authentication.

The user id must be obtained from the authenticated request context.

RESPONSE CONTRACT

Return the following JSON structure:

{
  "profile": {
    "email": "user@email.com",
    "plan": "base"
  },
  "limits": {
    "activeSeriesCount": 0,
    "maxActiveSeries": 20,
    "monthlyActionsMax": 100,
    "monthlyActionsRemaining": 100
  }
}

DATA SOURCES

The endpoint must retrieve:

profile.email → from user repository

profile.plan → from user subscription / plan record

limits.activeSeriesCount → number of currently active series for the user

limits.maxActiveSeries → derived from the user plan

limits.monthlyActionsMax → derived from the user plan

limits.monthlyActionsRemaining → computed from usage tracking

ARCHITECTURE REQUIREMENTS

1. Implement a new application use case:

GetUserDashboardUseCase

2. The controller should only:
   - read userId from auth middleware
   - call the use case
   - return the response.

3. The use case must orchestrate the required repositories/services.

4. No business logic must be added here.
This endpoint only aggregates already existing information.

CONSTRAINTS

- Do not refactor existing domain logic.
- Do not modify existing endpoints.
- Do not introduce new persistence structures.

DELIVERABLES

Provide:

1. Controller for GET /user/dashboard
2. Use case implementation
3. Any repository calls required
4. Route registration