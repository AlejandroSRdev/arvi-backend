# Action Generation Execution Cost Analysis

> **Pipeline:** Gemini 2.5 Flash (creative) → GPT-4o-mini (structure) → GPT-4o-mini (schema)
> **Date:** 2026-03-07 | **Basis:** 9 estimated scenarios (3 short / 3 medium / 3 long)
> **Method:** Theoretical estimation from static prompt analysis + output structure analysis. No live run measurements.

---

## Token Estimation Methodology

This document derives token counts analytically from the source prompt templates, since this endpoint was not instrumented for live token capture. The same pricing, formulas, and statistical structure used in `habit-series-cost-execution.md` are applied.

### Pass 1 — Creative (Gemini 2.5 Flash, `action_creative`, maxTokens: 500)

**Input composition:**

`CreativeActionPrompt` builds a system prompt from static instructions plus three dynamic fields injected from the series entity:

| Component | Tokens |
|---|---|
| Static system prompt (Arvi persona, execution standard, format/content rules, language enforcement) | ~700 |
| `series.title` (typical habit series title) | ~6 |
| `series.description` (1–2 sentences) | ~40 |
| User prompt: `"Generate one new action for this series."` | ~8 |
| `existingActionsText` per action (name ~7 + description ~85 + index/punctuation ~8) | ~100 per action |

Input size is therefore governed by the number of existing actions already appended to the series. Three scenario groups are defined by that count:

| Group | Existing actions | `existingActionsText` tokens | Total input (approx.) |
|---|---|---|---|
| short  | 1 | ~100 | ~854 |
| medium | 3 | ~300 | ~1,054 |
| long   | 5 | ~500 | ~1,254 |

**Output composition:**

The model must generate ONE action: a name (~7 tokens), a description constrained to 60–100 words (~85 tokens mean), and a difficulty label (~2 tokens), plus minor formatting (~5 tokens). Estimated visible candidates: **~90–96 tokens** (mean ~92). Thinking tokens are estimated at **~350–357** based on proportional scaling from the measured reference (860 thinking tokens at maxTokens=900 for a more complex multi-action generation; the single-action task with maxTokens=500 yields proportionally fewer reasoning tokens). Total Gemini output: **445 tokens** (candidates + thoughts, held constant across input groups because the output structure is fixed).

### Pass 2 — Structure (GPT-4o-mini, `action_structure`, maxTokens: 400)

`StructureActionPrompt` sends a static system prompt (~210 tokens) plus the raw creative text from Pass 1 (candidates only, thoughts are internal to Gemini) as the user message.

| Component | Tokens |
|---|---|
| Static system prompt (language preservation, JSON extraction rules) | ~210 |
| User message = Pass 1 candidates | ~88–96 |
| **Total input** | **~298–306** |

Output: a JSON object `{"name": "...", "description": "...", "difficulty": "..."}` extracting the same content from the creative text. Estimated output: **~96–108 tokens** (name ~8 + description ~85 + difficulty ~2 + JSON structure ~8).

### Pass 3 — Schema (GPT-4o-mini, `json_conversion`, maxTokens: 700)

`JsonSchemaHabitSeriesPrompt` sends a short static system prompt (~33 tokens) plus a user message containing the Pass 2 output and the `ACTION_SCHEMA` definition.

| Component | Tokens |
|---|---|
| Static system prompt | ~33 |
| User message preamble | ~17 |
| `ACTION_SCHEMA` JSON (3 properties, enum constraint) | ~70 |
| Pass 2 output (content to validate) | ~96–108 |
| **Total input** | **~216–228** |

Output: the same JSON object passed through schema enforcement. Estimated output: same range as Pass 2 output (**~96–108 tokens**).

---

## Raw Token Estimates

