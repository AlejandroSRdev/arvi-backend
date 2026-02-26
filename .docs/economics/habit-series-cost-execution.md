# Habit Series Execution Cost Analysis

> **Pipeline:** Gemini 2.5 Flash (creative) → GPT-4o-mini (structure) → GPT-4o-mini (schema)
> **Date:** 2026-02-25 | **Sample:** 9 executions (3 short / 3 medium / 3 long)

---

## Raw Token Extraction

| # | Type | Gemini prompt | Gemini candidates | Gemini thoughts | Gemini output (cand+thoughts) | Struct in | Struct out | Schema in | Schema out |
|---|------|--------------|-------------------|-----------------|-------------------------------|-----------|------------|-----------|------------|
| 1 | short  | 877  | 33 | 863 | 896 | 424 | 261 | 492 | 261 |
| 2 | short  | 877  | 36 | 860 | 896 | 428 | 222 | 453 | 222 |
| 3 | short  | 877  | 36 | 860 | 896 | 427 | 237 | 468 | 237 |
| 4 | medium | 1033 | 36 | 860 | 896 | 426 | 248 | 479 | 248 |
| 5 | medium | 1013 | 34 | 862 | 896 | 424 | 230 | 461 | 230 |
| 6 | medium | 1018 | 33 | 863 | 896 | 423 | 203 | 434 | 203 |
| 7 | long   | 1507 | 34 | 862 | 896 | 425 | 238 | 469 | 238 |
| 8 | long   | 1499 | 36 | 860 | 896 | 426 | 260 | 491 | 260 |
| 9 | long   | 1484 | 33 | 863 | 896 | 422 | 203 | 434 | 203 |

> **Note:** No token data is missing. All 9 executions are valid and included in all calculations.

---

## Pricing Applied

| Model | Input (USD / 1M tokens) | Output (USD / 1M tokens) |
|---|---|---|
| Gemini 2.5 Flash | 0.35 | 0.53 |
| GPT-4o-mini | 0.15 | 0.60 |

```
Gemini_cost   = (prompt × 0.35 + output × 0.53) / 1_000_000
Structure_cost = (struct_in × 0.15 + struct_out × 0.60) / 1_000_000
Schema_cost    = (schema_in × 0.15 + schema_out × 0.60) / 1_000_000
Total          = Gemini_cost + Structure_cost + Schema_cost
```

---

## 1. Cost Per Execution (All Runs)

| # | Type | Gemini cost ($) | Structure cost ($) | Schema cost ($) | **Total cost ($)** |
|---|------|----------------:|-------------------:|----------------:|-------------------:|
| 1 | short  | 0.00078183 | 0.00022020 | 0.00023040 | **0.00123243** |
| 2 | short  | 0.00078183 | 0.00019740 | 0.00020115 | **0.00118038** |
| 3 | short  | 0.00078183 | 0.00020625 | 0.00021240 | **0.00120048** |
| 4 | medium | 0.00083643 | 0.00021270 | 0.00022065 | **0.00126978** |
| 5 | medium | 0.00082943 | 0.00020160 | 0.00020715 | **0.00123818** |
| 6 | medium | 0.00083118 | 0.00018525 | 0.00018690 | **0.00120333** |
| 7 | long   | 0.00100233 | 0.00020655 | 0.00021315 | **0.00142203** |
| 8 | long   | 0.00099953 | 0.00021990 | 0.00022965 | **0.00144908** |
| 9 | long   | 0.00099428 | 0.00018510 | 0.00018690 | **0.00136628** |

**Cost computation detail (intermediate values, not rounded):**

