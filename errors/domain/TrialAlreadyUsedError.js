/**
 * Layer: Errors
 * File: TrialAlreadyUsedError.js
 * Responsibility:
 * Classifies a one-time trial entitlement domain rule violation, signaling that the trial has already been consumed.
 */
import { BaseError } from '../base/BaseError.js';

export class TrialAlreadyUsedError extends BaseError {
  constructor() {
    super({
      code: 'TRIAL_ALREADY_USED',
      message: 'Trial already used',
    });
  }
}
