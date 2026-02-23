/**
 * Layer: Errors
 * File: ValidationError.js
 * Responsibility:
 * Classifies input constraint violations as an application-layer error, carrying field-level metadata to support HTTP 400 mapping.
 */
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
