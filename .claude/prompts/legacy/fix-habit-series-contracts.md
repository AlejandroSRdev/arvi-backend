# Claude Implementor Prompt  
## Habit Series – Architectural Coherence Refactor

---

## Role

You act as a **senior implementor** inside a **Node.js backend using Hexagonal Architecture (Ports & Adapters)**.

Your goal is **NOT** to add features.  
Your goal is to **close architectural and contractual coherence** according to an existing audit.

You must **execute exactly what is requested**, without introducing new design decisions.

---

## Governing Document (Mandatory Reading)

You MUST read and treat as **conceptual source of truth**:

.docs/auditoria-contratos-habit-series.md


This document defines:
- what is legacy,
- what is misaligned,
- what must be corrected.

Do not contradict it.  
Do not invent alternatives.

---

## System Context (Already Decided – Non-Negotiable)

- There is **only one valid endpoint**:
POST /api/habits/series


- The **only authoritative flow** is the use-case:
application/use-cases/habit_series/CreateHabitSeriesUseCae.js


- The backend is **authoritative over the final shape** of a Habit Series.
- The frontend **does NOT define nor validate** the final structure.
- The HTTP controller **contains no business logic**.

The use-case:
- validates plan / feature / limits / energy
- executes AI in 3 passes
- validates AI output against schema
- persists the series
- returns the final result

---

## Files You MUST Read and Modify

### 1. Authoritative Use-Case (Read – Do NOT redesign logic)
application/use-cases/habit_series/CreateHabitSeriesUseCae.js


Purpose:
- Extract the **real input and output contract**.
- This file is the functional center of gravity.

---

### 2. Application Contract (Must Be Rewritten)
application/contracts/CreateHabitSeriesContract.ts


Requirements:
- Must match **1:1** the real use-case signature.
- Must be a **pure DTO**:
  - primitives and plain objects only
  - no classes
  - no logic
- The output must represent the **final backend-defined series shape**.

---

### 3. HTTP Controller (Mandatory Refactor)
/infraestructure/http/controllers/HabitSeriesController.js


Final responsibilities:
- Minimal transport-level validation (required fields, basic types).
- Adapt HTTP DTO → Application Contract.
- Invoke `CreateHabitSeries`.
- Map application errors to HTTP responses.

Strictly forbidden:
- Instantiating domain entities.
- Validating final series structure.
- Orchestrating AI logic.
- Business rules of any kind.

---

### 4. Routes (Verification Only)
/infraestructure/http/routes/HabitSeriesRoutes.js


Purpose:
- Ensure correct wiring of `POST /api/habits/series`.
- Do NOT add endpoints.

---

### 5. Application Services (Align, Do Not Orchestrate)
application/services/habit_series_services/HabitSeriesParsingService.js
application/services/habit_series_services/HabitSeriesValidationService.js


Rules:
- Services may help (parse / validate).
- They must:
  - return DTOs
  - not know HTTP
  - not decide flow
- Do NOT turn them into mini use-cases.

---

### 6. JSON Schema Validator (Final Shape Authority)
application/services/JsonSchemaValidationService.js


Rules:
- This schema defines the **single valid final shape**.
- The same shape must be:
  - persisted
  - returned to the client
- Do not duplicate schema logic elsewhere.

---

### 7. Legacy Classes Migration (Required)
/application/models/habit_classes/


Contains legacy rich classes such as:
- `SerieTematica`
- `Accion`
- `HabitosUsuario`
- `Dificultad`

Actions:
- Move them to `domain/entities/`
- Rename them to **English**
- Keep them only if they add real behavior
- Remove any dependency from:
  - controllers
  - contracts

Domain entities are used **only inside domain/application**, never as DTOs.

---

## Files for Context Only (DO NOT MODIFY)

Read only if needed for understanding:

/domain/ports/HabitSeriesRepository.js
/infraestructure/persistence/firestore/FirestoreHabitSeriesRepository.js
/infraestructure/ai/gemini/GeminiAdapter.js
/infraestructure/ai/openai/OpenAIAdapter.js
/application/application_errors/
/infraestructure/http/errorMapper.js


---

## Strict Rules

- ❌ Do NOT create new endpoints.
- ❌ Do NOT add features.
- ❌ Do NOT mix layers.
- ❌ Do NOT expose domain entities outside domain/application.
- ❌ Do NOT introduce new logic “for cleanliness”.

---

## DONE Criteria (Verifiable)

The task is complete when:

1. `POST /api/habits/series`:
   - actually invokes the use-case
   - returns the use-case result

2. `CreateHabitSeriesContract.ts`:
   - matches the use-case signature exactly
   - contains no classes or logic

3. The controller:
   - is a minimal adapter
   - contains no business logic

4. Domain entities:
   - live in `domain/entities/`
   - are not referenced by controllers or contracts

5. The Habit Series shape is:
   - unique
   - consistent
   - schema-validated
   - persisted and returned without ambiguity

---

## Final Instruction – Role Switch & Documentation

Once implementation is finished:

1. **Change your role** to:
.claude/agents/workers/technical_documenter.md


2. As a technical documenter, **document what you have done**, including:
- Architectural decisions enforced
- Files modified and why
- Before vs after responsibility changes
- Final contract shape (high level)
- How the system should be validated (conceptually)

Do NOT document future ideas.  
Document **only what was implemented**.