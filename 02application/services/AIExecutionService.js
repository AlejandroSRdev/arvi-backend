/**
 * AIExecutionService (Application Service)
 *
 * Architectural role:
 * Application-level service responsible for executing AI calls in a
 * controlled, safe, and reusable manner, without knowledge of business
 * intent or product-specific semantics.
 *
 * This service encapsulates:
 * - Technical model selection (via ModelSelectionPolicy)
 * - Coordination with AI providers through ports (IAIProvider)
 * - Structured logging per AI step
 *
 * Responsibilities:
 * - Select model configuration based on functionType
 * - Execute AI requests via ports (no direct SDK usage)
 * - Return content and energy consumed per call
 * - Log each AI step for observability
 *
 * Out of scope (explicitly NOT responsible for):
 * - Energy validation or consumption (deferred to caller)
 * - Persistence of any kind
 * - Prompt construction
 * - JSON schema definition or validation
 * - Parsing AI output into domain entities
 * - Business flow orchestration
 *
 * Dependencies:
 * - ModelSelectionPolicy (domain)
 * - IAIProvider (port)
 */


import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { ValidationError } from '../application_errors/index.js';

/**
 * Execute an AI call and return content with energy consumed.
 *
 * No persistence or energy mutation occurs here.
 *
 * @param {string} userId - User ID
 * @param {Array<Object>} messages - Array of messages [{role, content}]
 * @param {Object} options - {model, temperature, maxTokens, forceJson, step?}
 * @param {Object} deps - Injected dependencies {aiProvider}
 * @returns {Promise<{content: *, energyConsumed: number}>}
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
  } = options;

  const response = await aiProvider.callAI(userId, messages, {
    model,
    temperature,
    maxTokens,
    forceJson,
  });

  if (step) {
    console.log('[AI_STEP]', {
      step,
      energyConsumed: response.energyConsumed,
      timestamp: new Date().toISOString()
    });
  }

  return {
    content: response.content,
    energyConsumed: response.energyConsumed
  };
}

/**
 * Execute an AI call with automatic model selection based on functionType.
 *
 * No persistence or energy mutation occurs here.
 *
 * @param {string} userId - User ID
 * @param {Array<Object>} messages - Array of messages [{role, content}]
 * @param {string} functionType - Function type for model selection
 * @param {Object} deps - Injected dependencies {aiProvider}
 * @returns {Promise<{content: *, energyConsumed: number}>}
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
