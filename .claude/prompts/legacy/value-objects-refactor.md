You are acting as a senior backend engineer working on a Node.js backend with Hexagonal (Ports & Adapters) architecture.

This task is a **focused refactor**, not a redesign.

---

## Current state (important)

- The endpoint `POST /api/habits/series` is functional and stable.
- Application-level models have already been removed.
- Domain value objects still exist, but:
  - They were originally written in JavaScript.
  - The files have been renamed to `.ts`, but their internal implementation still needs to be rewritten properly in TypeScript.
- The use case `CreateHabitSeriesUseCase` currently returns a manually assembled plain object instead of a domain entity.

---

## Objective

1. Rewrite all habit-related **value objects** using proper **TypeScript**.
2. Ensure all domain concepts are expressed **only once**, in the domain layer.
3. Introduce or finalize a **HabitSeries domain entity** in TypeScript (if not already present).
4. Update `CreateHabitSeriesUseCase` so that:
   - It creates a `HabitSeries` domain entity.
   - It returns the response via a DTO derived from the domain entity (e.g. `toDTO()`).

The external behavior of the endpoint must remain identical.

---

## Scope (strict)

You MUST:
- Rewrite the contents of the existing value object files in TypeScript.
- Use explicit types, constructors/factory methods, and invariants where appropriate.
- Ensure all domain naming is English-only.
- Use the domain entity in the use case return path.
- Keep the API response shape unchanged.

You MUST NOT:
- Reintroduce application-level models.
- Change business logic or AI orchestration.
- Modify prompts, routing, or persistence logic.
- Add new features or dependencies.
- Refactor unrelated parts of the codebase.

---

## Architectural rules (non-negotiable)

- The domain layer is the **single source of truth**.
- Domain entities and value objects live in **TypeScript**.
- The use case orchestrates, it does not assemble DTOs manually.
- DTOs are projections of domain entities.
- No Spanish identifiers remain in domain or application layers.
- Localization is not handled in the backend.

---

## Domain guidance (adapt to existing structure)

### Value Objects (TypeScript)
Examples (names may vary in the codebase):
- `Difficulty` → `'low' | 'medium' | 'high'`
- `Rank` → `'bronze' | 'silver' | 'golden' | 'diamond'`
- `Action` → encapsulates name, description, difficulty

Each value object should:
- Be strongly typed
- Enforce its own invariants
- Expose a clear public interface

### Domain Entity
`HabitSeries` should encapsulate:
- id
- title
- description
- actions
- rank (default: bronze)
- totalScore (default: 0)
- createdAt
- lastActivityAt

Defaults and invariants belong inside the entity, not in the use case.

---

## Use Case refactor

Before:
- The use case returns a plain object literal.

After:
- The use case creates a `HabitSeries` entity.
- The use case returns `habitSeries.toDTO()` (or equivalent).

The use case must not manually map individual fields in the return statement.

---

## Verification checklist (mandatory)

Before finishing, verify that:
- All habit-related value objects are properly rewritten in TypeScript.
- No JS-style domain logic remains.
- The use case constructs and uses a domain entity.
- The response DTO matches the previous API response.
- The endpoint still returns `201 Created` with the full habit series.
- No regression or behavior change has been introduced.

---

## Output

- Provide the updated value object files.
- Provide the updated domain entity (if modified or added).
- Provide the updated `CreateHabitSeriesUseCase`.
- Briefly list the files changed and the reason for each change.
- Do not include explanations unrelated to this refactor.