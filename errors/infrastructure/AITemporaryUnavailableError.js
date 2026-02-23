/**
 * Layer: Errors
 * File: AITemporaryUnavailableError.js
 * Responsibility:
 * Classifies a transient AI provider failure at the infrastructure boundary, distinguishing temporary unavailability from permanent provider errors.
 */
import { InfrastructureError } from './InfrastructureError.js';

export class AITemporaryUnavailableError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'AI_TEMPORARY_UNAVAILABLE',
      message: `AI provider "${params.provider}" is temporarily unavailable`,
      metadata: {
        provider: params.provider,
        originalMessage: params.originalMessage,
        timestamp: params.timestamp,
      },
      cause: params.cause,
    });
  }
}
