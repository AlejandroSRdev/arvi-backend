/**
 * Layer: Errors
 * File: AIProviderFailureError.js
 * Responsibility:
 * Classifies a non-recoverable AI provider failure at the infrastructure boundary, carrying provider identity and HTTP status for upstream error mapping.
 */
import { InfrastructureError } from './InfrastructureError.js';

export class AIProviderFailureError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'AI_PROVIDER_FAILURE',
      message: `AI provider "${params.provider}" failed`,
      metadata: {
        provider: params.provider,
        statusCode: params.statusCode,
      },
      cause: params.cause,
    });
  }
}
