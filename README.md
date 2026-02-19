# Arvi Backend Service

## Overview

Arvi Backend Service is a Node.js backend designed to support AI-assisted workflows and core business operations.

The system is built with a focus on:

- Clear architectural boundaries
- Explicit business logic
- Controlled integration with external services
- Maintainability over time

This repository represents an evolving backend system, progressively refined under real deployment constraints.

---

## Responsibilities

The backend is responsible for:

1. Enforcing domain rules and invariants through explicit use cases.
2. Orchestrating AI-assisted operations via external providers.
3. Managing authentication, user data, and core application flows.
4. Exposing HTTP endpoints through a thin Express adapter.

The service acts as an orchestrator of external capabilities rather than embedding AI or infrastructure logic directly into the core.

---

## Architecture

The project follows a **Hexagonal Architecture (Ports & Adapters)** approach.

domain/ → Business logic (framework-agnostic)
application/ → Use cases and orchestration
infrastructure/ → HTTP layer, database, and external adapters


### Design Principles

- Dependencies point inward.
- The domain layer does not depend on frameworks or external services.
- Controllers remain thin and contain no business logic.
- Infrastructure concerns are isolated from core logic.

This structure supports testability, replaceability of external services, and controlled system evolution.

---

## Tech Stack

- **Runtime:** Node.js (>=18)
- **Language:** JavaScript (ES Modules)
- **HTTP Framework:** Express
- **Database:** Firebase (Firestore)
- **Hosting:** Render
- **AI Providers:** OpenAI API, Google Gemini API

---

## AI Integration

AI providers are accessed through infrastructure adapters.

- The domain layer has no knowledge of AI implementations.
- The application layer coordinates AI calls when required.
- Provider-specific details remain isolated.

This allows the backend to remain stable even if AI vendors or models change.

---

## Deployment & Operation

The service is deployed in a production environment and supports:

- User authentication flows
- AI-assisted feature execution
- Structured error handling
- Controlled trace logging

Observability and operational practices are continuously refined as usage evolves.

---

## Evolution

Advanced AI pipelines (e.g., RAG or embedding-based retrieval systems) are not implemented in this service.

If required, they will be introduced as a separate service to preserve architectural boundaries and scalability.

---

## Non-Goals

- No business logic inside controllers
- No direct AI logic inside the domain layer
- No unnecessary microservice fragmentation
- No technology-driven refactors without clear justification

---

## Author

Designed and maintained by  
Alejandro Saavedra Ruiz
