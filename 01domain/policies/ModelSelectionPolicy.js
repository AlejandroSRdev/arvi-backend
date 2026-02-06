/**
 * Model Selection Policy (Domain)
 *
 * MIGRADO DESDE: src/config/modelMapping.js (COMPLETO)
 *
 * Funciones migradas:
 * - MODEL_MAPPING (constante completa con todos los function_type)
 * - getModelConfig()
 * - isValidFunctionType()
 * - getAvailableFunctionTypes()
 *
 * Responsabilidades:
 * - Mapeo function_type → modelo IA
 * - Configuración de temperatura, maxTokens por función
 * - Validación de function_type
 *
 * NO contiene:
 * - SDKs de OpenAI/Gemini
 * - Llamadas HTTP
 * - Lógica de infraestructura
 */

/**
 * Mapeo de tipos de función a configuración de modelo de IA
 *
 * CRITERIOS DE SELECCIÓN:
 * - gemini-2.0-flash: Respuestas rápidas, texto simple, máx. 100 tokens
 * - gemini-2.5-flash: Análisis estándar, creatividad media, máx. 1500 tokens
 * - gemini-2.5-pro: Análisis complejo, razonamiento profundo, máx. 3000 tokens
 * - gpt-4o-mini: Conversión JSON estricta, validación de estructuras
 */
export const MODEL_MAPPING = {
  // ═══════════════════════════════════════════════════════════════
  // FRASES Y COMENTARIOS CORTOS
  // ═══════════════════════════════════════════════════════════════

  'home_phrase': {
    model: 'gemini-2.0-flash',
    temperature: 0.8,
    maxTokens: 100,
    description: 'Frase motivacional corta para pantalla principal (máx. 25 palabras)'
  },

  'step_commentary': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 300,
    description: 'Comentario filosófico sobre paso de reprogramación (máx. 6 líneas)'
  },

  'habit_verification_question': {
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 60,
    description: 'Pregunta de verificación de hábito (texto plano, directo)'
  },

  // ═══════════════════════════════════════════════════════════════
  // ANÁLISIS Y GENERACIÓN CREATIVA (PASADA 1)
  // ═══════════════════════════════════════════════════════════════

  'reprogramming_final_report': {
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Informe final integrador de reprogramación mental (3-5 párrafos)'
  },

  'execution_summary_creative': {
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Resumen ejecutivo del día - PASADA CREATIVA'
  },

  'execution_summary_structure': {
    model: 'gemini-2.5-pro',
    temperature: 0.0,
    maxTokens: 2000,
    description: 'Resumen ejecutivo del día - PASADA ESTRUCTURADORA'
  },

  'habit_test_analysis': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 500,
    description: 'Análisis de respuesta en test de hábitos'
  },

  'habit_series_creative': {
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    maxTokens: 1500,
    description: 'Crear serie temática de hábitos - PASADA CREATIVA'
  },

  'habit_series_structure': {
    model: 'gemini-2.5-pro',
    temperature: 0.0,
    maxTokens: 1500,
    description: 'Crear serie temática de hábitos - PASADA ESTRUCTURADORA'
  },

  'habit_action_creative': {
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    maxTokens: 500,
    description: 'Crear acción individual de hábito - PASADA CREATIVA'
  },

  'habit_action_structure': {
    model: 'gemini-2.5-pro',
    temperature: 0.0,
    maxTokens: 500,
    description: 'Crear acción individual de hábito - PASADA ESTRUCTURADORA'
  },

  'habit_verification_evaluation': {
    model: 'gemini-2.0-flash',
    temperature: 0.1,
    maxTokens: 120,
    description: 'Evaluar respuesta de verificación - PASADA 1 (nota + etiqueta)'
  },

  'habit_verification_scoring': {
    model: 'gemini-2.5-pro',
    temperature: 0.0,
    maxTokens: 100,
    description: 'Evaluar respuesta de verificación - PASADA 2 (conversión a puntuación)'
  },

  'habit_weekly_analysis': {
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 1500,
    description: 'Análisis semanal de progreso de hábitos'
  },

  'conversation_summary_creative': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 800,
    description: 'Resumen de conversación - PASADA CREATIVA'
  },

  'conversation_summary_structure': {
    model: 'gemini-2.5-pro',
    temperature: 0.0,
    maxTokens: 500,
    description: 'Resumen de conversación - PASADA ESTRUCTURADORA'
  },

  // ═══════════════════════════════════════════════════════════════
  // CHAT Y CONVERSACIÓN GENERAL
  // ═══════════════════════════════════════════════════════════════

  'chat': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 1500,
    description: 'Conversación general libre con el asistente'
  },

  'daily_plan': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Generación de plan diario estratégico'
  },

  'mindset_analysis': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Análisis de mentalidad y patrones de pensamiento'
  },

  'goal_strategy': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 1200,
    description: 'Estrategia para alcanzar objetivos'
  },

  'mood_analysis': {
    model: 'gemini-2.5-flash',
    temperature: 0.6,
    maxTokens: 500,
    description: 'Análisis de estado emocional'
  },

  // ═══════════════════════════════════════════════════════════════
  // CONVERSIÓN JSON (SIEMPRE GPT-4O-MINI)
  // ═══════════════════════════════════════════════════════════════

  'json_conversion': {
    model: 'gpt-4o-mini',
    temperature: 0.0,
    maxTokens: 1500,
    forceJson: true,
    description: 'Conversión estricta de texto libre a JSON estructurado'
  },
};

/**
 * Obtener configuración de modelo según function_type
 *
 * @param {string} functionType - Tipo de función
 * @returns {object} - {model, temperature, maxTokens, forceJson?, description}
 * @throws {Error} - Si el function_type no existe
 */
export function getModelConfig(functionType) {
  const config = MODEL_MAPPING[functionType];

  if (!config) {
    throw new Error(`INVALID_FUNCTION_TYPE: "${functionType}" no está definido en MODEL_MAPPING`);
  }

  return config;
}

/**
 * Validar que un function_type existe
 *
 * @param {string} functionType - Tipo de función
 * @returns {boolean}
 */
export function isValidFunctionType(functionType) {
  return MODEL_MAPPING.hasOwnProperty(functionType);
}

/**
 * Obtener lista de todos los function_types disponibles
 *
 * @returns {array} - Array de strings con todos los tipos
 */
export function getAvailableFunctionTypes() {
  return Object.keys(MODEL_MAPPING);
}

export default {
  MODEL_MAPPING,
  getModelConfig,
  isValidFunctionType,
  getAvailableFunctionTypes,
};
