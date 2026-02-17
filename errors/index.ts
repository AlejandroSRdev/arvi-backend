export { BaseError } from './base/BaseError.js';

export {
  DomainErrorCode,
  InsufficientEnergyError,
  TrialAlreadyUsedError,
  MaxActiveSeriesReachedError,
} from './domain/index.js';

export {
  ApplicationErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './application/index.js';

export {
  InfrastructureErrorCode,
  InfrastructureError,
  AITemporaryUnavailableError,
  AIProviderFailureError,
  DataAccessFailureError,
  TransactionFailureError,
  UnknownInfrastructureError,
} from './infrastructure/index.js';
