import { BaseError } from '../base/BaseError.js';

export class ValidationError extends BaseError {
  constructor(message, metadata) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      metadata,
    });
  }
}
