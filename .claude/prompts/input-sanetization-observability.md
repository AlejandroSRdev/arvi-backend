You are acting as a senior backend observability engineer.

Task scope (STRICT):
- Modify ONLY this file:
  /application/input/SanitizeUserInput.js
- Do NOT touch any other files.

Objective:
Add explicit runtime logging to trace whether the user input has been normalized during execution.

Logging requirements (MANDATORY):

1. Add a log for the SUCCESS case:
   - When the input IS normalized (i.e., the sanitization / normalization logic actually modifies the input).
   - The log must clearly state that normalization occurred.

2. Add a log for the NO-OP case:
   - When the input does NOT require normalization and is returned as-is.
   - The log must clearly state that no normalization was needed.

Log format constraints:
- Logs must use the same logging style already present in the project (e.g., console.log).
- Messages must be written in clear English.
- Logs must be deterministic and unambiguous (no vague wording).

Example intent (not exact wording):
- “[SanitizeUserInput] Input normalized”
- “[SanitizeUserInput] Input already normalized – no changes applied”

Technical constraints:
- Do NOT change the function signature.
- Do NOT alter business logic or normalization rules.
- Do NOT refactor the code.
- Only insert the minimum logic required to detect and log:
  - normalized vs not normalized
- If comparison is needed, compare input before and after normalization safely.

Deliverables:
- Show the final updated version of SanitizeUserInput.js
- Brief explanation (1–2 lines) of where and why the logs were added.

Priority:
Observability clarity > minimal code changes > everything else.
