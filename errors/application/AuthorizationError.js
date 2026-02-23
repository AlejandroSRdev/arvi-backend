/**
 * Layer: Errors
 * File: AuthorizationError.js
 * Responsibility:
 * Classifies unauthorized access as an application-layer error, separating permission failures from authentication and domain rule violations.
 */
import { BaseError } from '../base/BaseError.js';

export class AuthorizationError extends BaseError {
  constructor(message = 'Not authorized') {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
    });
  }
}
