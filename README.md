# Arvi Backend Service

## Core Intent

Arvi Backend Service is a backend system designed to provide **regulated access to structured, personalized AI-generated recommendations**.

Its central purpose is to:

> Generate structured habit-based recommendations tailored to individual users, under explicit business rules governing identity, usage, and resource consumption.

The system does not merely generate AI output.  
It enforces domain rules around access, limits, and controlled execution.

---

## System Capabilities

The backend currently provides:

- Structured generation of habit-based recommendations  
  - Output validated as structured JSON  
  - Explicit format (actions, difficulty levels, metadata)

- Personalization  
  - Based on user test responses  
  - Context-aware prompts for the assistant  
  - Deterministic formatting constraints

- Regulated access  
  - Authentication and identity management  
  - Daily usage limits  
  - Energy-based consumption model  

The system acts as a **controlled orchestrator of AI capabilities**, ensuring domain invariants are respected before and after AI execution.

---

## Responsibilities

The backend is responsible for:

1. Enforcing domain rules and invariants through explicit use cases.
2. Regulating access to AI-powered recommendation generation.
3. Managing authentication, user data, and core application flows.
4. Orchestrating AI providers through isolated infrastructure adapters.
5. Exposing HTTP endpoints via a thin Express interface.

The service does not embed AI logic in the domain.  
It coordinates AI execution under business constraints.

---

## Architecture

The project follows a **Hexagonal Architecture (Ports & Adapters)** approach.


domain/ → Business logic (framework-agnostic)
application/ → Use cases and orchestration
infrastructure/ → HTTP layer, database, and external adapters


### Architectural Principles

- Dependencies point inward.
- The domain layer remains independent of frameworks and providers.
- Controllers are thin and contain no business logic.
- Infrastructure concerns are isolated and replaceable.
- AI providers are accessed through adapters, not directly from the core.

This structure enables:

- Clear responsibility boundaries
- Replaceability of external services
- Controlled system evolution under operational constraints

---

## AI Integration

AI providers are accessed exclusively through infrastructure adapters.

- The domain layer is unaware of AI implementations.
- The application layer coordinates AI execution as part of a use case.
- Provider-specific details remain isolated.

This design allows the system to evolve independently of specific AI vendors or models.

---

## Tech Stack

- **Runtime:** Node.js (>=18)
- **Language:** JavaScript (ES Modules)
- **HTTP Framework:** Express
- **Database:** Firebase (Firestore)
- **Hosting:** Render
- **AI Providers:** OpenAI API, Google Gemini API

---

## Deployment & Operational State

The service is deployed in a live environment and supports:

- Authenticated user flows
- AI-assisted feature execution
- Structured JSON output validation
- Explicit domain rule enforcement
- Structured error handling
- Controlled logging for traceability

Operational practices are being refined under real usage constraints, with a focus on:

- Controlled exposure
- Observability
- Stability under minimal operational load

---

## Author

Designed and maintained by  
Alejandro Saavedra Ruiz