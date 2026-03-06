# ARVI BACKEND — ARCHITECTURAL MANIFEST

---

## 0. Role of This Document (Authoritative Source)

This document defines the architectural truth of the system.

It exists to ensure that both humans and AI assistants (such as Claude Code) understand the intended design of the backend.

**Source of Truth Rules**

This manifest is the authoritative description of the architecture.

Claude Code must follow these rules when interacting with the codebase:

- Architecture is defined here, not inferred from code.
- If code appears to contradict this document, assume the code may be temporary or imperfect.
- Code inspection is allowed only to understand implementation details, not to redefine architecture.
- Architectural decisions must always align with this document.

**Code Inspection Guidelines for Claude**

Claude may read specific files only for:

- Understanding implementation details
- Locating where logic currently lives
- Verifying contracts between layers

Claude must not:

- Infer architecture from file structure alone
- Move logic across layers unless explicitly instructed
- Refactor architecture based on stylistic preferences

This manifest defines how the system is supposed to work, even if parts of the code are still evolving.

---

## 1. Core System Intent

Arvi Backend is a regulated AI orchestration system.

It does NOT generate AI content freely.
It enforces domain rules, usage limits, and invariants before and after AI execution.

The system exists to:

- Provide structured, personalized habit-based recommendations under explicit business constraints.

AI is a tool.
The domain governs it.

---

## 2. Strategic Phase (Current Reality)

The system is in Minimum Operational Phase.

**Priority:**

- Real usage over architectural elegance
- Exposure to real users
- Controlled observability
- Stability under light production load

**Rules for development:**

- Do NOT introduce over-engineering
- Do NOT refactor for theoretical purity
- Refactor only under real operational pressure
- Favor stability over structural experimentation

---

## 3. Architecture Overview

The system follows Hexagonal Architecture (Ports & Adapters).

**Directory structure:**

- 01domain/
- 02application/
- 03infrastructure/
- errors/

**Dependency rule:**

Infrastructure → Application → Domain

Dependencies ALWAYS point inward.

Inner layers must never depend on outer layers.

---

## 4. Layer Responsibilities

The system uses strict separation between domain logic, application orchestration, and infrastructure integration.

### 01domain/
**Contains**

- Entities
- Value Objects
- Domain policies
- Domain rules and invariants

**Responsibilities**

- Define the core business model
- Enforce domain invariants
- Represent domain concepts independently from technology

**Characteristics**

- Framework-agnostic
- No Express
- No Firebase
- No AI provider knowledge
- No Stripe or external service knowledge
- No I/O operations
- Pure business logic

**Rules**

The domain layer must:

- Never call external systems
- Never depend on infrastructure code
- Never perform persistence operations
- Never contain HTTP or framework concerns

The domain layer represents business truth only.

### 02application/
**Contains**

- Use cases
- Application services
- Business flow orchestration

**Responsibilities**

- Execute use cases
- Coordinate domain objects
- Coordinate external operations through ports
- Enforce system-level rules

System-level rules include:

- Identity enforcement
- Usage limits
- Energy model constraints
- Access control policies

**Dependency Rules**

Application layer depends on:

- Domain
- Abstract ports

Application layer must NOT depend on:

- Express
- Firebase
- OpenAI
- Gemini
- Stripe
- Any concrete infrastructure implementation

All external interactions occur only through ports.

Application orchestrates behavior but does not implement infrastructure details.

### 03infrastructure/
**Contains**

- HTTP interface (Express controllers, routes)
- Middlewares
- Firebase adapters
- AI provider adapters (OpenAI, Gemini)
- Payment service adapters (Stripe)
- Mappers
- External service implementations

**Responsibilities**

- Handle I/O boundaries
- Translate HTTP requests into application use case calls
- Implement ports defined by application layer
- Integrate external systems

**Characteristics**

- Thin controllers
- No business logic
- Infrastructure implements contracts defined by application layer
- Components are replaceable without affecting inner layers
- External services are accessed only through adapters.

**Examples:**

