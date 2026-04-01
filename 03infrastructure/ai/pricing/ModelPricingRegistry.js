/**
 * Layer: Infrastructure
 * File: ModelPricingRegistry.js
 * Responsibility:
 * Static pricing registry for AI models. Provides a pure cost calculation function
 * with no I/O or side effects.
 *
 * pricing-version: 2026-04-01
 */

import { logger } from '../../logger/Logger.js';

const PRICING_REGISTRY = {
  'gpt-4o-mini': {
    inputPerMillion:  0.15,
    outputPerMillion: 0.60,
    provider: 'openai',
  },
  'gpt-4o-mini-2024-07-18': {
    inputPerMillion:  0.15,
    outputPerMillion: 0.60,
    provider: 'openai',
  },
  'gemini-2.5-flash': {
    inputPerMillion:  0.075,
    outputPerMillion: 0.30,
    provider: 'google',
  },
};

/**
 * Calculate the USD cost of a single AI call.
 *
 * @param {string} model - Model identifier
 * @param {number|null|undefined} promptTokens - Input token count
 * @param {number|null|undefined} completionTokens - Output token count
 * @returns {{ inputCost: number, outputCost: number, total: number, known: boolean }}
 */
export function calculateCost(model, promptTokens, completionTokens) {
  const input  = promptTokens     ?? 0;
  const output = completionTokens ?? 0;

  const entry = PRICING_REGISTRY[model];

  if (!entry) {
    logger.warn('[ModelPricingRegistry] Unknown model — cost set to 0', { model });
    return { inputCost: 0, outputCost: 0, total: 0, known: false };
  }

  const inputCost  = (input  / 1_000_000) * entry.inputPerMillion;
  const outputCost = (output / 1_000_000) * entry.outputPerMillion;

  return {
    inputCost,
    outputCost,
    total: inputCost + outputCost,
    known: true,
  };
}
