IMPLEMENTATION PROMPT

---

## 1. PURPOSE

Implement two isolated fixes in the action creation pipeline:

A) **Bug fix — missing `difficulty` parameter in `StructureActionPrompt` call.**
   The `difficulty` value is computed but never passed to the second AI pass, causing the model to receive `"undefined"` as the difficulty value and intermittently failing post-AI schema validation under concurrent load.

B) **Observability — log raw LLM output per AI pass.**
   The `ai.step` log event exists but does not include the raw model output. Adding `raw_output` enables diagnosis of what the model actually returned in each pass of both pipelines (action and habit_series).

---

## 2. SCOPE

**INCLUDED:**
- Fix A: Pass `difficulty` to `StructureActionPrompt` in `CreateActionUseCase.js`
- Fix B: Add `raw_output` field to the `ai.step` log in `AIExecutionService.js`

**EXCLUDED:**
- Any modification to `StructureActionPrompt.js` itself
- Any modification to `CreateHabitSeriesUseCase.js`
- Any modification to the AI provider adapter
- Any change to error handling logic
- Any refactoring of existing code beyond the two stated changes

---

## 3. FILES

- `02application/use-cases/CreateActionUseCase.js` — Fix A only
- `02application/services/AIExecutionService.js` — Fix B only

---

## 4. REQUIREMENTS

### Fix A — `CreateActionUseCase.js`

Current code (line 153):
```js
const structureMessages = StructureActionPrompt({ language, rawText: rawCreativeText });
```

Required change — add `difficulty` to the call:
```js
const structureMessages = StructureActionPrompt({ language, rawText: rawCreativeText, difficulty });
```

`difficulty` is already declared at line 129:
```js
const difficulty = getNextDifficulty(series.actions);
```

No other changes in this file.

---

### Fix B — `AIExecutionService.js`

Current log block:
```js
if (step) {
  console.log(JSON.stringify({
    level: 'info',
    event: 'ai.step',
    ts: new Date().toISOString(),
    requestId,
    userId,
    pipeline,
    step,
    model,
    duration_ms,
  }));
}
```

Required change — add `raw_output` field after `duration_ms`:
```js
if (step) {
  console.log(JSON.stringify({
    level: 'info',
    event: 'ai.step',
    ts: new Date().toISOString(),
    requestId,
    userId,
    pipeline,
    step,
    model,
    duration_ms,
    raw_output: typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content),
  }));
}
```

No other changes in this file.

---

## 5. NON-GOALS

- Do NOT modify `StructureActionPrompt.js`
- Do NOT add logging anywhere else
- Do NOT truncate or transform `raw_output`
- Do NOT add try/catch around the serialization
- Do NOT refactor or rename existing variables
- Do NOT add comments or JSDoc

---

## 6. DELIVERABLES

- Modified `02application/use-cases/CreateActionUseCase.js` (one-line change at line 153)
- Modified `02application/services/AIExecutionService.js` (one field added to the existing log object)
