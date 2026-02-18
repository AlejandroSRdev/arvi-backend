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
