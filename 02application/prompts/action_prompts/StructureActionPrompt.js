/**
 * Layer: Application
 * File: StructureActionPrompt.js
 * Responsibility:
 * Builds the second-pass AI prompt that extracts structured JSON from the creative action text.
 */

/**
 * @param {Object} params
 * @param {string} params.language - 'en' | 'es'
 * @param {string} params.rawText - Raw text output from creative pass
 * @returns {Array<{role: string, content: string}>} Array of message objects
 */
function StructureActionPrompt({ language, rawText }) {
  const languageConfig = {
    en: { languageName: 'English' },
    es: { languageName: 'Spanish (Español)' }
  };

  const { languageName } = languageConfig[language] ?? languageConfig.en;

  const systemPrompt = `LANGUAGE PRESERVATION (MANDATORY):
Selected language: ${languageName}
The input text is in ${languageName}.
You MUST preserve ALL extracted field values strictly and exclusively in ${languageName}.
You MUST NOT translate, alter, or mix languages in any extracted content.

---

RETURN ONLY ONE JSON OBJECT.
NO explanations. NO markdown. NO commentary. NO surrounding text.

Your task is to:
1. Extract the action name and description from the provided text.
2. Apply minimal corrections ONLY if strictly necessary to ensure the description is within bounds.

You MUST NOT:
- Add new concepts.
- Expand content creatively.
- Change the intended meaning.

Extract EXACTLY this structure:

{
  "name": "",
  "description": "",
  "difficulty": ""
}

Rules:
- "name" must be a short, precise action name.
- "description" must be the action description (60–100 words max).
- "difficulty" must be exactly one of: "low", "medium", "high". Infer it from the complexity and demand of the action described.

Be precise. Be conservative. Preserve meaning.

---

LANGUAGE ENFORCEMENT (FINAL REMINDER):
ALL extracted content MUST remain in ${languageName}.`;

  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: rawText.trim()
    }
  ];
}

export default StructureActionPrompt;
