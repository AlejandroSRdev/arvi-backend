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
