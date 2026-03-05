/**
 * Layer: Errors
 * File: Index.js
 * Responsibility:
 * Re-exports all domain-layer error classes as a unified module boundary for the domain error sublayer.
 */
export { MaxActiveSeriesReachedError } from './MaxActiveSeriesReachedError.js';
export { MonthlyActionsQuotaExceededError } from './MonthlyActionsQuotaExceededError.js';
export { TrialAlreadyUsedError } from './TrialAlreadyUsedError.js';