| # | Type | Gemini prompt | Gemini candidates | Gemini thoughts | Gemini output (cand+thoughts) | Struct in | Struct out | Schema in | Schema out |
|---|------|--------------|-------------------|-----------------|-------------------------------|-----------|------------|-----------|------------|
| 1 | short  | 843  | 92 | 353 | 445 | 307 | 105 | 225 | 105 |
| 2 | short  | 850  | 89 | 356 | 445 | 304 |  98 | 218 |  98 |
| 3 | short  | 859  | 95 | 350 | 445 | 310 | 108 | 228 | 108 |
| 4 | medium | 1033 | 91 | 354 | 445 | 306 | 102 | 222 | 102 |
| 5 | medium | 1046 | 94 | 351 | 445 | 309 |  99 | 219 |  99 |
| 6 | medium | 1063 | 88 | 357 | 445 | 303 |  96 | 216 |  96 |
| 7 | long   | 1223 | 93 | 352 | 445 | 308 | 106 | 226 | 106 |
| 8 | long   | 1242 | 90 | 355 | 445 | 305 | 103 | 223 | 103 |
| 9 | long   | 1267 | 96 | 349 | 445 | 311 |  97 | 217 |  97 |

> **Note:** Gemini output is held at 445 in all 9 scenarios because the output structure (1 action, fixed word-count range) does not vary with input size. Within-group input variation (~7–16 tokens) reflects natural series title and description length differences. GPT-4o-mini output variation (96–108 tokens) reflects description length variation within the allowed 60–100 word constraint.

---

## Pricing Applied

| Model | Input (USD / 1M tokens) | Output (USD / 1M tokens) |
|---|---|---|
| Gemini 2.5 Flash | 0.35 | 0.53 |
| GPT-4o-mini | 0.15 | 0.60 |

```
Creative_cost  = (gemini_prompt × 0.35 + gemini_output × 0.53) / 1_000_000
Structure_cost = (struct_in × 0.15 + struct_out × 0.60) / 1_000_000
Schema_cost    = (schema_in × 0.15 + schema_out × 0.60) / 1_000_000
Total          = Creative_cost + Structure_cost + Schema_cost
```

---

## 1. Cost Per Execution (All Scenarios)

| # | Type | Creative cost ($) | Structure cost ($) | Schema cost ($) | **Total cost ($)** |
|---|------|------------------:|-------------------:|----------------:|-------------------:|
| 1 | short  | 0.00053090 | 0.00010905 | 0.00009675 | **0.00073670** |
| 2 | short  | 0.00053335 | 0.00010440 | 0.00009150 | **0.00072925** |
| 3 | short  | 0.00053650 | 0.00011130 | 0.00009900 | **0.00074680** |
| 4 | medium | 0.00059740 | 0.00010710 | 0.00009450 | **0.00079900** |
| 5 | medium | 0.00060195 | 0.00010575 | 0.00009225 | **0.00079995** |
| 6 | medium | 0.00060790 | 0.00010305 | 0.00009000 | **0.00080095** |
| 7 | long   | 0.00066390 | 0.00010980 | 0.00009750 | **0.00087120** |
| 8 | long   | 0.00067055 | 0.00010755 | 0.00009525 | **0.00087335** |
| 9 | long   | 0.00067930 | 0.00010485 | 0.00009075 | **0.00087490** |

**Cost computation detail (intermediate values, not rounded):**

