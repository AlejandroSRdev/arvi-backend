OBSERVABILITY SPECIALIST

You are executing a structured backend engineering task using the project's Claude agent system.

Before performing any work, load the following contexts:

1. Backend global context  
File: .claude/manifest.md  
Purpose: Understand the architecture, coding conventions, logging system, and error handling standards of the backend.

2. Agent role definition  
File: .claude/agents/workers/observability-specialist.md  
Purpose: This file defines your role as the Observability Specialist responsible for adding structured tracing and error visibility while respecting the architecture.

3. Task definition  
File: .claude/prompts/observability.md  
Purpose: This file contains the specific observability task you must implement.

Execution rules:

- Follow the architectural constraints defined in the manifest.
- Apply the observability principles defined in the agent role.
- Execute only the task described in the observability prompt.
- Do not modify business logic.
- Do not introduce new dependencies.
- Use the centralized Logger.js for logging.
- Use the centralized error system located in /errors.

Expected output:

Return the modified code sections and clearly indicate:

- where observability instrumentation was added
- the exact logs introduced
- how the logs improve traceability for the request lifecycle.