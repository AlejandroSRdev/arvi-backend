# Error Pipeline — Arvi Backend

## Overview

Every error in the system follows a single, deterministic path from throw to HTTP response.
No controller builds error responses. No layer decides HTTP status codes except one.

---

## Pipeline Flow

```
throw new SomeTypedError()
  → caught in controller's catch block
  → controller calls next(err)
  → Express routes to errorMiddleware (4-param middleware)
  → errorMiddleware calls mapErrorToHttp(err)
  → ErrorMapper reads err.code
  → returns { status, message }
  → errorMiddleware sends res.status(status).json({ error: message })
```

---

## Responsibilities by Component

### Controller
- Wraps use case call in try/catch
- On error: calls `next(err)` — nothing else
- Never reads the error, never builds an error response
- Never calls `res.status()` in the catch block

```js
export async function someEndpoint(req, res, next) {
  try {
    const result = await someUseCase(input, deps);
    res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
```

### errorMiddleware
- 4-parameter Express middleware: `(err, req, res, next)`
- Receives all errors delegated via `next(err)`
- Calls `mapErrorToHttp(err)` to resolve HTTP status and message
- Sends the final HTTP response

### ErrorMapper (`03infrastructure/mappers/ErrorMapper.js`)
- Single translation point: error code → HTTP status
- Reads `err.code` from the typed error instance
- Returns `{ status, message }`
- **This is the only place in the system where error codes map to HTTP statuses**

---

## Error Code → HTTP Status Examples

| Error Code                  | HTTP Status | Meaning                        |
|-----------------------------|-------------|--------------------------------|
| `VALIDATION_ERROR`          | 400         | Client sent invalid input      |
| `AUTHENTICATION_ERROR`      | 401         | Identity not verified          |
| `AUTHORIZATION_ERROR`       | 403         | Action not permitted           |
| `NOT_FOUND`                 | 404         | Resource does not exist        |
| `AI_PROVIDER_FAILURE`       | 502         | Upstream AI provider failed    |
| `STRIPE_PROVIDER_FAILURE`   | 502         | Upstream Stripe failed         |
| `DATA_ACCESS_FAILURE`       | 500         | Firestore read/write failed    |

---

## Why This Structure Exists

### Single translation point
Adding a new error type requires one change: register its code in `ErrorMapper`.
No controller needs to be updated. No inconsistency across endpoints.

### Controller blindness
Controllers are deliberately unaware of error semantics.
A `ValidationError` and a `FirestoreProviderFailureError` are both handled the same way by the controller: `next(err)`. The distinction is resolved downstream.

### Client clarity
4xx errors signal client responsibility.
5xx errors signal server or upstream responsibility.
The client can act on this distinction without knowing internal error types.

---

## Error Class Structure

All typed errors extend `BaseError`:

```js
class BaseError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;   // used by ErrorMapper
    this.name = this.constructor.name;
  }
}
```

Errors are organized by layer:
- `errors/domain/` — domain invariant violations
- `errors/application/` — validation, auth, not found
- `errors/infrastructure/` — provider failures, persistence failures

All exported via `errors/Index.js`.

---

## Non-Negotiable Rules

- Controllers MUST accept `next` as a parameter
- Controllers MUST call `next(err)` in catch — never `res.status()` for errors
- All failure conditions MUST throw typed error classes
- HTTP status translation occurs ONLY in `ErrorMapper`
- Provider-specific errors MUST NOT reach the client as raw messages
