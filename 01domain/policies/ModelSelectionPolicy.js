/**
 * Layer: Domain
 * File: ModelSelectionPolicy.js
 * Responsibility:
 * Maps each domain function type to its corresponding AI model configuration, including temperature and token limits.
 */

/**
 * Model selection criteria:
 * - gemini-2.0-flash: fast responses, plain text, low token budget
 * - gemini-2.5-flash: standard analysis, moderate creativity
 * - gemini-2.5-pro: complex reasoning, deep analysis
 * - gpt-4o-mini: strict JSON conversion, structure validation
 */
export const MODEL_MAPPING = {
  // Short phrases and comments
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

  // Analysis and creative generation
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

  // Chat and general conversation
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

  // JSON conversion — always uses gpt-4o-mini for strict structural fidelity
  'json_conversion': {
    model: 'gpt-4o-mini',
    temperature: 0.0,
    maxTokens: 1500,
    forceJson: true,
    description: 'Conversión estricta de texto libre a JSON estructurado'
  },
};

export function getModelConfig(functionType) {
  const config = MODEL_MAPPING[functionType];

  if (!config) {
    throw new Error(`INVALID_FUNCTION_TYPE: "${functionType}" no está definido en MODEL_MAPPING`);
  }

  return config;
}

export function isValidFunctionType(functionType) {
  return MODEL_MAPPING.hasOwnProperty(functionType);
}

export function getAvailableFunctionTypes() {
  return Object.keys(MODEL_MAPPING);
}

export default {
  MODEL_MAPPING,
  getModelConfig,
  isValidFunctionType,
  getAvailableFunctionTypes,
};
