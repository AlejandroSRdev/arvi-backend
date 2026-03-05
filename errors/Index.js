/**
 * Layer: Errors
 * File: Index.js
 * Responsibility:
 * Aggregates and re-exports all error classes across domain, application, and infrastructure sublayers as a single public entry point for the error layer.
 */
export { BaseError } from './base/BaseError.js';

export {
  MaxActiveSeriesReachedError, MonthlyActionsQuotaExceededError, TrialAlreadyUsedError
} from './domain/Index.js';

export {
  AuthenticationError,
  AuthorizationError,
  NotFoundError, ValidationError
} from './application/Index.js';

export {
  AIProviderFailureError, AITemporaryUnavailableError, DataAccessFailureError, InfrastructureError, TransactionFailureError,
  UnknownInfrastructureError, StripeProviderFailureError
} from './infrastructure/Index.js';

