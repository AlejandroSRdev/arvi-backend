IMPLEMENTATION PROMPT

---

## 1. PURPOSE

Eliminate the redundant `schema` third pass from both AI pipelines (`habit_series` and `action`).

The schema pass performs a second LLM call on already-structured JSON without adding meaningful correction. It introduces ~5s of latency, unnecessary token cost, and an additional failure point. Backend deterministic validation already exists and is the real guard. This change makes `structure` the terminal LLM step in both pipelines.

---

## 2. SCOPE

**INCLUDED:**
- Remove Pass 3 (schema) from `CreateHabitSeriesUseCase.js`
- Remove Pass 3 (schema) from `CreateActionUseCase.js`
- Strengthen difficulty enum validation in `validateSchema()` in `CreateHabitSeriesUseCase.js`
- Delete `JsonSchemaHabitSeriesPrompt.js` (no longer consumed)
- Remove `json_conversion` entry from `ModelSelectionPolicy.js` (no longer consumed)

**EXCLUDED:**
- Any change to `CreativeHabitSeriesPrompt.js` or `CreativeActionPrompt.js`
- Any change to `StructureHabitSeriesPrompt.js` or `StructureActionPrompt.js`
- Any change to `AIExecutionService.js`
- Any change to error classes or error mapper
- Any change to repository methods or persistence logic
- Any refactor of logic not directly related to the schema pass removal
- Any modification to `.docs/` files

---

## 3. FILES

**Modify:**
- `02application/use-cases/CreateHabitSeriesUseCase.js`
- `02application/use-cases/CreateActionUseCase.js`
- `01domain/policies/ModelSelectionPolicy.js`

**Delete:**
- `02application/prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js`

---

## 4. REQUIREMENTS

### 4.1 — `CreateHabitSeriesUseCase.js`

**A) Remove import:**
```js
import JsonSchemaHabitSeriesPrompt from '../prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js';
```

**B) Remove the `HABIT_SERIES_SCHEMA` constant** (the entire object declared at the top of the file). It is only used to construct the schema pass prompt.

**C) Fix difficulty validation in `validateSchema()`.**

Current check for each action's difficulty:
```js
if (typeof action.difficulty !== 'string' || !action.difficulty.trim()) {
  return { valid: false, error: `actions[${i}].difficulty is missing or invalid` };
}
```

Replace with enum validation:
```js
if (!['low', 'medium', 'high'].includes(action.difficulty)) {
  return { valid: false, error: `actions[${i}].difficulty must be one of: low, medium, high` };
}
```

**D) Remove Pass 3 — schema block entirely:**

Remove these lines (the full Pass 3 block including its comment):
```js
// Pass 3 — schema: enforce strict JSON schema compliance
const schemaMessages = JsonSchemaHabitSeriesPrompt({
  content: rawStructuredText,
  schema: HABIT_SERIES_SCHEMA
});

const schemaConfig = getModelConfig('json_conversion');
const schemaResponse = await generateAIResponse(
  userId,
  schemaMessages,
  {
    model: schemaConfig.model,
    temperature: schemaConfig.temperature,
    maxTokens: schemaConfig.maxTokens,
    forceJson: true,
    step: 'schema',
    requestId,
    pipeline: 'habit_series',
  },
  { aiProvider }
);
```

**E) Update post-AI parse to consume `structureResponse` directly.**

Current:
```js
parsedSeries = typeof schemaResponse.content === 'string'
  ? JSON.parse(schemaResponse.content)
  : schemaResponse.content;
```

Replace with:
```js
parsedSeries = typeof structureResponse.content === 'string'
  ? JSON.parse(structureResponse.content)
  : structureResponse.content;
```

**F) Remove the now-unused variable `rawStructuredText`** (was only used to construct the schema pass input).

---

### 4.2 — `CreateActionUseCase.js`

**A) Remove import:**
```js
import JsonSchemaHabitSeriesPrompt from '../prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js';
```

