import { BaseError } from '../base/BaseError';

/** Thrown when the user has already consumed their trial. */
export class TrialAlreadyUsedError extends BaseError<
  'TRIAL_ALREADY_USED',
  Record<string, never>
> {
  constructor() {
    super({
      code: 'TRIAL_ALREADY_USED',
      message: 'Trial already used',
    });
  }
}
