## Context
There is an existing endpoint:

POST /api/habits/series

The endpoint is fully functional and production-ready.  
Your task is a **controlled refactor**, not a redesign.

## Objective
Refactor all value objects under `habit_objects` to use **English-only naming**, and ensure that the **request contract and internal handling consistently use English field names**.

This is a professionalization step to make the domain language-agnostic and aligned with industry standards.

## Scope (strict)
You MUST:
1. Refactor value objects currently defined in Spanish to English.
2. Ensure the request payload expects and propagates English field names.
3. Update mappings where necessary so the system remains functional.
4. Preserve all existing behavior, invariants, and logic.

You MUST NOT:
- Change business logic.
- Modify AI prompts or orchestration logic.
- Introduce new features.
- Change persistence structure beyond field renaming where required.
- Refactor unrelated files.

## Domain rules (non-negotiable)
- All domain enums and value objects MUST be in English.
- Localization is NOT handled in the backend.
- DTOs and contracts exposed by the API MUST use English field names.
- Internal domain invariants must remain enforced.

## Expected refactors (examples)
Spanish → English mapping (illustrative, adjust to actual codebase):

- `titulo` → `title`
- `descripcion` → `description`
- `acciones` → `actions`
- `nombre` → `name`
- `dificultad` → `difficulty`
- `rango` → `rank`
- `puntuacionTotal` → `totalScore`
- `fechaCreacion` → `createdAt`
- `ultimaActividad` → `lastActivityAt`

Ensure:
- Value Objects reflect these names.
- The request body is parsed using English keys.
- Any adapter or mapper correctly translates incoming data to domain objects if needed.

## Verification checklist (you must self-check)
Before finishing, verify that:
- All value objects under `habit_objects` are fully English.
- No Spanish identifiers remain in domain-level code.
- The request reaches the use case using English field names.
- The endpoint still returns a valid Habit Series DTO.
- No tests or integrations are broken by this change.

## Output
- Provide the refactored files.
- Briefly list which files were changed and why.
- Do NOT include explanations unrelated to this refactor.
