import { BaseError } from '../base/BaseError';

/** Thrown when a request lacks valid authentication credentials. */
export class AuthenticationError extends BaseError<
  'AUTHENTICATION_ERROR',
  Record<string, never>
> {
  constructor(message: string = 'Not authenticated') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
    });
  }
}