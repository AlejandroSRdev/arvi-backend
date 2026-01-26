/**
 * Application Errors Re-export (for use-cases)
 *
 * This file re-exports application errors from the canonical location.
 * It exists to support import paths used by use-cases in subfolders.
 */

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from '../../application_errors/index.js';
