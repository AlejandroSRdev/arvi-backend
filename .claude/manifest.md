# ARVI BACKEND — ARCHITECTURAL MANIFEST

## 1. Core System Intent

Arvi Backend is a regulated AI orchestration system.

It does NOT generate AI content freely.
It enforces domain rules, usage limits, and invariants before and after AI execution.

The system exists to:

> Provide structured, personalized habit-based recommendations under explicit business constraints.

AI is a tool.
The domain governs it.

---

## 2. Strategic Phase (Current Reality)

The system is in **Minimum Operational Phase**.

Priority:
- Real usage over architectural elegance.
- Exposure to real users.
- Controlled observability.
- Stability under light production load.

Do NOT introduce over-engineering.
Do NOT refactor for theoretical purity.
Refactor only under real operational pressure.

---

## 3. Architecture Overview

The system follows Hexagonal Architecture (Ports & Adapters).

Directory structure:

01domain/
02application/
03infrastructure/
errors/

Dependencies ALWAYS point inward.

No layer may depend on an outer layer.

---

## 4. Layer Responsibilities

### 01domain/

Contains:
- Entities
- Value Objects
- Policies
- Domain rules and invariants

Characteristics:
- Framework-agnostic
- No Express
- No Firebase
- No AI provider knowledge
- Pure business logic

The domain never calls external systems.

---

### 02application/

Contains:
- Use cases
- Orchestration services
- Business flow coordination

Responsibilities:
- Enforce domain invariants
- Coordinate AI execution
- Coordinate persistence
- Apply access rules (limits, identity, energy model)

Application layer depends on:
- Domain
- Abstract ports

It does NOT depend on concrete infrastructure implementations.

---

### 03infrastructure/

Contains:
- HTTP (Express controllers, routes)
- Middlewares
- Firebase adapters
- AI provider adapters (OpenAI, Gemini)
- Mappers
- External service implementations

Characteristics:
- Thin controllers
- No business logic
- Adapters implement ports defined by inner layers
- Replaceable components

AI providers are accessed ONLY through adapters.

---

### errors/

Centralized error handling by layer.

Each layer defines and throws its own error types.

Infrastructure maps errors to HTTP responses.

No raw provider errors should leak to the client.

---

## 5. Error Handling Contract

All errors flow through a single centralized pipeline:

```
throw typed error → controller catch → next(err) → errorMiddleware → mapErrorToHttp
```

### Rules (Non-Negotiable)

- Controllers MUST accept `next` as a parameter.
- Controllers MUST call `next(err)` in their catch block — never `res.status(...).json(...)` for errors.
- All failure conditions MUST throw a typed error class from `errors/`.
- `mapErrorToHttp` (`03infrastructure/mappers/ErrorMapper.js`) is the ONLY place where errors are translated to HTTP status codes and response bodies.
- Untyped or provider-specific errors must never reach the client.

### Controller Pattern (Mandatory)

```js
export async function someEndpoint(req, res, next) {
  try {
    if (!condition) throw new ValidationError('...');
    // ...
  } catch (err) {
    return next(err);
  }
}
```

### Error Classes by Layer

**Domain** (`errors/domain/`):

**Application** (`errors/application/`):

**Infrastructure** (`errors/infrastructure/`):

All classes are exported from `errors/Index.js`.

---

## 6. AI Integration Rules

AI is an infrastructure concern.

Rules:

- Domain must not know AI exists.
- Application orchestrates AI execution as part of a use case.
- AI providers are accessed via adapters only.
- Provider-specific logic must never leak inward.
- Output must be validated and normalized before leaving the system.

AI output is never trusted blindly.

---

## 7. System Invariants

Always preserve:

- Structured JSON output validation
- Explicit usage limits
- Identity-bound access
- Deterministic orchestration
- Thin controllers
- No business logic in infrastructure

---

## 8. What This System Is NOT

- Not an AI wrapper.
- Not a prompt playground.
- Not a monolithic Express app.
- Not framework-driven.
- Not provider-dependent.

It is a regulated orchestration core.

---

## 9. Frontend Context (Flutter)

The system includes a mobile frontend built with Flutter.

The frontend:

- Communicates exclusively through authenticated HTTP requests.
- Does not contain business logic.
- Does not decide subscription state.
- Does not activate or deactivate plans.
- Acts only as a UI layer and Stripe Checkout redirect initiator.

All subscription state transitions are determined server-side via Stripe webhooks.

The frontend must strictly follow backend-defined contracts.
Any mismatch between frontend expectations and backend responses is considered a contract error.

---

## 10. Billing & Payment System (Stripe)

Stripe is the external billing authority.

Design principles:

- Checkout sessions only create payment intent.
- Subscription state changes are applied exclusively via verified webhooks.
- Webhook events are processed atomically and idempotently.
- Stripe event ID is the idempotency boundary.
- Database state is the final authority.

The backend must tolerate:
- Event retries
- Duplicate events
- Potential out-of-order delivery

No subscription state is trusted unless persisted through the webhook transaction layer.

---

## 11. Deployment Context (Render)

The system is deployed using **Render** as the hosting platform.

Deployment principles:

- The backend is hosted as a web service with autoscaling enabled.
- Environment variables are used to configure secrets and sensitive data.
- Build and deployment pipelines must remain simple and predictable.
- Logs are streamed to the Render dashboard for observability.

Deployment rules:

- Always test changes locally before deploying.
- Ensure environment variables are updated in Render before deploying changes that depend on them.
- Avoid hardcoding platform-specific configurations in the codebase.
- Monitor resource usage (CPU, memory) to ensure the service remains within allocated limits.

---

## 12. Database Context (Firestore)

The system uses **Firestore** as the primary database.

Database principles:

- Firestore is used in **native mode** for scalability and low-latency reads.
- All data access is mediated through the application layer.
- Queries must be optimized to minimize read and write costs.
- Data is structured to support hierarchical relationships and efficient querying.

Database rules:

- Avoid deep nesting of documents beyond Firestore's recommended limits.
- Use batched writes for atomic operations involving multiple documents.
- Indexes must be explicitly defined for complex queries.
- Regularly review and clean up unused or stale data to control costs.
- Ensure Firestore security rules are updated to enforce access control policies.

---

## 13. Development Rules for Claude Code

When modifying the system:

1. Respect architectural boundaries.
2. Do not move business logic into controllers.
3. Do not let infrastructure leak into domain.
4. Prefer minimal changes over structural rewrites.
5. Optimize for clarity and stability.
6. Avoid unnecessary abstractions.
7. Preserve inward dependency direction.

Before implementing any change, ask:

> Does this improve operational reliability or move the system closer to real usage?

If not, it is likely not a priority.

---

## 14. Author & Ownership

Designed and maintained by:
Alejandro Saavedra Ruiz

Single-engineer operated system.
Architectural clarity is mandatory for sustainability.