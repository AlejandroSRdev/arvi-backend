/**
 * Layer: Domain
 * File: Trial.js
 * Responsibility:
 * Defines the domain rules governing trial activation, expiration, and remaining time calculation.
 */

// Trial lasts exactly 48 hours; this is the canonical domain constant.
export const TRIAL_DURATION_HOURS = 48;

export function calculateTrialExpiration(startDate) {
  if (!startDate || !(startDate instanceof Date)) {
    throw new Error('startDate debe ser una instancia de Date');
  }

  return new Date(startDate.getTime() + TRIAL_DURATION_HOURS * 60 * 60 * 1000);
}

// A missing expiration date is treated as already expired.
export function isTrialExpired(expiresAt, currentDate = new Date()) {
  if (!expiresAt || !(expiresAt instanceof Date)) {
    return true;
  }

  return currentDate > expiresAt;
}

export function calculateTimeRemaining(expiresAt, currentDate = new Date()) {
  if (!expiresAt || !(expiresAt instanceof Date)) {
    return null;
  }

  if (currentDate >= expiresAt) {
    return null;
  }

  return Math.floor((expiresAt - currentDate) / 1000);
}

/**
 * Domain rules:
 * 1. Only freemium users can activate a trial.
 * 2. Trial can only be activated once per user.
 */
export function canActivateTrial(userPlan, hasUsedTrial) {
  // Rule 1: Only freemium
  if (userPlan !== 'freemium') {
    return {
      canActivate: false,
      reason: 'Solo usuarios freemium pueden activar el trial',
    };
  }

  // Rule 2: One-time only
  if (hasUsedTrial) {
    return {
      canActivate: false,
      reason: 'Trial ya fue activado previamente',
    };
  }

  return {
    canActivate: true,
  };
}

export function isTrialCurrentlyActive(isMarkedActive, expiresAt, currentDate = new Date()) {
  if (!isMarkedActive) {
    return false;
  }

  // A trial without an expiration date is not a valid active trial.
  if (!expiresAt) {
    return false;
  }

  return !isTrialExpired(expiresAt, currentDate);
}

export default {
  TRIAL_DURATION_HOURS,
  calculateTrialExpiration,
  isTrialExpired,
  calculateTimeRemaining,
  canActivateTrial,
  isTrialCurrentlyActive,
};
