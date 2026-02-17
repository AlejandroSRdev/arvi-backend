import { InfrastructureError } from './InfrastructureError';

interface Metadata {
  readonly provider: string;
  readonly originalMessage?: string;
  readonly timestamp?: string;
}

/** Thrown when an AI provider is temporarily unavailable. */
export class AITemporaryUnavailableError extends InfrastructureError<
  'AI_TEMPORARY_UNAVAILABLE',
  Metadata
> {
  constructor(params: {
    provider: string;
    originalMessage?: string;
    timestamp?: string;
    cause?: unknown;
  }) {
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
