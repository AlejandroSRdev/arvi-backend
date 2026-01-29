You are acting as a senior backend maintenance engineer.

Task scope (STRICT):
- Work ONLY inside: /application/services/habit_series_services/
- Modify ONLY the two existing services in that folder.
- Do NOT touch any other files.

Objectives:
1. Ensure ALL comments are written in English.
   - No Spanish comments anywhere.
   - No mixed-language comments.

2. Ensure schema validation uses ONLY English field names and values.
   - Any Spanish keys or values must be replaced with their English equivalent.
   - Example:
     ❌ "título"
     ✅ "title"
   - The schema must be fully English, both in field names and allowed values.

Constraints (VERY IMPORTANT):
- Do NOT change business logic.
- Do NOT refactor structure or architecture.
- Do NOT rename files or move folders.
- Do NOT introduce new abstractions.
- Do NOT add or remove validations unless required strictly for language consistency.
- Preserve existing behavior; only normalize language.

If you encounter:
- A Spanish schema field → translate it to English and update its usage consistently.
- A Spanish comment → rewrite it in clear, concise English.

Deliverables:
- List of modified files.
- Brief explanation (1 line per file) of what was changed.

Priority:
Language consistency > everything else.