```
#1 Gemini:    (877×0.35 + 896×0.53) / 1M = (306.95 + 474.88) / 1M = 781.83 / 1M
   Structure: (424×0.15 + 261×0.60) / 1M = ( 63.60 + 156.60) / 1M = 220.20 / 1M
   Schema:    (492×0.15 + 261×0.60) / 1M = ( 73.80 + 156.60) / 1M = 230.40 / 1M

#2 Gemini:    (877×0.35 + 896×0.53) / 1M = 781.83 / 1M
   Structure: (428×0.15 + 222×0.60) / 1M = ( 64.20 + 133.20) / 1M = 197.40 / 1M
   Schema:    (453×0.15 + 222×0.60) / 1M = ( 67.95 + 133.20) / 1M = 201.15 / 1M

#3 Gemini:    (877×0.35 + 896×0.53) / 1M = 781.83 / 1M
   Structure: (427×0.15 + 237×0.60) / 1M = ( 64.05 + 142.20) / 1M = 206.25 / 1M
   Schema:    (468×0.15 + 237×0.60) / 1M = ( 70.20 + 142.20) / 1M = 212.40 / 1M

#4 Gemini:    (1033×0.35 + 896×0.53) / 1M = (361.55 + 474.88) / 1M = 836.43 / 1M
   Structure: (426×0.15 + 248×0.60) / 1M = ( 63.90 + 148.80) / 1M = 212.70 / 1M
   Schema:    (479×0.15 + 248×0.60) / 1M = ( 71.85 + 148.80) / 1M = 220.65 / 1M

#5 Gemini:    (1013×0.35 + 896×0.53) / 1M = (354.55 + 474.88) / 1M = 829.43 / 1M
   Structure: (424×0.15 + 230×0.60) / 1M = ( 63.60 + 138.00) / 1M = 201.60 / 1M
   Schema:    (461×0.15 + 230×0.60) / 1M = ( 69.15 + 138.00) / 1M = 207.15 / 1M

#6 Gemini:    (1018×0.35 + 896×0.53) / 1M = (356.30 + 474.88) / 1M = 831.18 / 1M
   Structure: (423×0.15 + 203×0.60) / 1M = ( 63.45 + 121.80) / 1M = 185.25 / 1M
   Schema:    (434×0.15 + 203×0.60) / 1M = ( 65.10 + 121.80) / 1M = 186.90 / 1M

#7 Gemini:    (1507×0.35 + 896×0.53) / 1M = (527.45 + 474.88) / 1M = 1002.33 / 1M
   Structure: (425×0.15 + 238×0.60) / 1M = ( 63.75 + 142.80) / 1M = 206.55 / 1M
   Schema:    (469×0.15 + 238×0.60) / 1M = ( 70.35 + 142.80) / 1M = 213.15 / 1M

#8 Gemini:    (1499×0.35 + 896×0.53) / 1M = (524.65 + 474.88) / 1M = 999.53 / 1M
   Structure: (426×0.15 + 260×0.60) / 1M = ( 63.90 + 156.00) / 1M = 219.90 / 1M
   Schema:    (491×0.15 + 260×0.60) / 1M = ( 73.65 + 156.00) / 1M = 229.65 / 1M

#9 Gemini:    (1484×0.35 + 896×0.53) / 1M = (519.40 + 474.88) / 1M = 994.28 / 1M
   Structure: (422×0.15 + 203×0.60) / 1M = ( 63.30 + 121.80) / 1M = 185.10 / 1M
   Schema:    (434×0.15 + 203×0.60) / 1M = ( 65.10 + 121.80) / 1M = 186.90 / 1M
```

---

## 2. Global Statistics

> n = 9 | Sum = $0.01156197

