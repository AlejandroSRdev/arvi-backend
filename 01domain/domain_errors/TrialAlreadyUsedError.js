// Custom error class for trial already used scenarios

export class TrialAlreadyUsedError extends Error {
  constructor() {
    super('Trial already used');
    this.name = 'TrialAlreadyUsedError';
    this.code = 'TRIAL_ALREADY_USED';
  }
}
