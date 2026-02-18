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
