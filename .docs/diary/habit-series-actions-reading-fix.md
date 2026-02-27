# 📘 Dev Diary — HabitSeries `actions` Reconstruction Fix  
**Date:** 2026-02-27  

---

## Context

While testing the `GET /api/habits/series/:seriesId` endpoint, it failed with the following error:

```
HabitSeries must contain at least three actions
```

The **domain invariant** was correctly enforcing the rule that a `HabitSeries` must include at least 3 actions.  
However, the persisted data did contain more than three actions.

---

## Root Cause

The repository implementation (`FirestoreHabitSeriesRepository.getHabitSeriesById`) attempted to reconstruct the actions from a **subcollection**:

```javascript
seriesRef.collection('actions').get();
```

But the actual persistence model stored the actions as an **embedded array** within the `HabitSeries` document, not as a subcollection.

### Result:

- The query to the subcollection returned 0 documents.
- `actions.length === 0`
- The domain invariant failed.
- The constructor threw an error.

This revealed a misalignment between the persistence model and the repository's read logic.

---

## Observability Added

To diagnose the issue precisely, structured logs were added to the repository:

1. **Document existence**.
2. **Raw Firestore keys**.
3. **Number of actions before instantiating the domain entity**.

### Confirmation:

- `data.actions` existed.
- The subcollection did not exist.

This isolated the issue to the repository's reconstruction logic.

---

## Fix Implemented

The subcollection logic was completely removed, and the actions were reconstructed directly from:

```javascript
const rawActions = data.actions ?? [];
```

Each element was mapped through `Action.create(...)`, and the resulting array was passed to:

```javascript
HabitSeries.create({...});
```

### Results After the Fix:

- `actions.length` correctly reflects the persisted state.
- The domain invariant is satisfied.
- The endpoint returns a `200` with the complete entity.

---

## Secondary Fix

During the refactor, the following additional improvements were made:

1. **Removed redundant references** to `actionsSnapshot`.
2. **Corrected the variable initialization order**:
   - Avoided the error `Cannot access 'actions' before initialization`.
3. **Ensured declaration order**:
   - Read → Transform → Log → Return.

---

## Pipeline Improvement (Preventive)

To prevent similar regressions in the future:

1. **ESLint was added to the CI pipeline**.
2. **A `.eslintrc.js` file was created at the project root**.
3. **Enabled rules**:
   - `no-undef`
   - `no-unused-vars`

### Benefits:

- Undefined variables are detected before deployment.
- Structural errors are identified during the PR stage.

---

## Architectural Insight

### Key Lesson:

The repository implementation must reflect the actual persistence model.  
Domain invariants are correct; misalignment between the read/write layers causes failures.

### Current System State:

- **Structurally coherent**.
- **Consistent with the domain**.
- **Validated by CI**.

### Outcome:

The sprint goal is considered successfully achieved.