# Claude Correction Prompt  
## Habit Series – Critical Fixes (Use-Case Output & Input Sanitization)

---

## Context

You have already completed the architectural refactor for the Habit Series flow.

This correction prompt addresses **ONLY two critical issues** detected during review.

⚠️ Do NOT re-open architectural decisions already made.  
⚠️ Do NOT introduce new features or refactors beyond what is explicitly requested.

---

## Governing Context (Read Again)

Use the following document as architectural reference:

.docs/auditoria-contratos-habit-series.md


And consider the implementation and documentation you already produced as the current baseline.

---

## ❗️Issue 1 — Use-Case does NOT return the Habit Series

### Problem

The `CreateHabitSeries` use-case currently returns only:

- `seriesId`
- `titulo`
- `message`

This is **incorrect**.

The backend is authoritative over the final Habit Series shape.  
The frontend must receive the **entire generated series**, not an acknowledgment.

---

### Required Fix

#### 1. Use-Case Output

Update the use-case:

application/use-cases/habit_series/CreateHabitSeriesUseCae.js


So that it returns the **complete Habit Series DTO**, including (at minimum):

```ts
{
  id,
  titulo,
  descripcion,
  listaAcciones,
  rango,
  puntuacionTotal,
  fechaCreacion,
  ultimaActividad
}
The returned object must represent the same shape that is persisted.

If persistence returns the created entity, reuse it.

If not, rehydrate the persisted series before returning.

2. Application Contract Update
Update:

application/contracts/CreateHabitSeriesContract.ts
So that:

CreateHabitSeriesOutput represents the full Habit Series DTO.

Remove success, message, or acknowledgment-style fields.

The contract reflects exactly what the use-case returns.

DTO must remain:

plain objects only

no domain entities

no logic

3. Controller Alignment
Update:

/infraestructure/http/controllers/HabitSeriesController.js
So that:

The controller returns directly the series DTO from the use-case.

No response shaping, no message wrapping.

HTTP status remains 201 Created.

❗️Issue 2 — SanitizeUserInput is NOT executed
Problem
The normalization pipeline:

application/input/SanitizeUserInput.js
is imported or exists but is not executed in the real AI flow.

This leaves the LLM unprotected and makes the file effectively dead code.

Required Fix
1. Correct Execution Point
SanitizeUserInput MUST be invoked inside the AI adapter, before the first LLM call.

Correct location:

/infraestructure/ai/gemini/GeminiAdapter.js
(And any adapter that receives raw user input.)

2. Execution Rules
The adapter must:

receive raw user input

call SanitizeUserInput(rawInput)

pass the sanitized result to the LLM

Do NOT move sanitization to:

controller

parsing service

use-case

Sanitization is a responsibility of the AI adapter, not of application orchestration.

Strict Constraints
❌ Do NOT modify routes.

❌ Do NOT add new services.

❌ Do NOT alter domain entities.

❌ Do NOT rework AI orchestration logic beyond sanitization injection.

❌ Do NOT introduce response wrappers or metadata.

DONE Criteria
This correction is complete when:

POST /api/habits/series returns the full Habit Series object.

The returned series matches exactly the persisted schema.

CreateHabitSeriesContract.ts exposes the full series DTO as output.

The controller returns the DTO verbatim with HTTP 201.

SanitizeUserInput is executed inside GeminiAdapter before LLM invocation.

No other files are changed beyond what is required.

Final Note
This is a correction pass, not a refactor.

Touch only what is necessary to fix the two issues above.