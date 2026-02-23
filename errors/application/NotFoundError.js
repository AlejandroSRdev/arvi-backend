/**
 * Layer: Errors
 * File: NotFoundError.js
 * Responsibility:
 * Classifies resource lookup failures as an application-layer error, carrying entity identity metadata to support HTTP 404 mapping.
 */
import { BaseError } from '../base/BaseError.js';

export class NotFoundError extends BaseError {
  constructor(entity, id) {
    super({
      code: 'NOT_FOUND',
      message: `${entity} not found`,
      metadata: { entity, id },
    });
  }
}
