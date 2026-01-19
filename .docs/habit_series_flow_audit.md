# Audit Report: POST /api/habits/series Flow

**Date:** 2026-01-19
**Auditor Role:** Senior Backend Architect
**Scope:** Flow completeness and coherence analysis

---

## Executive Summary

The business flow for creating habit series via AI is **INCOMPLETE and INCOHERENT**. There are two disconnected flows that should be unified, critical validations missing before AI execution, and counter management is broken.

---

## 1. Business Intent Validation

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| User authentication | `authenticate.js:20-48` | Firebase token verified correctly |
| Plan determination | `HabitSeriesValidationService.js:73-81` | Effective plan logic (freemium+trial→trial) correct |
| Feature access check | `HabitSeriesValidationService.js:128-138` | Validates `habits.series.create` access |
| Active series limit | `HabitSeriesValidationService.js:140-153` | Compares `activeSeriesCount` vs `maxActiveSeries` |

### ⚠️ WEAK / IMPLICIT

| Issue | Details |
|-------|---------|
| Validation-only endpoint | `POST /api/habits/series` returns validation result but **does NOT create** anything |
| Frontend must coordinate | Comments indicate frontend orchestrates the multi-step flow |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **No limit validation before AI** | **CRITICAL** | When `POST /api/ai/chat` with `function_type='habit_series_structure'` is called, only `ai.chat` feature is validated, NOT `habits.series.create` limit |
| Disconnected validation | HIGH | User can call AI endpoint directly bypassing `/api/habits/series` validation |

---

## 2. AI Interaction

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| Model selection | `ModelSelectionPolicy.js:97-101` | `habit_series_structure` → gemini-2.5-pro, temp=0.0 |
| AI provider abstraction | `IAIProvider.js` | Clean port/adapter pattern |
| Energy validation | `AIExecutionService.js:74-79` | Validates energy before calling AI |
| Energy consumption | `AIExecutionService.js:89-104` | Energy deducted after AI call |

### ⚠️ WEAK / IMPLICIT

| Issue | Details |
|-------|---------|
| AI is **not** a dependency | In `AIExecutionService.js:132-139`, the service decides to persist directly. **Business logic (when to persist) is embedded in AI execution**, not in a domain use-case |
| No function_type validation for persistence | Any `functionType === 'habit_series_structure'` triggers persistence - no additional business check |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **No pre-execution limit check** | **CRITICAL** | `generateAIResponseWithFunctionType` auto-persists when `isHabitSeriesFinal()` returns true, but **never checks if user is at limit** |
| Feature-specific authorization | HIGH | AI route uses `authorizeFeature('ai.chat')` not `authorizeFeature('habits.series.create')` |

---

## 3. AI Output Handling

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| JSON parsing | `FirestoreHabitSeriesRepository.js:40-48` | Attempts `JSON.parse()` if string |
| Error on invalid JSON | `FirestoreHabitSeriesRepository.js:46` | Throws `Invalid JSON in seriesData` |

### ⚠️ WEAK / IMPLICIT

| Issue | Details |
|-------|---------|
| No schema validation | `createFromAI` accepts any valid JSON - no check for required fields (`name`, `habits[]`, etc.) |
| AI output trusted blindly | Whatever AI returns is persisted if it's valid JSON |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **No domain validation** | **HIGH** | No invariant checks: "is this a valid habit series?" |
| No malformed output handling | MEDIUM | If AI returns partial/incomplete series, it gets persisted |
| No sanitization | MEDIUM | AI-generated content stored directly without sanitization |

---

## 4. Domain Consistency

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| Plan policy | `PlanPolicy.js` | Single source of truth for plans and limits |
| Series finality decision | `HabitSeriesPolicy.js:23-25` | Clear rule: `functionType === 'habit_series_structure'` |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **No authoritative validation point** | **CRITICAL** | No single place decides "this series is valid for persistence" |
| **Counter never incremented** | **CRITICAL** | `incrementActiveSeries()` exists but is **NEVER CALLED** in creation flow |
| Counter decrement on delete exists | - | `deleteHabitSeries.js:54` calls `decrementActiveSeries`, but create doesn't increment |

---

## 5. Persistence

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| Firestore write | `FirestoreHabitSeriesRepository.js:54-69` | Writes to `users/{userId}/habitSeries/{seriesId}` |
| Timestamps added | `FirestoreHabitSeriesRepository.js:64-65` | `createdAt`, `updatedAt` via `serverTimestamp()` |
| ID generation | `FirestoreHabitSeriesRepository.js:51` | Uses provided ID or generates timestamp-based |

### ⚠️ WEAK / IMPLICIT

| Issue | Details |
|-------|---------|
| No comment notes counter increment | `FirestoreHabitSeriesRepository.js:16` explicitly states: "Incremento de contadores (se hará en siguiente iteración)" |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **No transaction boundary** | **CRITICAL** | AI call → persistence → counter increment are not atomic. If persistence succeeds but counter fails, DB inconsistent |
| **Partial failures unhandled** | **HIGH** | Energy consumed even if persistence fails |
| No rollback mechanism | HIGH | If `createFromAI` fails after AI call, energy is already deducted |

---

## 6. Delivery to Client

### ✅ CLEARLY IMPLEMENTED

| Step | Location | Assessment |
|------|----------|------------|
| Response shape | `AIController.js:73-79` | Consistent structure: `{success, message, model, tokensUsed, energyConsumed}` |
| Error mapping | `errorMapper.js` | Typed errors mapped to HTTP status codes |
| Semantic HTTP codes | `HabitSeriesController.js:44` | 429 for limit reached, 403 for other denials |

