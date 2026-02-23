/**
 * Layer: Errors
 * File: UnknownInfrastructureError.js
 * Responsibility:
 * Classifies unrecognized technical failures as a catch-all infrastructure error, preserving the original cause for upstream investigation.
 */
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
