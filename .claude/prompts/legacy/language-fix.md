You are acting as a senior backend & AI engineer with strong experience in LLM prompt orchestration.

Context:
I have a Node.js backend using Hexagonal Architecture (Ports & Adapters).
There is an endpoint that generates a habit series using a 3-pass LLM flow.

The endpoint works correctly, but there is ONE remaining issue:
When the request includes `"language": "en"`, the LLM output is still generated in Spanish.

After analysis, the root cause is NOT language normalization.
The real issue is prompt orchestration and system message hierarchy.

Specifically:
- The first pass prompt factory (`CreativeHabitSeriesPrompt`) currently returns TWO `system` messages:
  1) One with `assistantContext`
  2) One with the actual language-dependent system prompt
- The first `system` message has higher semantic authority.
- `assistantContext` may be empty or contain prior messages in Spanish.
- This causes the model to inherit Spanish as the output language, even when the prompt itself is in English.

Your task:
Fix this issue **correctly and cleanly**, without redesigning the architecture.

Strict constraints:
- DO NOT modify the domain.
- DO NOT modify schemas.
- DO NOT change the conceptual content of the prompt.
- DO NOT add translation layers or post-processing.
- DO NOT rely on “implicit” language behavior.
- DO NOT add more system messages.

What you MUST do:
- Ensure that the language selected via `params.language` is enforced as a hard constraint.
- Eliminate ambiguity in system message authority.
- Preserve the assistantContext content.
- Ensure that all generated content (title, description, actions) respects the requested language.

Expected architectural solution:
- There must be **a single authoritative `system` message**.
- `assistantContext` should be merged into the main system prompt in a deterministic way.
- The language constraint must be fixed at the very first pass and not be overridden later.

Deliverables:
1. Updated version of `CreativeHabitSeriesPrompt.js` with the fix applied.
2. A brief explanation (2–4 paragraphs) explaining:
   - Why the previous approach caused language drift
   - Why the new approach correctly enforces language
   - Why this solution is robust for multi-pass LLM flows

Focus on correctness, clarity, and professional-grade prompt orchestration.