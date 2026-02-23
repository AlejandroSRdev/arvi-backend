/**
 * Layer: Errors
 * File: MaxActiveSeriesReachedError.js
 * Responsibility:
 * Classifies a capacity-constraint domain rule violation when the active series limit is exceeded, carrying limit and current count as metadata.
 */
import { BaseError } from '../base/BaseError.js';

export class MaxActiveSeriesReachedError extends BaseError {
  constructor(limit, active) {
    super({
      code: 'MAX_ACTIVE_SERIES_REACHED',
      message: 'Maximum number of active series reached',
      metadata: { limit, active },
    });
  }
}
