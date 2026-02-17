import { InfrastructureError } from './InfrastructureError.js';

/** Thrown when an infrastructure failure cannot be classified. */
export class UnknownInfrastructureError extends InfrastructureError<
  'UNKNOWN_INFRASTRUCTURE_ERROR',
  Record<string, unknown>
> {
  constructor(params: {
    message?: string;
    metadata?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super({
      code: 'UNKNOWN_INFRASTRUCTURE_ERROR',
      message: params.message ?? 'An unknown infrastructure error occurred',
      metadata: params.metadata,
      cause: params.cause,
    });
  }
}
