# Task Prompt — Import Consistency Review Across Endpoints

## Objective

Your task is to **systematically review all API endpoints** in the project and **guarantee that every import used by those endpoints is coherent with the current file structure and exported signatures**.

The sole goal of this task is to **eliminate import-related inconsistencies that break build, deployment, or runtime execution**.

Nothing else.

---

## Scope (Strict)

You must limit your work to:

- files that define or wire **HTTP endpoints** (controllers, routes, handlers)
- the **imports used by those files**, directly or indirectly
- fixing **incorrect, outdated, or inconsistent import paths or signatures**

You must **not** analyze or modify unrelated parts of the system.

---

## What “Coherent Imports” Means

An import is considered coherent if and only if:

- the target file **exists** at the referenced path
- the imported symbol **is actually exported** by that file
- the import style matches the module system in use
- the imported name matches the real exported name
- there is no mismatch between default vs named imports
- there is no leftover import from previous refactors

If any of these conditions fail, it is a **blocking issue**.

---

## What You Are Allowed to Change

You may ONLY:

- update import paths
- update imported symbol names
- switch between default and named imports if required
- remove unused or invalid imports
- point imports to the correct existing file

All changes must be **minimal and local**.

---

## What You Must NOT Change

You must NOT:

- change business logic
- change function bodies
- refactor architecture
- rename files or directories
- introduce new files
- introduce new dependencies
- change endpoint behavior or contracts
- “clean up” code that is not breaking imports

If a fix requires more than adjusting imports, **stop and report it**.

---

## Method (Mandatory)

Follow this exact sequence:

### 1. Identify Endpoints
Locate all files responsible for defining or handling API endpoints.

### 2. Trace Imports
For each endpoint file:
- list all imports
- resolve each import against the current repository structure
- verify the exported symbols at the target file

### 3. Detect Inconsistencies
Flag any import that:
- points to a non-existent path
- imports a non-exported symbol
- mismatches default vs named exports
- uses outdated paths after refactors
- is unused or invalid

### 4. Apply Minimal Fixes
For each issue:
- adjust the import to the correct existing path or export
- do not touch anything else

---

## Output Format

For every change, output in the following format:

FILE: <file path>

ISSUE:
<brief description of the import inconsistency>

CHANGE:
<exact import line(s) before>

→

<exact import line(s) after>


If no fix is possible without changing non-import code, output:

BLOCKER:
<description of why this cannot be fixed via imports only>


---

## Completion Criteria

The task is complete when:

- all endpoint-related imports are coherent
- no import errors remain that would block build or deployment
- no unnecessary files or code were analyzed

---

## Priority Rule

Speed and precision matter more than completeness.

You are optimizing for:
> **Fast restoration of a deployable system by fixing import inconsistencies only.**

If in doubt, stop and ask for clarification rather than making assumptions.