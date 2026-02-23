/**
 * Layer: Application
 * File: StructureHabitSeriesPrompt.js
 * Responsibility:
 * Builds the second-pass AI prompt that extracts structured JSON from the creative text output.
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
  const dificultadBaja = Difficulty.LOW;
  const dificultadMedia = Difficulty.MEDIUM;
  const dificultadAlta = Difficulty.HIGH;

  const systemPrompt = language === 'en'
    ? `RETURN ONLY ONE JSON OBJECT.
NO explanations. NO markdown. NO commentary. NO surrounding text.

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

RULES:
- "descripcion" must contain the 10-line (or fewer) explanation from the first pass.
- "acciones" must be between 3 and 5 items.
- Each action description must be <= 5 lines.
- Difficulty must be one of: "${dificultadBaja}", "${dificultadMedia}", "${dificultadAlta}".
- DO NOT add new text.
- DO NOT alter meaning.
- DO NOT expand or shorten excessively.`
    : `DEVUELVE SOLO UN OBJETO JSON.
Sin explicaciones, sin markdown, sin comentarios, sin texto adicional.

Extrae EXACTAMENTE esta estructura:
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

REGLAS:
- "descripcion" debe contener la explicación de 10 líneas o menos generada en la primera pasada.
- "acciones" debe tener entre 3 y 5 elementos.
- Cada descripción debe tener máximo 5 líneas.
- La dificultad debe ser: "${dificultadBaja}", "${dificultadMedia}" o "${dificultadAlta}".
- NO añadir texto nuevo.
- NO alterar el significado.
- NO expandir ni resumir en exceso.`;

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
