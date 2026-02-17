Error Refactor — Phase 1
Objective

Refactor the backend to use the new TypeScript error architecture located in /errors.

The goal is:

Remove raw Error() usage.

Replace all error throwing with typed error classes.

Ensure correct error layer responsibility.

Remove HTTP logic from use cases.

Prepare the system for a global error middleware.

Architectural Rules

Domain layer:

Must only throw domain error classes.

Must not depend on application or infrastructure.

Must not log.

Must not include HTTP logic.

Application layer:

Must throw application errors (ValidationError, AuthenticationError, etc.).

Must not include HTTP logic.

Must not log.

Infrastructure layer:

Must wrap external failures using infrastructure error classes.

Must include cause when wrapping external errors.

Controllers:

Must only:

Return success response.

Call next(err) on failure.

Must not call mapErrorToHttp.

Must not log.

No middleware implementation yet (until Phase 4).

Scope of Refactor
Phase 1:

createHabitSeries use case

Its domain services

Its infrastructure dependencies

Phase 2:

register use case

login use case

related validation logic

Phase 3:

Clean controllers for above routes

Remove mapErrorToHttp usage from controllers

Phase 4:

Implement global error middleware

Centralize logging

Connect mapErrorToHttp

Non-Goals

No changes to business logic.

No changes to HTTP routes.

No new features.

No database schema changes.

No performance optimizations.

Expected Outcome

After refactor:

All errors are instances of BaseError subclasses.

No raw Error() remains in business code.

Controllers are thin.

System ready for global error middleware.

