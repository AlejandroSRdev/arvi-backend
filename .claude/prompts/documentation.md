You will execute a structured backend documentation pipeline.

Follow the pipeline exactly as described.

Do not skip steps.
Do not merge responsibilities.
Do not generate documentation directly unless a specialized agent requires it.

------------------------------------------------
PIPELINE OVERVIEW
------------------------------------------------

The documentation process follows this sequence:

1) Context enrichment using the architectural manifest
2) Documentation orchestration
3) Specialized documentation generation

Agents involved:

Step 1
Context Enricher
.claude/agents/leaders/context-enricher.md

Step 2
Endpoint Documentation Orchestrator
.claude/agents/leaders/endpoint-documentation-orchestrator.md

Step 3
Specialized documentation agents invoked by the orchestrator:

.claude/agents/workers/documenters/mermaid-documenter.md  
.claude/agents/workers/documenters/openapi-documenter.md  
.claude/agents/workers/documenters/system-overview-documenter.md

------------------------------------------------
ARCHITECTURAL SOURCE OF TRUTH
------------------------------------------------

The architecture of the backend is defined in:

.claude/manifest.md

The manifest is the authoritative architectural document.

Rules:

• Treat the manifest as the source of truth.
• Use it to interpret layer responsibilities.
• Use it to validate execution flow.
• Never contradict it.

Code inspection may be used only to confirm implementation details.

Architecture must never be inferred from code alone.

------------------------------------------------
STEP 1 — CONTEXT ENRICHMENT
------------------------------------------------

Send the endpoint specification to:

.claude/agents/leaders/context-enricher.md

That agent must:

• Read the architectural manifest
• Align the endpoint flow with system layers
• Produce an enriched endpoint context

The enriched context will include:

Endpoint  
Purpose  
Actors  
Execution Flow (layer-aware)  
Request  
Response  
Side Effects  
Architecture Notes

------------------------------------------------
STEP 2 — DOCUMENTATION ORCHESTRATION
------------------------------------------------

Send the enriched context to:

.claude/agents/leaders/endpoint-documentation-orchestrator.md

That agent will:

• Prepare inputs for specialized documenters
• Invoke the documentation workers
• Collect the outputs

------------------------------------------------
STEP 3 — DOCUMENTATION GENERATION
------------------------------------------------

The orchestrator will invoke:

Mermaid documenter  
OpenAPI documenter  
System overview documenter

Each agent will produce a specific artifact.

------------------------------------------------
FINAL OUTPUT
------------------------------------------------

Return the documentation in the following structure:

----------------------------------------

SYSTEM_OVERVIEW

----------------------------------------

OPENAPI_SPEC

----------------------------------------

MERMAID_DIAGRAM

----------------------------------------

Do not add commentary.

Do not modify agent outputs.

------------------------------------------------
ENDPOINT SPECIFICATION
------------------------------------------------

Below is the endpoint specification to document: 

POST /api/billing/create-checkout-session