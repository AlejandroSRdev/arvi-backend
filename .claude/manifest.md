# Project Manifest

## Goal
Backend service implemented in Node.js whose responsibility is to expose
application use-cases in a clean, testable, and scalable way, enforcing
strict separation between business logic and external concerns.

The system prioritizes architectural clarity, correctness, and long-term
maintainability over premature optimization or technology-driven refactors.

---

## Stack
- Runtime: Node.js (>=18)
- Language: JavaScript (Node ecosystem)
- HTTP Framework: Express (used as a thin adapter only)
- Database: Firebase (Firestore)
- Hosting / Infrastructure: Render
- AI / LLM APIs:
  - OpenAI API
  - Google Gemini API
- RAG: Not implemented at this stage

---

## Architecture
- Style: Hexagonal Architecture (Ports & Adapters)
- Core layers:
  - domain/
  - application/
  - infrastructure/

### Architectural rules (non-negotiable)

#### domain/
- Contains pure business logic only
- No dependencies on frameworks, databases, HTTP, Firebase, or AI SDKs
- No imports from application or infrastructure
- Contains entities, value objects, and domain services
- Fully testable in isolation

#### application/
- Orchestrates use-cases
- Depends on domain
- Defines ports (interfaces) for:
  - persistence
  - external services (AI, third-party APIs)
- Contains no framework- or vendor-specific code
- No imports from Express, Firebase, OpenAI, or Gemini

#### infrastructure/
- Implements adapters:
  - HTTP controllers (Express)
  - Firebase persistence adapters
  - OpenAI and Gemini API adapters
- Depends on application and domain
- Contains all framework-, SDK-, and vendor-specific code

#### Dependency direction
infrastructure → application → domain  
(strictly enforced)

---

## Conventions
- One use-case per file in the application layer
- Use-cases are explicit and intention-revealing
- Controllers are thin: no business logic
- Validation occurs at the boundaries (HTTP adapters)
- Errors are explicit and propagated, never swallowed
- External services (Firebase, OpenAI, Gemini) are accessed only through ports

---

## Non-goals
- No microservices for core backend logic
- No business logic in controllers or adapters
- No Firebase SDK usage outside infrastructure
- No AI logic inside the domain layer
- No RAG or vector databases at this stage
- No premature performance or cost optimization
- No full backend refactor driven solely by technology choice

---

## Current constraints
- Preserve hexagonal integrity while iterating
- Prefer clarity and explicitness over speed
- Keep external dependencies replaceable
- Minimize coupling to vendors (Firebase, OpenAI, Gemini)

---

## Planned evolution (explicit, not implemented yet)
- Advanced AI pipelines (RAG, embeddings, retrieval, evaluation) will be
  implemented as a **separate microservice**.
- This microservice will be built in **Python**, using **FastAPI**.
- The main Node.js backend will interact with it via **HTTP**.
- The core backend will remain free of AI pipeline logic.
- This evolution will occur only when RAG is required by product needs,
  not before.