| Metric | Value ($) |
|---|---|
| **Mean** | 0.00128466 |
| **Min** | 0.00118038 (execution #2, short) |
| **Max** | 0.00144908 (execution #8, long) |
| **Sample variance** | 1.02814019 × 10⁻⁸ $² |

**Variance computation:**

```
Mean = 0.01156197 / 9 = 0.001284663333...

Deviations (µ$):
  #1: 1232.43 − 1284.663333 = −52.233333
  #2: 1180.38 − 1284.663333 = −104.283333
  #3: 1200.48 − 1284.663333 = −84.183333
  #4: 1269.78 − 1284.663333 = −14.883333
  #5: 1238.18 − 1284.663333 = −46.483333
  #6: 1203.33 − 1284.663333 = −81.333333
  #7: 1422.03 − 1284.663333 = +137.366667
  #8: 1449.08 − 1284.663333 = +164.416667
  #9: 1366.28 − 1284.663333 = +81.616667

Squared deviations (µ$²):
  2728.321111 + 10875.013611 + 7086.833611
+ 221.513611  +  2160.700278 + 6615.111111
+ 18869.601111 + 27032.840278 + 6661.280278
= 82251.215000 µ$²

Sample variance = 82251.215000 / (9−1) = 10281.401875 µ$²
               = 1.02814019 × 10⁻⁸ $²
```

---

## 3. Statistics by Input Length

| Type | Mean ($) | Min ($) | Max ($) | Sample Variance ($²) |
|---|---|---|---|---|
| **short**  | 0.00120443 | 0.00118038 | 0.00123243 | 6.89002500 × 10⁻¹⁰ |
| **medium** | 0.00123710 | 0.00120333 | 0.00126978 | 1.10478083 × 10⁻⁹  |
| **long**   | 0.00141246 | 0.00136628 | 0.00144908 | 1.78260099 × 10⁻⁹  |

**Per-group variance computation:**

```
── SHORT (sum = 0.00361329, mean = 1204.43 µ$) ──
  Deviations: +28.00 / −24.05 / −3.95 µ$
  Sq. dev:    784.0000 + 578.4025 + 15.6025 = 1378.0050 µ$²
  Variance:   1378.0050 / 2 = 689.0025 µ$² = 6.89002500 × 10⁻¹⁰ $²

── MEDIUM (sum = 0.00371129, mean = 1237.0967 µ$) ──
  Deviations: +32.6833 / +1.0833 / −33.7667 µ$
  Sq. dev:    1068.2001 + 1.1736 + 1140.1880 = 2209.5617 µ$²
  Variance:   2209.5617 / 2 = 1104.7808 µ$² = 1.10478083 × 10⁻⁹ $²

── LONG (sum = 0.00423739, mean = 1412.4633 µ$) ──
  Deviations: +9.5667 / +36.6167 / −46.1833 µ$
  Sq. dev:    91.5212 + 1340.7805 + 2132.9003 = 3565.2020 µ$²
  Variance:   3565.2020 / 2 = 1782.6010 µ$² = 1.78260099 × 10⁻⁹ $²
```

---

## 4. 25% Safety Margin

```
Recommended_baseline = mean × 1.25
                     = 0.001284663333 × 1.25
                     = 0.00160583 $
```

| Metric | Value ($) |
|---|---|
| Global mean | 0.00128466 |
| **Recommended baseline (+25%)** | **0.00160583** |

---

## 5. Observations

### Cost sensitivity to input size

Gemini prompt tokens scale from 877 (short) to ~1,500 (long), a ~71% increase in input. However, because GPT-4o-mini output tokens vary independently of input length (ranging 203–261 across all 9 runs), the relationship between input size and total cost is not strictly monotonic at the execution level. At the group level, the effect is clear: the long group mean ($0.00141246) is 17.3% more expensive than the short group mean ($0.00120443), driven entirely by Gemini input cost.

### Stability of pipeline

The pipeline is highly stable. Within-group variances are two orders of magnitude smaller than the global variance (which captures the between-group input-size effect). The Gemini pass is the most stable component: output tokens are exactly 896 in all 9 executions. The GPT-4o-mini passes introduce the only intra-group variation, through fluctuations in response length (203–261 output tokens per pass).

### Highest observed execution impact

Execution #8 (long) produced the highest cost at $0.00144908. Contributing factors: 1,499 Gemini input tokens (2nd highest in dataset) and 260 GPT-4o-mini output tokens per pass (highest GPT output observed in the long group).

### Reasoning token impact anomaly

Gemini 2.5 Flash produced exactly **896 total output tokens** (candidatesTokenCount + thoughtsTokenCount) in all 9 executions without exception. Internal thinking tokens (thoughtsTokenCount) ranged 860–863 and visible candidates (candidatesTokenCount) ranged 33–36, but they consistently summed to 896. This indicates a fixed thinking budget being applied to this prompt class. Thinking tokens account for **96.0–96.4%** of all Gemini output tokens, meaning Gemini output cost is effectively a fixed constant across all input sizes. Cost scaling in this pipeline is therefore governed **exclusively** by Gemini input volume and GPT-4o-mini response length — not by Gemini reasoning depth.
