import { BaseError } from '../base/BaseError.js';

export class AuthorizationError extends BaseError {
  constructor(message = 'Not authorized') {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
    });
  }
}
