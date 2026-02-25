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
 
  // First pass creative generation - allows for more creativity and less strict structure
  'habit_series_creative': {
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    maxTokens: 900,
    description: 'Create thematic habit series - CREATIVE PASS'
  },

  'habit_series_structure': {
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 800,
    description: 'Create thematic habit series - STRUCTURING PASS'
  },

  // JSON conversion — always uses gpt-4o-mini for strict structural fidelity
  'json_conversion': {
    model: 'gpt-4o-mini',
    temperature: 0.0,
    maxTokens: 700,
    forceJson: true,
    description: 'Strict conversion from free text to structured JSON'
  },
};

export function getModelConfig(functionType) {
  const config = MODEL_MAPPING[functionType];

  if (!config) {
    throw new Error(`INVALID_FUNCTION_TYPE: "${functionType}" is not defined in MODEL_MAPPING`);
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