- AI providers → OpenAI, Gemini
- Payment provider → Stripe
- Persistence → Firebase

### errors/

Centralized error handling organized by layer.

Each layer defines and throws its own typed errors.

Infrastructure translates errors into HTTP responses.

Provider-specific errors must never reach the client.

---

## 5. Error Handling Contract

All errors flow through a centralized pipeline:

throw typed error
→ controller catch
→ next(err)
→ errorMiddleware
→ mapErrorToHttp

**Non-Negotiable Rules**

Controllers MUST:

- Accept next as a parameter
- Call next(err) for all errors
- Never send error responses directly

All failure conditions MUST throw typed error classes.

Error translation to HTTP occurs only in one place:

03infrastructure/mappers/ErrorMapper.js

**Controller Pattern (Mandatory)**

export async function someEndpoint(req, res, next) {
  try {

    if (!condition) throw new ValidationError('...');

  } catch (err) {
    return next(err);
  }
}

**Error Classes by Layer**

- Domain errors → errors/domain/
- Application errors → errors/application/
- Infrastructure errors → errors/infrastructure/

All error classes are exported via:

errors/Index.js

---

## 6. AI Integration Rules

AI is strictly an infrastructure concern.

**Rules:**

- Domain must not know AI exists
- Application orchestrates AI execution
- AI providers are accessed only via adapters
- Provider-specific logic must never leak inward
- AI output must be validated before leaving the system
- AI output is never trusted blindly.

---

## 7. System Invariants

The system must always preserve:

- Structured JSON output validation
- Explicit usage limits
- Identity-bound access
- Deterministic orchestration
- Thin controllers
- No business logic in infrastructure

---

## 8. What This System Is NOT

This system is NOT:

- An AI wrapper
- A prompt playground
- A monolithic Express application
- Framework-driven
- Provider-dependent

It is a regulated orchestration core.

---

## 9. Frontend Context (Flutter)

The system includes a mobile frontend built with Flutter.

**The frontend:**

- Communicates exclusively via authenticated HTTP requests
- Contains no business logic
- Does not determine subscription state
- Only initiates Stripe Checkout redirects

Subscription state is determined server-side via Stripe webhooks.

The backend is the source of truth.

---

## 10. Billing & Payment System (Stripe)

Stripe acts as the external billing processor.

**Design principles:**

- Checkout sessions only create payment intent
- Subscription state changes occur exclusively through webhooks
- Webhook events are processed atomically
- Stripe Event ID acts as idempotency boundary
- Database state is the final authority

The backend must tolerate:

- Event retries
- Duplicate events
- Out-of-order delivery

No subscription state is trusted unless persisted through webhook processing.

---

## 11. Deployment Context (Render)

Deployment platform: Render

**Deployment principles:**

- Backend hosted as web service
- Autoscaling enabled
- Environment variables manage secrets
- Logs streamed to Render dashboard

**Rules:**

- Always test locally before deployment
- Update environment variables before deploying dependent code
- Avoid platform-specific logic in code
- Monitor CPU and memory usage

---

## 12. Database Context (Firestore)

Primary database: Firestore (Native Mode)

**Principles:**

- Low-latency reads
- Scalable document storage
- Query cost awareness

**Rules:**

- Avoid excessive document nesting
- Use batched writes when necessary
- Define indexes explicitly
- Periodically clean unused data
- Maintain security rules aligned with backend access model

---

## 13. Development Rules for Claude Code

When modifying the system:

- Respect architectural boundaries
- Do not move business logic into controllers
- Do not allow infrastructure concerns to leak into domain
- Prefer minimal changes over structural rewrites
- Optimize for clarity and stability
- Avoid unnecessary abstractions
- Preserve inward dependency direction

**Before implementing changes ask:**

Does this improve operational reliability or move the system closer to real usage?

If not, it is likely not a priority.

---

## 14. Author & Ownership

Designed and maintained by:

Alejandro Saavedra Ruiz

Single-engineer operated system.

Architectural clarity is mandatory for long-term sustainability.