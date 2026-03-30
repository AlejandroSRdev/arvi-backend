/**
 * Layer: Application
 * File: AIExecutionService.js
 * Responsibility:
 * Coordinates AI provider calls with model selection, delegating execution through ports without accumulating state.
 */

import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { ValidationError } from '../../errors/Index.js';

/**
 * Execute an AI call and return content.
 *
 * No persistence or side effects occur here.
 *
 * @param {string} userId - User ID
 * @param {Array<Object>} messages - Array of messages [{role, content}]
 * @param {Object} options - {model, temperature, maxTokens, forceJson, step?}
 * @param {Object} deps - Injected dependencies {aiProvider}
 * @returns {Promise<{content: *}>}
 */
export async function generateAIResponse(userId, messages, options = {}, deps) {
  const { aiProvider } = deps;

  if (!aiProvider) {
    throw new ValidationError('Dependencies required: aiProvider');
  }

  const {
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 1500,
    forceJson = false,
    step = null,
    requestId = undefined,
    pipeline = undefined,
  } = options;

  const start = Date.now();
  const response = await aiProvider.callAI(userId, messages, {
    model,
    temperature,
    maxTokens,
    forceJson,
  });
  const duration_ms = Date.now() - start;

  if (step) {
    console.log(JSON.stringify({
      level: 'info',
      event: 'ai.step',
      ts: new Date().toISOString(),
      requestId,
      userId,
      pipeline,
      step,
      model,
      duration_ms,
      raw_output: typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content),
    }));
  }

  return {
    content: response.content,
  };
}

/**
 * Execute an AI call with automatic model selection based on functionType.
 *
 * No persistence or side effects occur here.
 *
 * @param {string} userId - User ID
 * @param {Array<Object>} messages - Array of messages [{role, content}]
 * @param {string} functionType - Function type for model selection
 * @param {Object} deps - Injected dependencies {aiProvider}
 * @returns {Promise<{content: *}>}
 */
export async function generateAIResponseWithFunctionType(userId, messages, functionType, deps) {
  const config = getModelConfig(functionType);

  return generateAIResponse(userId, messages, {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    forceJson: config.forceJson || false,
  }, deps);
}

export default {
  generateAIResponse,
  generateAIResponseWithFunctionType,
};
