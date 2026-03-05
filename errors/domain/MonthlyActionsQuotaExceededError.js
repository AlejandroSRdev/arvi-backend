/**
 * Layer: Errors
 * File: MonthlyActionsQuotaExceededError.js
 * Responsibility:
 * Signals that the user has exhausted their monthly action creation quota.
 */
import { BaseError } from '../base/BaseError.js';

export class MonthlyActionsQuotaExceededError extends BaseError {
  constructor(limit) {
    super({
      code: 'MONTHLY_ACTIONS_QUOTA_EXCEEDED',
      message: 'Monthly action creation quota has been reached',
      metadata: { limit },
    });
  }
}
