import { BaseError } from '../base/BaseError.ts';

/** Thrown when an authenticated user lacks permission for the requested action. */
export class AuthorizationError extends BaseError<
  'AUTHORIZATION_ERROR',
  Record<string, never>
> {
  constructor(message: string = 'Not authorized') {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
    });
  }
}