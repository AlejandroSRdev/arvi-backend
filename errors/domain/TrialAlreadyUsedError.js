import { BaseError } from '../base/BaseError.js';

export class TrialAlreadyUsedError extends BaseError {
  constructor() {
    super({
      code: 'TRIAL_ALREADY_USED',
      message: 'Trial already used',
    });
  }
}
