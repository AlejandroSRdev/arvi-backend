# Arvi Backend Service

## Overview

This repository contains the backend service of the system, implemented in **Node.js** and designed with a strong emphasis on **architectural clarity, correctness, and long-term maintainability**.

The backend has two primary responsibilities:

1. **Validate and enforce business rules** through explicit application use-cases.
2. **Orchestrate AI workflows** by coordinating calls to external LLM providers in a controlled, observable, and replaceable manner.

The system is intentionally designed to keep business logic, infrastructure concerns, and AI integrations clearly separated.

---

## Core Responsibilities

### Business Logic
- Enforce domain rules and invariants.
- Expose explicit, intention-revealing use-cases.
- Prevent leakage of business logic into controllers or infrastructure code.

### AI Orchestration
- Coordinate interactions with external AI providers (OpenAI, Gemini).
- Control when, how, and under which constraints AI calls are executed.
- Keep AI usage isolated from domain logic to ensure testability and replaceability.

> **Important**  
> The backend does not implement AI pipelines or model-specific logic.  
> It acts as an **orchestrator**, not as an AI engine.

---

## Architecture

The backend follows **Hexagonal Architecture (Ports & Adapters)**.

domain/ → Pure business logic
application/ → Use-cases and orchestration
infrastructure/ → HTTP, database, and external service adapters

---

### Key Principles
- Dependencies always point inward.
- The domain layer is framework-agnostic.
- External services (Firebase, AI APIs) are accessed only via defined ports.
- HTTP controllers are thin and contain no business logic.

---

## Tech Stack

- **Runtime:** Node.js (>=18)
- **Language:** JavaScript
- **HTTP Framework:** Express (used as a thin adapter)
- **Database:** Firebase (Firestore)
- **Hosting:** Render
- **AI Providers:** OpenAI API, Google Gemini API

---

## AI Design Philosophy

AI is treated as an **external capability**, not as core business logic.

- No AI SDKs are used inside the domain or application layers.
- AI providers are accessed through infrastructure adapters.
- The backend remains agnostic to specific models or vendors.

This design allows future evolution (e.g. RAG, embeddings, evaluation pipelines)
without destabilizing the core system.

---

## Planned Evolution

Advanced AI pipelines (such as RAG, embeddings, and retrieval logic) are **not implemented in this service**.

When required by product needs, they will be introduced as a **separate Python-based microservice (FastAPI)**, communicating with this backend via HTTP.

This ensures:
- Clean separation of concerns
- Independent scalability
- No architectural erosion of the core backend

---

## Non-Goals

- No microservices for core backend logic
- No business logic in controllers
- No AI logic in the domain layer
- No technology-driven refactors without product justification