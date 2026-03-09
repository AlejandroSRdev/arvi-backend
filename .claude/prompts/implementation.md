TASK: Modify the register endpoint so that it issues a JWT token after successful user creation.

CONTEXT
The backend currently has two authentication endpoints:

POST /auth/register
POST /auth/login

The login endpoint returns a signed JWT token.
The register endpoint only creates the user and returns confirmation, which forces the user to log in again immediately.

This produces unnecessary friction.

OBJECTIVE
Make the register endpoint return the same authentication payload structure as the login endpoint.

REQUIREMENTS

1. After successful user creation:
   - Generate a JWT using the same signing logic used in the login endpoint.
   - Do not duplicate JWT logic. Reuse the existing token generation utility/service.

2. The register response must return:

{
  "token": "<jwt>",
  "user": {
    "email": "...",
    "id": "..."
  }
}

3. The token must contain the same claims as the login token.

4. No changes to:
   - password hashing
   - validation logic
   - user persistence
   - authentication middleware

5. Maintain existing error handling.

CONSTRAINTS

- Do not introduce new dependencies.
- Do not refactor unrelated authentication code.
- Only modify what is necessary for the response behavior.

DELIVERABLE

Return the modified code for:

- register controller
- any minimal adjustment required to reuse the existing JWT service