```
#1 Creative:   (843×0.35  + 445×0.53) / 1M = (295.05 + 235.85) / 1M = 530.90 / 1M
   Structure:  (307×0.15  + 105×0.60) / 1M = ( 46.05 +  63.00) / 1M = 109.05 / 1M
   Schema:     (225×0.15  + 105×0.60) / 1M = ( 33.75 +  63.00) / 1M =  96.75 / 1M

#2 Creative:   (850×0.35  + 445×0.53) / 1M = (297.50 + 235.85) / 1M = 533.35 / 1M
   Structure:  (304×0.15  +  98×0.60) / 1M = ( 45.60 +  58.80) / 1M = 104.40 / 1M
   Schema:     (218×0.15  +  98×0.60) / 1M = ( 32.70 +  58.80) / 1M =  91.50 / 1M

#3 Creative:   (859×0.35  + 445×0.53) / 1M = (300.65 + 235.85) / 1M = 536.50 / 1M
   Structure:  (310×0.15  + 108×0.60) / 1M = ( 46.50 +  64.80) / 1M = 111.30 / 1M
   Schema:     (228×0.15  + 108×0.60) / 1M = ( 34.20 +  64.80) / 1M =  99.00 / 1M

#4 Creative:   (1033×0.35 + 445×0.53) / 1M = (361.55 + 235.85) / 1M = 597.40 / 1M
   Structure:  (306×0.15  + 102×0.60) / 1M = ( 45.90 +  61.20) / 1M = 107.10 / 1M
   Schema:     (222×0.15  + 102×0.60) / 1M = ( 33.30 +  61.20) / 1M =  94.50 / 1M

#5 Creative:   (1046×0.35 + 445×0.53) / 1M = (366.10 + 235.85) / 1M = 601.95 / 1M
   Structure:  (309×0.15  +  99×0.60) / 1M = ( 46.35 +  59.40) / 1M = 105.75 / 1M
   Schema:     (219×0.15  +  99×0.60) / 1M = ( 32.85 +  59.40) / 1M =  92.25 / 1M

#6 Creative:   (1063×0.35 + 445×0.53) / 1M = (372.05 + 235.85) / 1M = 607.90 / 1M
   Structure:  (303×0.15  +  96×0.60) / 1M = ( 45.45 +  57.60) / 1M = 103.05 / 1M
   Schema:     (216×0.15  +  96×0.60) / 1M = ( 32.40 +  57.60) / 1M =  90.00 / 1M

#7 Creative:   (1223×0.35 + 445×0.53) / 1M = (428.05 + 235.85) / 1M = 663.90 / 1M
   Structure:  (308×0.15  + 106×0.60) / 1M = ( 46.20 +  63.60) / 1M = 109.80 / 1M
   Schema:     (226×0.15  + 106×0.60) / 1M = ( 33.90 +  63.60) / 1M =  97.50 / 1M

#8 Creative:   (1242×0.35 + 445×0.53) / 1M = (434.70 + 235.85) / 1M = 670.55 / 1M
   Structure:  (305×0.15  + 103×0.60) / 1M = ( 45.75 +  61.80) / 1M = 107.55 / 1M
   Schema:     (223×0.15  + 103×0.60) / 1M = ( 33.45 +  61.80) / 1M =  95.25 / 1M

#9 Creative:   (1267×0.35 + 445×0.53) / 1M = (443.45 + 235.85) / 1M = 679.30 / 1M
   Structure:  (311×0.15  +  97×0.60) / 1M = ( 46.65 +  58.20) / 1M = 104.85 / 1M
   Schema:     (217×0.15  +  97×0.60) / 1M = ( 32.55 +  58.20) / 1M =  90.75 / 1M
```

---

## 2. Global Statistics

> n = 9 | Sum = $0.00723210

