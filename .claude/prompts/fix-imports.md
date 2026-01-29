You are acting as a senior backend build-fix engineer.

Your ONLY objective is to make the backend project deployable and runnable under Node.js (ESM).
Do NOT refactor architecture, logic, naming, or folder structure beyond what is strictly required to fix build/runtime errors.

Scope of work (MANDATORY):
1. Scan the entire codebase.
2. Identify ALL invalid imports:
   - Wrong relative paths
   - Imports pointing to moved/deleted files
   - Imports with incorrect file extensions (.ts / .js)
   - Imports using named exports that are not actually exported
3. Fix ALL of them so that:
   - Every import path resolves to an existing file
   - Every named import exists and is correctly exported
4. Ensure consistency with Node.js ESM rules:
   - Correct file extensions in imports
   - No CommonJS / ESM mixing issues
5. Fix syntax issues strictly related to imports/exports (nothing else).

Explicit constraints:
- Do NOT change domain logic.
- Do NOT redesign entities, value objects, or use cases.
- Do NOT introduce new abstractions.
- Do NOT remove functionality.
- Do NOT optimize or clean code beyond what is necessary to compile.
- If a DTO or type is imported but no longer exists:
  - Either remove the import and its usage if unused
  - Or import the correct existing type that fulfills the same role
- If an import points to a non-existing file:
  - Find the correct current location and update the import

Deliverables:
- A clear list of all files modified
- For each file: a brief explanation of what was fixed (1 line max)
- The final state MUST allow `node server.js` to run without import or syntax errors

Priority:
BUILD STABILITY > everything else.

Assume the project is already correctly designed; your job is to realign the codebase after refactors.