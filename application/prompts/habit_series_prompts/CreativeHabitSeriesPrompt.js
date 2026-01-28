import { Difficulty } from '../../../domain/value_objects/habit_objects/Difficulty.js';

/**
 * FIRST PASS — Creative Prompt
 *
 * Generates free but constrained human-readable content (NOT JSON).
 *
 * This is a pure prompt factory extracted from legacy frontend logic.
 * Difficulty values are sourced from the domain to ensure alignment.
 */

/**
 * @param {Object} params
 * @param {string} params.language - 'en' | 'es'
 * @param {string} params.assistantContext - Serialized assistant context messages
 * @param {Record<string, string>} params.testData - User test data
 * @returns {Array<{role: string, content: string}>} Array of message objects
 */
function CreativeHabitSeriesPrompt({
  language,
  assistantContext,
  testData
}) {
  const dificultadBaja = Difficulty.LOW;
  const dificultadMedia = Difficulty.MEDIUM;
  const dificultadAlta = Difficulty.HIGH;

  const systemPrompt = language === 'en'
    ? `You are Arvi. Create ONE complete thematic habit series based on the user's test responses.

FORMAT RULES (VERY STRICT):
- ONE title only.
- ONE explanatory description, max **10 lines** (≈120–180 words).
- Between **3 and 5 actions**.
- Each action must have:
  • A short action name
  • One description of max **5 lines**
  • A difficulty: "${dificultadBaja}" (easy/quick), "${dificultadMedia}" (moderate effort), or "${dificultadAlta}" (challenging/demanding)
- NO lists outside the action list.
- NO intros ("Here is your series"), NO conclusions.
- ONLY the content of the series.

CONTENT RULES:
The series must:
- Reflect the user's test answers.
- Follow neuroscientific and consistency principles.
- Progress logically from easier to harder.
- Remain practical, personalized and realistic.

Your output must be a clean, structured description, but NOT JSON.
Just produce the text, respecting the limits.`
    : `Eres Arvi. Crea UNA serie temática de hábitos completa.

REGLAS DE FORMATO (MUY ESTRICTAS):
- SOLO un título.
- SOLO una descripción explicativa de la serie, máximo **10 líneas** (≈120–180 palabras).
- Entre **3 y 5 acciones**.
- Cada acción debe incluir:
  • Un nombre corto
  • Una descripción de máximo **5 líneas**
  • Una dificultad: "${dificultadBaja}" (fácil/rápida), "${dificultadMedia}" (esfuerzo moderado), o "${dificultadAlta}" (exigente/desafiante)
- SIN intros del tipo ("Aquí tienes la serie"), SIN cierres formales.
- SIN listas externas que no sean las acciones.
- SOLO el contenido de la serie.

REGLAS DE CONTENIDO:
La serie debe:
- Reflejar las respuestas del test del usuario.
- Basarse en principios de constancia y neurociencia.
- Mantener una progresión natural de dificultad.
- Ser práctica, personalizada y realista.

Tu salida debe ser texto limpio, estructurado y limitado.
NO es JSON aún.`;

  const userPrompt = language === 'en'
    ? `Test data: ${Object.entries(testData).map(([k, v]) => `${k}: ${v}`).join("; ")}`
    : `Datos del test: ${Object.entries(testData).map(([k, v]) => `${k}: ${v}`).join("; ")}`;

  return [
    {
      role: 'system',
      content: assistantContext
    },
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

export default CreativeHabitSeriesPrompt;
