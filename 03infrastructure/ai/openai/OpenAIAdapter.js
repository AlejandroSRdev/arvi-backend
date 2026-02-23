/**
 * Layer: Infrastructure
 * File: OpenAIAdapter.js
 * Responsibility:
 * Implements IAIProvider by forwarding chat completion requests to the OpenAI API and normalizing responses.
 */

import { openai } from './OpenAIConfig.js';
import { IAIProvider } from '../../../01domain/ports/IAIProvider.js';
import { InfrastructureError } from '../../../errors/infrastructure/InfrastructureError.js';
import { logger } from '../../logger/Logger.js';

export class OpenAIAdapter extends IAIProvider {
  /**
   * @param {string} userId - User identifier (used only for logging)
   * @param {Array<Object>} messages - Array of messages [{role: 'user'|'system'|'assistant', content: string}]
   * @param {Object} options
   * @param {string} options.model - Model (default: 'gpt-4o-mini')
   * @param {number} options.temperature - Temperature 0.0-1.0 (default: 0.7)
   * @param {number} options.maxTokens - Token limit (default: 1500)
   * @param {boolean} options.forceJson - Force JSON response format (default: false)
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAI(userId, messages, options = {}) {
    try {
      const {
        model = 'gpt-4o-mini',
        temperature = 0.7,
        maxTokens = 1500,
        forceJson = false,
      } = options;

      logger.info(`[OpenAI] Calling model: ${model}`);

      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(forceJson && { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // OpenAI calls always return energyConsumed: 0 (not a creative generation provider)
      const energyToConsume = 0;

      const response = {
        content,
        model: completion.model,
        tokensUsed,
        energyConsumed: 0,
      };

      logger.info(`[OpenAI] Response received - Tokens: ${tokensUsed}, Energy: 0 (GPT does not consume)`);

      return response;

    } catch (error) {
      const metadata = {
        provider: 'openai',
        originalMessage: error.message,
        timestamp: new Date().toISOString(),
      };

      logger.error('[OpenAIAdapter] callAI failed', { ...metadata, stack: error.stack });

      // Timeout, network, and DNS errors → transient unavailability
      if (
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'EAI_AGAIN' ||
        error.name === 'AbortError' ||
        error.message?.includes('timeout')
      ) {
        throw new InfrastructureError('AI_TEMPORARY_UNAVAILABLE', metadata);
      }

      // Provider rejections, auth errors, 4xx/5xx responses
      if (
        error.status ||
        error.response?.status ||
        error.code === 'PERMISSION_DENIED' ||
        error.code === 'INVALID_ARGUMENT' ||
        error.message?.includes('API key') ||
        error.message?.includes('quota')
      ) {
        throw new InfrastructureError('AI_PROVIDER_FAILURE', metadata);
      }

      // Fallback: unknown infrastructure error
      throw new InfrastructureError('UNKNOWN_INFRASTRUCTURE_ERROR', metadata);
    }
  }

  /**
   * @param {string} userId
   * @param {Array<Object>} messages
   * @param {string} functionType - Ignored; OpenAI always uses gpt-4o-mini
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAIWithFunctionType(userId, messages, functionType) {
    // OpenAI siempre usa gpt-4o-mini para todas las funciones
    return await this.callAI(userId, messages, {
      model: 'gpt-4o-mini',
      temperature: 0.0,
      maxTokens: 1500,
      forceJson: false,
    });
  }
}

export default OpenAIAdapter;
