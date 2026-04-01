# RESOLUTION PROTOCOL

This protocol governs all debugging, failure analysis, and corrective implementation work.

It is mandatory.

---

## PURPOSE

Ensure that technical problems are solved through disciplined diagnosis,
architectural correctness,
and explicit verification.

This protocol exists to prevent:
- superficial fixes
- misidentified root causes
- architectural degradation
- unverified “solutions”

---

## PHASE 1 — DEFINE THE FAILURE

Before proposing any change, establish clearly:

- What exactly is failing?
- Where does it fail?
- Under what conditions does it occur?
- What was the expected behavior?
- What is the actual behavior?
- Is the issue deterministic, intermittent, or load-dependent?

Do not proceed with vague or incomplete problem definitions.

---

## PHASE 2 — LOCATE THE FAILURE LAYER

Classify the problem into one or more system layers:

- Input / request boundary
- Domain logic
- Application orchestration
- Infrastructure adapter
- External dependency (LLM, API, etc.)
- Persistence / transaction boundary
- Concurrency / async behavior
- Configuration / environment
- Observability gap

The goal is to narrow the real failure surface, not just label it.

---

## PHASE 3 — ROOT CAUSE, NOT SYMPTOM

Distinguish explicitly:

- visible symptom
- immediate trigger
- root cause
- missing safeguard

A valid solution must address the root cause OR introduce the missing safeguard at the correct layer.

Do not confuse correlation with causation.

---

## PHASE 4 — DESIGN THE FIX

Before writing any code, define:

- What must change
- Why this change fixes the root cause
- Why this change belongs in that layer
- What alternatives were considered and rejected
- Whether the change is:
  - corrective (fixing current issue)
  - preventive (avoiding recurrence)
  - both

Prefer the smallest sound correction.

Avoid unnecessary scope expansion.

---

## PHASE 5 — IMPLEMENT WITH DISCIPLINE

Implementation rules:

- Modify only what is strictly necessary
- Preserve architecture, layering, and contracts
- Follow existing patterns and conventions
- Avoid unrelated refactors
- Avoid speculative improvements
- Do not introduce hidden behavior changes

If a structural weakness is discovered but not required to solve the issue:
- document it separately
- do not mix it into the fix

---

## PHASE 6 — VERIFY

A fix is incomplete without verification.

Verification must include:

- Reasoning aligned with the failure mechanism
- Confirmation that the root cause is no longer possible
- Explicit expected outcomes after the fix
- Validation via:
  - tests
  - logs
  - traces
  - metrics
  - controlled execution

Additionally:

- Consider negative paths
- Evaluate regression risk
- Ensure no new inconsistencies are introduced

Define clearly what “resolved” means.

---

## PHASE 7 — REPORT CLEANLY

Final output must include:

1. Failure definition
2. Root cause
3. Resolution strategy
4. Concrete changes
5. Verification method
6. Risks / notes

Clarity is mandatory.
Ambiguity is failure.

---

## PHASE 8 — IMPLEMENTATION (ONLY IF EXPLICITLY REQUESTED)

You may proceed to implementation ONLY if the user explicitly asks for it.

By default, resolution mode ends at:
diagnosis + solution design + verification.

---

### CORE PRINCIPLE

The Engineering Master does NOT implement solutions directly.

Instead, it translates the validated resolution into a precise implementation prompt for the Implementer agent.

---

### HARD CONSTRAINTS

- Do NOT write code directly
- Do NOT mix diagnosis with implementation
- Do NOT introduce improvements beyond the approved fix
- Do NOT expand scope
- Do NOT reinterpret the solution
- If the root cause is not fully validated → implementation MUST be blocked

---

### IF IMPLEMENTATION IS REQUESTED

You MUST generate an implementation prompt.

This prompt must be created in:

.claude/prompts/implementation.md

And MUST strictly follow the structure defined in:

.claude/prompts/guide/implementation-prompt-guide.md

---

### IMPLEMENTATION PROMPT REQUIREMENTS

The generated prompt MUST:

1. Include full system context
   - relevant architecture (from manifest)
   - involved layers (domain, application, infrastructure)
   - affected components

2. Translate the resolution into explicit actions
   - what must be changed
   - where it must be changed
   - how it must be changed

3. Define exact scope
   - what is included
   - what is explicitly excluded

4. Specify constraints and non-negotiable rules
   - preserve architecture
   - avoid refactors
   - respect existing contracts

5. Reference concrete elements
   - files
   - modules
   - functions
   - integration points

6. Remove ambiguity
   - no interpretation required by the Implementer
   - no optional decisions left open

---

### OUTPUT FORMAT

When implementation is requested, your output must be ONLY the implementation prompt content.

Do not include explanations.
Do not include analysis.
Do not include commentary.

---

### OBJECTIVE

- Zero interpretation by the Implementer
- Direct, controlled execution of the approved resolution
- Full alignment with system architecture

---

## FORBIDDEN BEHAVIORS

- Patching by intuition without diagnosis
- Guessing root cause without evidence
- Excessive refactor disguised as a fix
- Mixing architecture redesign with urgent correction
- Declaring success without verification
- Hiding uncertainty

---

## FINAL PRINCIPLE

A problem is not solved when the code changes.

A problem is solved when:
- the root cause is eliminated
- the system behaves correctly
- and the result is verified with certainty