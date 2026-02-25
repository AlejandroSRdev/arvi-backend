# AI in Production — Engineering Log  
**Date:** 2026-02-25  
**Project:** Habit Series Pipeline  

---

## Context

Today’s focus was not on adding new features, but on tightening the economic understanding of the AI pipeline running in production.

The system currently generates structured thematic habit series through a three-pass pipeline:

1. **Creative generation** (Gemini 2.5 Flash)  
2. **Structure + light validation** (GPT-4o-mini)  
3. **Strict JSON schema enforcement** (GPT-4o-mini)  

It is deployed on Render and connected to Google Play internal testing. The feature works. The question now is not “does it work?”, but:

> **How much does it really cost per execution?**

Before activating monetization, I need a precise and defendable cost baseline.

---

## Why This Phase Matters

There is a difference between integrating AI and operating AI.

During the MVP phase, token usage was estimated heuristically using:

```
tokens ≈ text.length / 3.7
```

That was acceptable when modeling internal energy consumption and simulating domain behavior. It is not acceptable when real money is involved.

If pricing decisions are based on approximations rather than real usage metadata, the unit economics become fiction.  

This phase is about **eliminating fiction**.

---

## Replacing Token Estimation with Real Accounting

The first major change was extracting `usageMetadata` from Gemini responses instead of estimating tokens manually.

### A Representative Example from Production

```json
{
  "promptTokenCount": 877,
  "candidatesTokenCount": 36,
  "totalTokenCount": 1773,
  "thoughtsTokenCount": 860
}
```

At first glance, this looks inconsistent:

- `877` (prompt) + `36` (visible output) ≠ `1773` (total).  

The missing piece is `thoughtsTokenCount`.  

Gemini internally generated **860 reasoning tokens**. Those tokens are not visible in the response, but they are billed.  

This was an important discovery. The real cost is determined by:

```
totalTokenCount, not by visible prompt + response.
```

From now on, all economic calculations use:

```
cost = totalTokenCount × model_price
```

No reconstruction. No manual summation. No heuristics. The provider’s total token count is the **source of truth**.

---

## Separating Product Logic from Economic Logic

I made a conscious architectural decision not to change the internal “energy” system.  

- **Energy** remains a product-level mechanic. It is a domain abstraction, not a billing metric.  
- **Token accounting** is now used strictly for economic modeling.  

This separation avoids coupling UX stability to provider-level pricing fluctuations.  

In other words:  

- **Energy governs user experience.**  
- **Tokens govern financial sustainability.**  

These are related, but not identical.

---

## Prompt Reinforcement and Its Economic Impact

Earlier in development, creative outputs were too short. The issue was not `maxTokens`, but under-specified instructions.  

I reinforced the creative prompt by:  

- Enforcing minimum word ranges (150–190 words for description).  
- Requiring 60–100 words per action.  
- Strengthening system role definition.  
- Clarifying density expectations.  
- Slightly adjusting temperature.  

### Results

The result: longer and more consistent outputs.  

However, an important side effect emerged:  

- **Internal reasoning tokens increased significantly.**  

The cost of creative control is internal computation.  

This is a direct trade-off between:  

1. **Narrative depth and structural consistency**  
2. **Economic efficiency**  

This relationship will be evaluated through controlled sampling.

---

## Sampling Strategy for Cost Measurement

The objective is to calculate a reliable average cost per generated series.  

### Current Approach

- **3 executions with short input**  
- **3 with medium input**  
- **3 with long input**  

Rather than over-sampling, I am prioritizing:  

- **Mean cost**  
- **Observed peak**  
- **Safety multiplier (~25%)**  

This gives a practical economic reference without delaying progress.  

If variance proves high, sampling will be expanded.

---

## External Provider Instability

During production testing, the following error occurred:

```
503 Service Unavailable
This model is currently experiencing high demand.
```

This was not related to quota, API keys, or prompt structure. It was pure **provider saturation**.  

### Key Operational Milestone

When running AI in production, instability is not hypothetical. It is expected.  

The immediate plan is minimal resilience:  

- Limited retry  
- Small exponential backoff  
- No overengineering  

The goal is **controlled robustness**, not distributed systems complexity.

---

## Key Lessons from Today

- **Visible output size does not equal cost.**  
- **Internal reasoning tokens can represent a large portion of total billing.**  
- **Provider metadata must be trusted over local reconstruction.**  
- **Economic governance must be separated from UX abstractions.**  
- **Production AI includes provider instability as a normal condition.**

---

## Strategic Direction

The current phase is not about building more features.  

It is about ensuring that:  

1. Each AI pass is economically measurable.  
2. The full pipeline cost is known.  
3. Pricing can be derived from real data.  
4. Margin is defensible.  
5. The system is resilient to provider volatility.  

The transition happening here is subtle but critical.