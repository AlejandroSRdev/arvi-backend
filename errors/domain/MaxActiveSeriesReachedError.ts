import { BaseError } from '../base/BaseError';

interface Metadata {
  readonly limit: number;
  readonly active: number;
}

/** Thrown when the user has reached the maximum number of active series. */
export class MaxActiveSeriesReachedError extends BaseError<
  'MAX_ACTIVE_SERIES_REACHED',
  Metadata
> {
  constructor(limit: number, active: number) {
    super({
      code: 'MAX_ACTIVE_SERIES_REACHED',
      message: 'Maximum number of active series reached',
      metadata: { limit, active },
    });
  }
}
