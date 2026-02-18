import { BaseError } from '../base/BaseError.js';

export class AuthenticationError extends BaseError {
  constructor(message = 'Not authenticated') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
    });
  }
}
