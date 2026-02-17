import { BaseError } from '../base/BaseError.ts';

/** Thrown when input validation fails at the application boundary. */
export class ValidationError extends BaseError<
  'VALIDATION_ERROR',
  Record<string, unknown>
> {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      metadata,
    });
  }
}