| Metric | Value ($) |
|---|---|
| **Mean** | 0.00080357 |
| **Min** | 0.00072925 (scenario #2, short) |
| **Max** | 0.00087490 (scenario #9, long) |
| **Sample variance** | 3.47372 × 10⁻⁹ $² |

**Variance computation:**

```
Mean = 0.00723210 / 9 = 0.000803567

Deviations (µ$):
  #1: 736.70 − 803.567 = −66.867
  #2: 729.25 − 803.567 = −74.317
  #3: 746.80 − 803.567 = −56.767
  #4: 799.00 − 803.567 =  −4.567
  #5: 799.95 − 803.567 =  −3.617
  #6: 800.95 − 803.567 =  −2.617
  #7: 871.20 − 803.567 = +67.633
  #8: 873.35 − 803.567 = +69.783
  #9: 874.90 − 803.567 = +71.333

Squared deviations (µ$²):
  4471.20 + 5523.02 + 3222.49
+   20.86 +   13.08 +    6.85
+ 4574.22 + 4869.67 + 5088.40
= 27789.79 µ$²

Sample variance = 27789.79 / (9−1) = 3473.72 µ$²
               = 3.47372 × 10⁻⁹ $²
```

---

## 3. Statistics by Input Length

| Type | Mean ($) | Min ($) | Max ($) | Sample Variance ($²) |
|---|---|---|---|---|
| **short**  | 0.00073758 | 0.00072925 | 0.00074680 | 7.75860 × 10⁻¹¹ |
| **medium** | 0.00079997 | 0.00079900 | 0.00080095 | 9.51000 × 10⁻¹³ |
| **long**   | 0.00087315 | 0.00087120 | 0.00087490 | 3.45300 × 10⁻¹² |

**Per-group variance computation:**

```
── SHORT (sum = 0.00221275, mean = 737.583 µ$) ──
  Deviations: −0.883 / −8.333 / +9.217 µ$
  Sq. dev:    0.779 + 69.439 + 84.953 = 155.171 µ$²
  Variance:   155.171 / 2 = 77.586 µ$² = 7.75860 × 10⁻¹¹ $²

── MEDIUM (sum = 0.00239990, mean = 799.967 µ$) ──
  Deviations: −0.967 / −0.017 / +0.983 µ$
  Sq. dev:    0.935 + 0.000 + 0.966 = 1.901 µ$²
  Variance:   1.901 / 2 = 0.951 µ$² = 9.51000 × 10⁻¹³ $²

── LONG (sum = 0.00261945, mean = 873.150 µ$) ──
  Deviations: −1.950 / +0.200 / +1.750 µ$
  Sq. dev:    3.803 + 0.040 + 3.063 = 6.906 µ$²
  Variance:   6.906 / 2 = 3.453 µ$² = 3.45300 × 10⁻¹² $²
```

---

## 4. 25% Safety Margin

```
Recommended_baseline = mean × 1.25
                     = 0.000803567 × 1.25
                     = 0.00100446 $
```

| Metric | Value ($) |
|---|---|
| Global mean | 0.00080357 |
| Worst case observed | 0.00087490 |
| **Recommended baseline (+25%)** | **0.00100446** |

---

## 5. Observations

### Cost sensitivity to existing action count

Gemini prompt tokens scale from ~843 (short, 1 existing action) to ~1,267 (long, 5 existing actions), a ~50% increase in input. Unlike the habit series pipeline where input size is driven by user-supplied test data, here the key driver is the series history: every previously generated action (~100 tokens per entry) is injected into the creative prompt verbatim. The long group mean ($0.00087315) is 18.4% more expensive than the short group mean ($0.00073758), driven entirely by Gemini input cost. The GPT-4o-mini passes are insensitive to the existing action count because their input is only Pass 1 candidates (~88–96 tokens), not the full series context.

### Stability of pipeline

The pipeline is highly stable. Gemini output tokens are constant at 445 across all 9 scenarios: the output structure is fully constrained to one action (name + 60–100 word description + difficulty), leaving no mechanism for output length to vary with input size. This eliminates the Gemini output cost as a variable. All within-group variance originates solely from GPT-4o-mini output fluctuations (96–108 tokens per pass), which are a minor cost component. Within-group variances are two to three orders of magnitude smaller than the global variance.

### Comparison with habit series creation

The action pipeline is a narrowed variant of the series creation pipeline:

| Parameter | Habit series creation | Action generation |
|---|---|---|
| Creative maxTokens | 900 | 500 |
| Structure maxTokens | 800 | 400 |
| Schema maxTokens | 700 | 700 |
| AI passes | 3 | 3 |
| Global mean cost | $0.00128466 | $0.00080357 |
| Reduction | — | −37.5% |

The cost reduction is driven by the smaller maxTokens budget for the creative and structure passes, and by the fundamentally smaller output target (1 action vs. a full series with multiple actions). The schema pass is identical between both pipelines.

### Reasoning token behavior

Gemini 2.5 Flash thinking tokens for this prompt class are estimated at ~350–357 per execution. This is lower than the ~860–863 measured in the habit series creation, consistent with the reduced task complexity (single action generation vs. full series design) and the lower maxTokens ceiling (500 vs. 900). As in the reference pipeline, thinking tokens represent the dominant fraction of Gemini output cost: at ~350 thinking vs. ~92 candidate tokens, thinking accounts for approximately **79%** of Gemini output tokens. The actual thinking budget for this prompt class should be verified with live instrumentation.
