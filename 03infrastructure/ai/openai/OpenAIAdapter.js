/**
 * OpenAI Adapter (Infrastructure Layer)
 *
 * MIGRADO DESDE: src/services/aiService.js (líneas 106-133)
 * REFACTORIZADO: 2025-12-30
 * ALINEADO CON: frontend-reference/services/ai_service_refactor2.dart
 *
 * IMPLEMENTA: domain/ports/IAIProvider.js
 *
 * RESPONSABILIDADES:
 * - Implementar contrato IAIProvider usando OpenAI SDK
 * - Traducir input del dominio → llamada OpenAI API
 * - Traducir respuesta OpenAI → formato esperado por dominio
 * - Calcular tokensUsed desde completion.usage.total_tokens
 * - Energía SIEMPRE es 0 (GPT no consume energía del usuario)
 *
 * NO CONTIENE:
 * - Lógica de prompts (eso está en el frontend)
 * - Flujos multi-pasada (eso está en el frontend)
 * - Decisiones de "qué generar" (eso está en el frontend)
 *
 * COMPORTAMIENTO ORIGINAL PRESERVADO:
 * - forceJson → response_format: { type: 'json_object' }
 * - energyConsumed SIEMPRE 0 para OpenAI
 * - temperature, maxTokens, model según opciones
 */

import { openai } from './OpenAIConfig.js';
import { IAIProvider } from '../../../01domain/ports/IAIProvider.js';
import { InfrastructureError } from '../../../errors/infrastructure/InfrastructureError.js';
import { logger } from '../../logger/Logger.js';

/**
 * Adapter de OpenAI que implementa el port IAIProvider
 */
export class OpenAIAdapter extends IAIProvider {
  /**
   * Llamada universal a OpenAI
   *
   * EXTRACCIÓN: src/services/aiService.js:106-133
   *
   * @param {string} userId - ID del usuario (no usado por OpenAI, solo para logs)
   * @param {Array<Object>} messages - Array de mensajes [{role: 'user'|'system'|'assistant', content: string}] (construidos por el frontend)
   * @param {Object} options - Opciones de configuración
   * @param {string} options.model - Modelo específico (default: 'gpt-4o-mini')
   * @param {number} options.temperature - Temperatura 0.0-1.0 (default: 0.7)
   * @param {number} options.maxTokens - Límite de tokens (default: 1500)
   * @param {boolean} options.forceJson - Forzar respuesta JSON (default: false)
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

      // EXTRACCIÓN EXACTA: src/services/aiService.js:110-116
      // Llamada a OpenAI API con opciones exactas
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(forceJson && { response_format: { type: 'json_object' } }),
      });

      // EXTRACCIÓN EXACTA: src/services/aiService.js:118-119
      const content = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // EXTRACCIÓN EXACTA: src/services/aiService.js:121-129
      // ⚠️ GPT NO CONSUME ENERGÍA DEL USUARIO
      // GPT solo se usa para conversión a JSON (no contenido creativo para UI)
      const energyToConsume = 0;

      const response = {
        content,
        model: completion.model,
        tokensUsed,
        energyConsumed: 0, // GPT NO consume energía
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
   * Llamada a IA con mapeo automático de modelo según tipo de función
   *
   * NOTA: OpenAI se usa típicamente con modelo fijo gpt-4o-mini.
   * Este método implementa el contrato IAIProvider pero en la práctica
   * siempre usa el mismo modelo.
   *
   * @param {string} userId - ID del usuario
   * @param {Array<Object>} messages - Array de mensajes [{role, content}] (construidos por el frontend)
   * @param {string} functionType - Tipo de función (ignorado, OpenAI usa modelo fijo)
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
