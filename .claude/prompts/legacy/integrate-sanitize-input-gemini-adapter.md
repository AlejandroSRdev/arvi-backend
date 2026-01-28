# Integrate input sanitation into Gemini adapter

## Objective

Integrate the existing `sanitizeUserInput` pipeline into the **Gemini adapter only**.

The Gemini adapter is the **only boundary where raw user input enters the system**.
The OpenAI adapter MUST NOT be modified.

---

## Context

- Architecture: Hexagonal (Ports & Adapters)
- Language: JavaScript (Node.js)
- The sanitation pipeline already exists at:

  application/input/sanitizeUserInput.js

- Gemini adapter location:

  infrastructure/ai/gemini/GeminiAdapter.js

- Gemini adapter:
  - receives raw user input
  - calculates tokens
  - converts tokens to energy
  - calls the Gemini LLM

- OpenAI adapter:
  - receives only internal, structured output
  - NEVER receives raw user input
  - MUST remain untouched

---

## Constraints (NON-NEGOTIABLE)

- Modify **ONLY**:
infrastructure/ai/gemini/GeminiAdapter.js


- Do NOT modify:
- OpenAI adapter
- controllers
- use-cases
- domain
- sanitation module

- Do NOT move logic between layers.
- Do NOT introduce new abstractions.
- Keep the adapter thin.

---

## What to implement

1. Import the sanitation function:
sanitizeUserInput

from:
application/input/sanitizeUserInput.js


2. Ensure that:
- Raw user input is passed through `sanitizeUserInput`
- Sanitization happens **BEFORE**:
  - token counting
  - energy calculation
  - prompt construction
  - Gemini API invocation

3. The adapter must:
- call the sanitation pipeline
- NOT implement sanitation logic itself

4. The external behavior of the system must remain the same,
except that input is now validated, cleaned and normalized.

---

## Output expectations

- Show the updated `GeminiAdapter.js`
- Keep changes minimal and explicit
- No refactors unrelated to sanitation
- No changes to function signatures unless strictly necessary
- Code must remain readable and intention-revealing

This change must clearly express that **input sanitation is applied at the system boundary**,
not globally and not inside the domain.