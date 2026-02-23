/**
 * Layer: Errors
 * File: Index.js
 * Responsibility:
 * Aggregates and re-exports all error classes across domain, application, and infrastructure sublayers as a single public entry point for the error layer.
 */
export { BaseError } from './base/BaseError.js';

export {
  InsufficientEnergyError,
  TrialAlreadyUsedError,
  MaxActiveSeriesReachedError,
} from './domain/Index.js';

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './application/Index.js';

export {
  InfrastructureError,
  AITemporaryUnavailableError,
  AIProviderFailureError,
  DataAccessFailureError,
  TransactionFailureError,
  UnknownInfrastructureError,
} from './infrastructure/Index.js';
