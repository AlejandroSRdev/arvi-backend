/**
 * Layer: Application
 * File: StructureHabitSeriesPrompt.js
 * Responsibility:
 * Builds the second-pass AI prompt that extracts structured JSON from the creative text output
 * while performing light structural validation and minimal corrective normalization.
 */

import { Difficulty } from '../../../01domain/value_objects/habits/Difficulty.js';

/**
 * @param {Object} params
 * @param {string} params.language - 'en' | 'es'
 * @param {string} params.rawText - Raw text output from creative pass
 * @returns {Array<{role: string, content: string}>} Array of message objects
 */
function StructureHabitSeriesPrompt({
  language,
  rawText
}) {
  const lowDifficulty = Difficulty.LOW;
  const mediumDifficulty = Difficulty.MEDIUM;
  const highDifficulty = Difficulty.HIGH;

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
1. Extract the structured content from the provided text.
2. Validate structural consistency.
3. Apply minimal corrections ONLY if strictly necessary to:
   - Ensure there are between 3 and 5 actions.
   - Ensure each action has a name, description and valid difficulty.
   - Ensure description length limits are respected.
   - Ensure difficulty matches exactly one of the allowed values.

You MUST NOT:
- Add new concepts.
- Invent new actions.
- Expand content creatively.
- Expand or reformulate unnecessarily.
- Improve style.
- Rewrite for clarity.
- Change the intended meaning.

You MAY:
- Slightly trim overly long descriptions to respect limits.
- Fix minor formatting inconsistencies.
- Correct invalid difficulty values to the closest valid option if clearly implied.
- Normalize small structural inconsistencies.

Extract EXACTLY this structure:

{
  "title": "",
  "description": "",
  "actions": [
    {
      "name": "",
      "description": "",
      "difficulty": ""
    }
  ]
}

Rules:
- "description" must contain the explanatory section from the first pass (10 lines max).
- "actions" must contain between 3 and 5 items.
- Each action description must be <= 5 lines.
- Difficulty must be one of: "${lowDifficulty}", "${mediumDifficulty}", "${highDifficulty}".

Be precise. Be conservative. Preserve meaning.

---

LANGUAGE ENFORCEMENT (FINAL REMINDER):
ALL extracted content MUST remain in ${languageName}.
Under NO circumstances translate or mix languages in the JSON values.`;

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

export default StructureHabitSeriesPrompt;
