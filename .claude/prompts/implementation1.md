You are performing a surgical domain fix.

Scope is strictly limited to the Action entity and its direct mappings.

You must ensure that Action contains ONLY the following properties:

id

name

description

difficulty

Nothing else.

Phase 1 — Audit

Before modifying anything:

Locate the Action domain entity.

List all current properties.

Identify:

Any gamification fields.

Any score-related fields.

Any timestamps.

Any hidden metadata.

Any derived properties.

Identify where those properties are used (DTO, repository, mapper).

Provide a short audit summary before implementing changes.

Phase 2 — Apply Strict Reduction

Modify the Action entity so that it contains exactly:

{
  id: string,
  name: string,
  description: string,
  difficulty: Difficulty
}

Rules:

id must remain required.

difficulty must use the existing Difficulty value object.

No default extra properties.

No score.

No rank.

No createdAt.

No updatedAt.

No completed.

No gamification metadata.

No user references.

No internal flags.

Constructor must validate:

name non-empty

description non-empty

difficulty valid via Difficulty VO

Phase 3 — Update Mapping Layer

Update:

Any ActionOutputDTO mapper.

Any HabitSeriesOutputDTO that includes actions.

Ensure output shape is:

{
  "id": "...",
  "name": "...",
  "description": "...",
  "difficulty": "low|medium|high"
}

No additional fields.

Phase 4 — Repository Consistency

Check:

Firestore serialization.

Atomic transaction code.

Ensure no code expects removed properties.

If any property is referenced elsewhere:

Remove the reference.

Do NOT add compatibility layers.

Do NOT add transitional fields.

This is a clean break.

Phase 5 — Validation

Verify:

createHabitSeries still works.

createAction still works.

No compile errors.

No unused imports remain.

No circular dependencies introduced.

Non-Negotiable Constraints

Do NOT refactor unrelated files.

Do NOT modify Subscription.

Do NOT touch MonthlyUsage.

Do NOT change use case signatures.

Do NOT change error handling.

Do NOT modify AI prompts.

This task is strictly about the Action entity and its output shape.

Definition of Done:

Action domain entity has exactly 4 fields.

DTO outputs exactly those 4 fields.

No residual gamification or legacy fields remain.

System compiles and runs.