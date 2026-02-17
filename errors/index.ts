export { BaseError } from './base/BaseError';

export {
  DomainErrorCode,
  InsufficientEnergyError,
  TrialAlreadyUsedError,
  MaxActiveSeriesReachedError,
} from './domain';

export {
  ApplicationErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './application';

export {
  InfrastructureErrorCode,
  InfrastructureError,
  AITemporaryUnavailableError,
  AIProviderFailureError,
  DataAccessFailureError,
  TransactionFailureError,
  UnknownInfrastructureError,
} from './infrastructure';
