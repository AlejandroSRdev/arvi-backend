/**
 * Layer: Infrastructure
 * File: GeminiAdapter.js
 * Responsibility:
 * Implements IAIProvider by forwarding generation requests to the Google Gemini API and normalizing responses.
 */

import { IAIProvider } from '../../../01domain/ports/IAIProvider.js';
import { InfrastructureError } from '../../../errors/infrastructure/InfrastructureError.js';
import { logger } from '../../logger/Logger.js';
import { getModel } from './GeminiConfig.js';

/**
 * Heuristic fallback token estimation.
 * Used only if usageMetadata is not available.
 *
 * Formula:
 *   tokens ≈ text.length / 3.7
 */
function calculateGeminiTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.round(text.length / 3.7);
}

/**
 * Domain-level energy calculation.
 * (Intentionally independent from real economic token measurement)
 */
function calculateGeminiEnergy(prompt, response) {
  const tokensPrompt = calculateGeminiTokens(prompt);
  const tokensResponse = calculateGeminiTokens(response);
  const totalTokens = Math.round(tokensResponse + (tokensPrompt * 0.30));
  const energy = Math.ceil(totalTokens / 100);

  logger.info(
    `⚡ [Gemini Energy] Prompt(est): ${tokensPrompt}t, Response(est): ${tokensResponse}t, Total(est): ${totalTokens}t → Energy: ${energy}`
  );

  return energy;
}

export class GeminiAdapter extends IAIProvider {

  async callAI(userId, messages, options = {}) {
    try {
      const {
        model = 'gemini-2.5-flash',
        temperature = 0.7,
        maxTokens = 1500,
        forceJson = false, // intentionally unused
      } = options;

      logger.info(`🧠 [Gemini] Calling model: ${model}`);

      const geminiModel = getModel(model);

      const prompt = messages.map(m => {
        if (m.role === 'system') return `[SYSTEM INSTRUCTIONS]\n${m.content}`;
        if (m.role === 'assistant') return `[ASSISTANT]\n${m.content}`;
        return m.content;
      }).join('\n\n');

      const generationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      const result = await geminiModel.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      });

      const content = result.response.text();

      // ===== REAL TOKEN EXTRACTION =====
      const usage = result.response?.usageMetadata;

      let promptTokens;
      let completionTokens;
      let totalTokens;

      if (usage) {
        promptTokens = usage.promptTokenCount ?? 0;
        completionTokens = usage.candidatesTokenCount ?? 0;
        totalTokens = usage.totalTokenCount ?? (promptTokens + completionTokens);

        logger.info(`📦 Full usageMetadata: ${JSON.stringify(usage)}`);
        logger.info(
          `📊 [Gemini Usage - REAL] Prompt: ${promptTokens}t, Response: ${completionTokens}t, Total: ${totalTokens}t`
        );
      } else {
        // Fallback defensive estimation
        promptTokens = calculateGeminiTokens(prompt);
        completionTokens = calculateGeminiTokens(content);
        totalTokens = promptTokens + completionTokens;

        logger.warn(
          '[Gemini] usageMetadata not available — using heuristic token estimation'
        );

        logger.info(
          `📊 [Gemini Usage - ESTIMATED] Prompt: ${promptTokens}t, Response: ${completionTokens}t, Total: ${totalTokens}t`
        );
      }

      const tokensUsed = totalTokens;

      // ===== DOMAIN ENERGY (unchanged logic) =====
      const energyConsumed = calculateGeminiEnergy(prompt, content);

      const response = {
        content,
        model,
        tokensUsed,
        energyConsumed,
      };

      logger.info(
        `✅ [Gemini] Response received - Tokens(real): ${tokensUsed}, Energy(domain): ${energyConsumed}`
      );

      return response;

    } catch (error) {
      const metadata = {
        provider: 'gemini',
        originalMessage: error.message,
        timestamp: new Date().toISOString(),
      };

      logger.error('[GeminiAdapter] callAI failed', { ...metadata, stack: error.stack });

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

      throw new InfrastructureError('UNKNOWN_INFRASTRUCTURE_ERROR', metadata);
    }
  }

  async callAIWithFunctionType(userId, messages, functionType) {
    return this.callAI(userId, messages, {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1500,
      forceJson: false,
    });
  }
}

export default GeminiAdapter;
