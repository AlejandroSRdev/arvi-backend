/**
 * Application Errors Re-export
 *
 * This file re-exports application errors from the canonical location.
 * It exists to support legacy import paths used by use-cases.
 */

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from '../application_errors/index.js';
