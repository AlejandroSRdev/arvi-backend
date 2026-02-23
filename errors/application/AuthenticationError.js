/**
 * Layer: Errors
 * File: AuthenticationError.js
 * Responsibility:
 * Classifies unauthenticated access as an application-layer error, separating identity verification failures from authorization and domain rule violations.
 */
import { BaseError } from '../base/BaseError.js';

export class AuthenticationError extends BaseError {
  constructor(message = 'Not authenticated') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
    });
  }
}
