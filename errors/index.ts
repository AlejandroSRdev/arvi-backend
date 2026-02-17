export { BaseError } from './base/BaseError.ts';

export {
  DomainErrorCode,
  InsufficientEnergyError,
  TrialAlreadyUsedError,
  MaxActiveSeriesReachedError,
} from './domain/index.ts';

export {
  ApplicationErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './application/index.ts';

export {
  InfrastructureErrorCode,
  InfrastructureError,
  AITemporaryUnavailableError,
  AIProviderFailureError,
  DataAccessFailureError,
  TransactionFailureError,
  UnknownInfrastructureError,
} from './infrastructure/index.ts';
