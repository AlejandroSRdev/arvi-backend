import { InfrastructureError } from './InfrastructureError.ts';

interface Metadata {
  readonly provider: string;
  readonly statusCode?: number;
}

/** Thrown when an AI provider returns an unrecoverable failure. */
export class AIProviderFailureError extends InfrastructureError<
  'AI_PROVIDER_FAILURE',
  Metadata
> {
  constructor(params: {
    provider: string;
    statusCode?: number;
    cause?: unknown;
  }) {
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
