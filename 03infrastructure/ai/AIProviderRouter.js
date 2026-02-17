/**
 * AI Provider Router (Infrastructure Layer)
 *
 * ARCHITECTURE: Hexagonal (Ports & Adapters)
 * DATE: 2026-01-27
 *
 * RESPONSIBILITY:
 * Routes AI calls to the correct adapter based on model name.
 * This solves the problem of having a single adapter that cannot
 * handle multiple providers (Gemini + OpenAI).
 *
 * ROUTING LOGIC:
 * - Models starting with 'gpt-' or 'o1-' → OpenAIAdapter
 * - Models starting with 'gemini-' → GeminiAdapter
 * - Unknown models → Fail-fast with clear error
 *
 * IMPLEMENTS: domain/ports/IAIProvider.js
 */

import { GeminiAdapter } from './gemini/GeminiAdapter.js';
import { OpenAIAdapter } from './openai/OpenAIAdapter.js';
import { IAIProvider } from '../../01domain/ports/IAIProvider.js';
import { InfrastructureError } from '../infrastructure_errors/InfrastructureError.js';
import { logger } from '../logger/logger.js';

/**
 * Router that implements IAIProvider and delegates to the correct adapter
 */
export class AIProviderRouter extends IAIProvider {
  constructor() {
    super();
    this.geminiAdapter = new GeminiAdapter();
    this.openaiAdapter = new OpenAIAdapter();
  }

  /**
   * Determine which adapter to use based on model name
   *
   * @param {string} model - Model name (e.g., 'gpt-4o-mini', 'gemini-2.5-flash')
   * @returns {IAIProvider} The appropriate adapter
   * @throws {Error} If model prefix is not recognized
   */
  getAdapterForModel(model) {
    if (!model || typeof model !== 'string') {
      throw new InfrastructureError('AI_PROVIDER_FAILURE', {
        reason: 'INVALID_MODEL',
        message: 'Model name is required',
        timestamp: new Date().toISOString(),
      });
    }

    // OpenAI models
    if (model.startsWith('gpt-') || model.startsWith('o1-')) {
      logger.info(`[AIRouter] Routing to OpenAIAdapter for model: ${model}`);
      return this.openaiAdapter;
    }

    // Gemini models
    if (model.startsWith('gemini-')) {
      logger.info(`[AIRouter] Routing to GeminiAdapter for model: ${model}`);
      return this.geminiAdapter;
    }

    // Fail-fast: unknown model prefix
    throw new InfrastructureError('AI_PROVIDER_FAILURE', {
      reason: 'UNKNOWN_MODEL_PROVIDER',
      model,
      message: `No adapter configured for model "${model}". Expected prefix: 'gpt-', 'o1-', or 'gemini-'`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Route AI call to the correct adapter based on model
   *
   * @param {string} userId - User ID
   * @param {Array<Object>} messages - Array of messages [{role, content}]
   * @param {Object} options - Options including model, temperature, maxTokens, forceJson
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAI(userId, messages, options = {}) {
    const { model = 'gemini-2.5-flash' } = options;
    const adapter = this.getAdapterForModel(model);
    return adapter.callAI(userId, messages, options);
  }

  /**
   * Route AI call with function type
   * Note: This delegates to callAI since the model is determined by the caller
   *
   * @param {string} userId - User ID
   * @param {Array<Object>} messages - Array of messages [{role, content}]
   * @param {string} functionType - Function type (used by caller to determine model)
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAIWithFunctionType(userId, messages, functionType) {
    // Default to Gemini for function-type calls
    // The actual model selection should happen at the use-case level
    return this.geminiAdapter.callAIWithFunctionType(userId, messages, functionType);
  }
}

export default AIProviderRouter;
