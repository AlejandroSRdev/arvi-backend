import { InfrastructureError } from './InfrastructureError.js';

export class UnknownInfrastructureError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'UNKNOWN_INFRASTRUCTURE_ERROR',
      message: params.message ?? 'An unknown infrastructure error occurred',
      metadata: params.metadata,
      cause: params.cause,
    });
  }
}
