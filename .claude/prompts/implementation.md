I need you to modify my OpenAIAdapter (Node.js backend) to add detailed token usage logging for the GPT-4o-mini step, in the exact same style as the existing Gemini logging.

IMPORTANT:
- Do NOT refactor the architecture.
- Do NOT change business logic.
- Do NOT alter energy calculation logic.
- Only add usage logging.
- Follow the exact logging style already used in GeminiAdapter.

Current Gemini logging example:

📊 [Gemini Energy] Prompt: 740t, Response: 78t, Total: 300t → Energy: 3
✅ [Gemini] Response received - Tokens: 78, Energy: 3

I want the OpenAIAdapter to log usage like this:

📊 [OpenAI Usage] Prompt: X t, Response: Y t, Total: Z t
✅ [OpenAI] Response received - Tokens: Y, Energy: 0 (GPT does not consume)

Implementation requirements:

1. Extract token usage from:
   response.usage.prompt_tokens
   response.usage.completion_tokens
   response.usage.total_tokens

2. Add a log block immediately after receiving the response:

   📊 [OpenAI Usage] Prompt: ${prompt_tokens}t, Response: ${completion_tokens}t, Total: ${total_tokens}t

3. Preserve the existing success log line format:
   [INFO] [OpenAI] Response received - Tokens: ${completion_tokens}, Energy: 0 (GPT does not consume)

4. Do NOT introduce new dependencies.
5. Do NOT change function signatures.
6. Do NOT change return values.
7. Keep code style consistent with existing logging format.

Return ONLY the modified OpenAIAdapter code with the new logging added.
Do not explain.