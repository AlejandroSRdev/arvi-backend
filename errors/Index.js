export { BaseError } from './base/BaseError.js';

export {
  InsufficientEnergyError,
  TrialAlreadyUsedError,
  MaxActiveSeriesReachedError,
} from './domain/index.js';

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './application/index.js';

export {
  InfrastructureError,
  AITemporaryUnavailableError,
  AIProviderFailureError,
  DataAccessFailureError,
  TransactionFailureError,
  UnknownInfrastructureError,
} from './infrastructure/index.js';
