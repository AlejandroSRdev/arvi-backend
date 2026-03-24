CRITICAL IMPLEMENTATION PROMPT GUIDE

This guide defines how implementation prompts must be written.

It is mandatory for any planning agent before generating an implementation task.

---

OBJECTIVE

Ensure that every implementation prompt is:

- precise
- bounded
- executable without ambiguity

---

REQUIRED STRUCTURE

Every implementation prompt MUST define:

1) PURPOSE
- What is being implemented
- Why it is needed (functional goal, not explanation)

2) SCOPE
- What is INCLUDED
- What is EXCLUDED (explicit boundaries)

3) FILES
- Exact files to modify or create
- Use full relative paths
- Do not leave this implicit

4) REQUIREMENTS
- Functional behavior expected
- Constraints to respect
- System rules to follow

5) NON-GOALS
- What must NOT be done
- Prevent unintended changes

6) DELIVERABLES
- What the implementer must return
  (files, code, verification steps, etc.)

---

RULES

- No vague language ("improve", "handle", "optimize")
- No implicit scope
- No undefined files
- No mixing planning with implementation
- No overengineering instructions

---

QUALITY STANDARD

A valid implementation prompt must:

- be executable without clarification
- not require interpretation
- minimize decision-making during execution

---

FINAL DIRECTIVE

If the prompt leaves room for interpretation,
it is not ready.

Refine it until execution becomes deterministic.