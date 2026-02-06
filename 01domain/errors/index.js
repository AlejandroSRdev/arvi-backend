/**
 * Domain Errors Re-export
 *
 * This file re-exports domain errors from the canonical location.
 * It exists to support legacy import paths used by application services.
 */

export {
  InsufficientEnergyError,
  TrialAlreadyUsedError
} from '../domain_errors/index.js';
