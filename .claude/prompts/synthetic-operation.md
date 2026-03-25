SYNTHETIC OPERATION TASK

You are executing a synthetic monitoring design task.

This task defines EXACTLY what must be designed.
Do not reinterpret, expand, or modify the scope.

--------------------------------------------------

OBJECTIVE

Design the initial synthetic monitoring runners for the core backend flows.

The goal is to simulate real user behavior against a live backend system
and validate functional correctness of the domain.

This is NOT a load test.
This is NOT a generic script.
This is controlled execution of real flows.

--------------------------------------------------

SCENARIOS (FIXED SCOPE)

You must design EXACTLY these three scenarios:

1) USER 1 — FULL FLOW
- register
- create habit series
- create action on that series

2) USER 2 — EXISTING STATE USAGE
- login
- create action on an already existing series

3) USER 3 — DESTRUCTIVE FLOW
- login
- delete an existing series
- create a new series

No additional scenarios are allowed.

--------------------------------------------------

STATE MODEL

- Users are independent (Model A)
- State sharing is ONLY allowed through explicitly stored identifiers:
  - seriesId
- No implicit shared state
- No hidden dependencies

User 2 and User 3 MUST use a series created previously by User 1.

--------------------------------------------------

EXECUTION MODEL

- Execution must be sequential (no concurrency)
- Each scenario must be reproducible
- Each step must be explicitly defined

--------------------------------------------------

CONSTRAINTS

- No mocks — assume real HTTP interaction
- No external abstractions or frameworks
- No system redesign
- No feature additions
- Follow minimal viable design

--------------------------------------------------

VALIDATION REQUIREMENTS

Each step MUST include:

1) Technical validation:
- HTTP status
- response structure

2) Business validation:
- series exists after creation
- action is correctly linked to series
- deleted series is no longer accessible
- new series is correctly created after deletion

--------------------------------------------------

FAILURE DETECTION

You must explicitly define how to detect:

- invalid series access
- missing or corrupted state
- partial writes
- inconsistent responses

--------------------------------------------------

DELIVERABLES

You must produce:

1) Scenario definitions
- Step-by-step per user

2) Context structure
- Stored data (tokens, IDs)
- How state flows between scenarios

3) Runner design (Node.js)
- Function per user
- Clear execution flow (sequential)

4) Validation strategy
- Technical + business validation

5) Failure cases
- Clearly defined and detectable

6) Execution notes
- How to run the runner
- Expected successful outcome

--------------------------------------------------

OUTPUT RULES

- No explanations outside structure
- No placeholders
- No vague descriptions
- No skipped validations
- No assumptions unless explicitly stated

--------------------------------------------------

EXECUTION STANDARD

Precision over completeness.
Clarity over abstraction.
Determinism over flexibility.

Design only what is required.
Nothing more.