### ⚠️ WEAK / IMPLICIT

| Issue | Details |
|-------|---------|
| No persistence confirmation | Client receives AI response but no explicit confirmation that series was persisted |
| `createFromAI` result discarded | `AIExecutionService.js:138` awaits persistence but doesn't include result in response |

### ❌ MISSING / INCOMPLETE

| Gap | Severity | Details |
|-----|----------|---------|
| **Silent persistence** | **HIGH** | Client has no way to know if series was actually created. If DB write fails silently, client shows success |
| No created series ID returned | MEDIUM | Response doesn't include the `seriesId` that was created |

---

## 7. Responsibility Boundaries

### Flow Diagram: Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FLOW 1: Validation Only (POST /api/habits/series)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Client] ──POST /series──> [HabitSeriesController]                         │
│                                   │                                          │
│                                   ▼                                          │
│                        [HabitSeriesValidationService]                        │
│                                   │                                          │
│                   ┌───────────────┼───────────────┐                          │
│                   ▼               ▼               ▼                          │
│            [getUser]    [hasFeatureAccess]  [checkLimit]                     │
│                   │               │               │                          │
│                   └───────────────┼───────────────┘                          │
│                                   ▼                                          │
│                          {allowed: true/false}  ◄── NO CREATION              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FLOW 2: Actual Creation (POST /api/ai/chat + habit_series_structure)        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Client] ──POST /chat──> [AIController]                                     │
│                               │                                              │
│              ┌────────────────┼────────────────┐                             │
│              ▼                ▼                ▼                             │
│      [authenticate]  [rateLimiter]  [authorizeFeature('ai.chat')]           │
│              │                                   │                           │
│              │          ⚠️ VALIDATES 'ai.chat'   │                           │
│              │          NOT 'habits.series.create' │                         │
│              └───────────────┬───────────────────┘                           │
│                              ▼                                               │
│                    [AIExecutionService]                                      │
│                              │                                               │
│           ┌──────────────────┼──────────────────┐                            │
│           ▼                  ▼                  ▼                            │
│    [checkEnergy]     [callAI via port]   [consumeEnergy]                     │
│           │                  │                  │                            │
│           │                  ▼                  │                            │
│           │    ┌─────────────────────────┐      │                            │
│           │    │ isHabitSeriesFinal()?   │      │                            │
│           │    └───────────┬─────────────┘      │                            │
│           │                │ YES                │                            │
│           │                ▼                    │                            │
│           │    [habitSeriesRepository.createFromAI]                          │
│           │                │                    │                            │
│           │         ❌ NO LIMIT CHECK           │                            │
│           │         ❌ NO incrementActiveSeries │                            │
│           └────────────────┼────────────────────┘                            │
│                            ▼                                                 │
│                     {content, model, ...}  ◄── NO SERIES ID RETURNED         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ownership Matrix

| Decision | Expected Owner | Actual Owner | Gap |
|----------|---------------|--------------|-----|
| "Can user create series?" | Domain/Application | `HabitSeriesValidationService` | ✅ |
| "Should AI persist result?" | Domain Use-Case | `AIExecutionService` | ❌ Business logic in wrong layer |
| "Is series data valid?" | Domain Entity/Validator | **Nobody** | ❌ Missing |
| "Increment counter after create" | Use-Case | **Nobody** | ❌ Missing |
| "When to consume energy" | Application Service | `AIExecutionService` | ✅ |

---

## Summary of Findings by Severity

### 🔴 CRITICAL (Must Fix)

1. **`incrementActiveSeries()` never called** - Counter will never increase, limits useless
2. **No limit check before AI generation** - User can bypass limits via `/api/ai/chat`
3. **Two disconnected flows** - Validation and creation are completely separate
4. **No transaction boundary** - Partial failures leave DB inconsistent

### 🟠 HIGH (Should Fix)

1. **AI output not validated** - Any valid JSON persisted, no schema check
2. **Feature authorization mismatch** - `/ai/chat` validates wrong feature
3. **Silent persistence** - Client unaware if creation failed
4. **No rollback on failure** - Energy consumed even if persistence fails

### 🟡 MEDIUM (Consider Fixing)

1. **No created series ID in response** - Client can't confirm what was created
2. **Business logic in AIExecutionService** - Persistence decision belongs in use-case
3. **No sanitization** - AI content stored directly

---

## File Reference Summary

| Layer | File | Key Functions |
|-------|------|---------------|
| Route | `habitSeries.routes.js:33` | POST /series (validation only) |
| Route | `ai.routes.js:57-68` | POST /chat (actual creation trigger) |
| Controller | `HabitSeriesController.js:37` | `createHabitSeriesEndpoint` |
| Controller | `AIController.js:40` | `chatEndpoint` |
| Service | `HabitSeriesValidationService.js:107` | `assertCanCreateHabitSeries` |
| Service | `AIExecutionService.js:121` | `generateAIResponseWithFunctionType` |
| Policy | `HabitSeriesPolicy.js:23` | `isHabitSeriesFinal` |
| Policy | `PlanPolicy.js:157` | `habits.series.create` feature |
| Repository | `FirestoreHabitSeriesRepository.js:31` | `createFromAI` |
| Repository | `FirestoreUserRepository.js:171` | `incrementActiveSeries` (UNUSED) |

---

## Next Steps

This audit is ready for human architect review. No code modifications have been made. Implementation decisions should be made after reviewing these findings.
