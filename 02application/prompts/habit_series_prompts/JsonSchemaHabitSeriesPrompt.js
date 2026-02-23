/**
 * Layer: Application
 * File: JsonSchemaHabitSeriesPrompt.js
 * Responsibility:
 * Builds the third-pass AI prompt that enforces strict JSON schema compliance on structured content.
 */

/**
 * @param {Object} params
 * @param {string} params.content - Content to validate/enforce as JSON
 * @param {Object} params.schema - JSON schema to enforce
 * @returns {Array<{role: string, content: string}>} Array of message objects
 */
function JsonSchemaHabitSeriesPrompt({
  content,
  schema
}) {
  const systemPrompt = `You must return ONLY valid JSON matching the provided schema.
NO markdown code blocks.
NO explanations.
NO surrounding text.
ONLY the JSON object itself.`;

  const userPrompt = `Content to structure:
${content}

Required schema:
${JSON.stringify(schema, null, 2)}

Return ONLY the JSON object matching this schema.`;

  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
}

export default JsonSchemaHabitSeriesPrompt;
