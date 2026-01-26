# Create sanitizeUserInput pipeline (application layer)

## Objective

Create a new reusable input sanitation and normalization pipeline in the **application layer**.

This pipeline will be responsible for validating, cleaning and normalizing **raw user input strings**
*before* any token counting, energy calculation or LLM invocation occurs.

This is **not** an AI pipeline.
This is **input hygiene at the system boundary**.

---

## Constraints (NON-NEGOTIABLE)

- Language: **JavaScript**
- Runtime: **Node.js**
- Architecture: **Hexagonal**
- Location:  
  `application/input/sanitizeUserInput.js`

- Do NOT introduce:
  - vendor-specific logic
  - framework code
  - business logic
  - side effects

- Do NOT refactor unrelated files.
- Do NOT change adapters yet.
- This task is ONLY to create the sanitation module.

---

## What to implement

### 1. Create a new file

**Path:**
application/input/sanitizeUserInput.js


---

### 2. Export a single function

```js
sanitizeUserInput(rawInput)
This function must be:

synchronous

pure

deterministic

reusable by any adapter (OpenAI, Gemini, future ones)

3. Sanitation pipeline (ORDER IS STRICT)
The function must apply the following steps in this exact order:

Step 1 — Type validation
If rawInput is NOT a string:

throw an explicit error

error message must clearly indicate invalid input type

Step 2 — Cleaning
Remove leading and trailing whitespace

Collapse excessive internal whitespace into a single space

Step 3 — Normalization
Convert the entire string to lowercase

No additional transformations.
No NLP.
No heuristics.

4. Example behavior (for clarity)
Input:

"   Quiero   ENTRENAR   FUERZA   "
Output:

"quiero entrenar fuerza"
Output expectations
Only create the new file.

Include clear inline comments explaining each step.

Keep the code explicit and readable.

No over-engineering.

No abstractions beyond what is required.

This module represents production-grade backend hygiene, not experimentation.