**B) Remove the `ACTION_SCHEMA` constant** (the entire object). It is only used to construct the schema pass prompt.

**C) Remove Pass 3 — schema block entirely:**

Remove these lines (the full Pass 3 block including its comment):
```js
// Pass 3 — schema: enforce strict JSON schema compliance
const schemaMessages = JsonSchemaHabitSeriesPrompt({
  content: rawStructuredText,
  schema: ACTION_SCHEMA
});

const schemaConfig = getModelConfig('json_conversion');
const schemaResponse = await generateAIResponse(
  userId,
  schemaMessages,
  {
    model: schemaConfig.model,
    temperature: schemaConfig.temperature,
    maxTokens: schemaConfig.maxTokens,
    forceJson: true,
    step: 'schema',
    requestId,
    pipeline: 'action',
  },
  { aiProvider }
);
```

**D) Update post-AI parse to consume `structureResponse` directly.**

Current:
```js
parsedAction = typeof schemaResponse.content === 'string'
  ? JSON.parse(schemaResponse.content)
  : schemaResponse.content;
```

Replace with:
```js
parsedAction = typeof structureResponse.content === 'string'
  ? JSON.parse(structureResponse.content)
  : structureResponse.content;
```

**E) Remove the now-unused variable `rawStructuredText`** (was only used to construct the schema pass input).

Note: `validateActionSchema()` already performs enum validation for `difficulty` (`!VALID_DIFFICULTIES.includes(data.difficulty)`). No changes needed there.

Note: `parseDifficulty` import and its usage in `actionData` construction remain untouched.

---

### 4.3 — `ModelSelectionPolicy.js`

**A) Remove the `json_conversion` entry from `MODEL_MAPPING`:**

Remove:
```js
// JSON conversion — always uses gpt-4o-mini for strict structural fidelity
'json_conversion': {
  model: 'gpt-4o-mini',
  temperature: 0.0,
  maxTokens: 700,
  forceJson: true,
  description: 'Strict conversion from free text to structured JSON'
},
```

**B) Remove the comment in the model selection criteria block** that references `gpt-4o-mini` for JSON conversion:
```js
// - gpt-4o-mini: strict JSON conversion, structure validation
```

Note: `gpt-4o-mini` is still used by `habit_series_structure` and `action_structure`. Only the `json_conversion` entry and its associated comment are removed.

---

### 4.4 — Delete `JsonSchemaHabitSeriesPrompt.js`

Delete the file at:
```
02application/prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js
```

Confirm no other file imports it before deleting.

---

## 5. NON-GOALS

- Do NOT modify any prompt files (`CreativeHabitSeriesPrompt`, `StructureHabitSeriesPrompt`, `CreativeActionPrompt`, `StructureActionPrompt`)
- Do NOT add retry logic
- Do NOT add new error classes
- Do NOT change the `validateActionSchema()` function beyond what is explicitly stated (i.e., no changes needed there)
- Do NOT remove `parseDifficulty` from `CreateActionUseCase.js`
- Do NOT remove the `getModelConfig` import from either use case (still used for creative and structure passes)
- Do NOT add comments, JSDoc, or inline documentation
- Do NOT refactor any logic not directly related to the schema pass

---

## 6. DELIVERABLES

1. Modified `02application/use-cases/CreateHabitSeriesUseCase.js`
2. Modified `02application/use-cases/CreateActionUseCase.js`
3. Modified `01domain/policies/ModelSelectionPolicy.js`
4. Deleted `02application/prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js`

**Verification steps after implementation:**

- Confirm no file imports `JsonSchemaHabitSeriesPrompt` anywhere in the codebase
- Confirm no file calls `getModelConfig('json_conversion')` anywhere in the codebase
- Confirm `ai.step` logs in both pipelines show only two steps: `creative` and `structure`
- Confirm `pipeline.end` `duration_ms` reflects the reduced latency
