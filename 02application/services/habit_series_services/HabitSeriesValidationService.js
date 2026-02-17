/**
 * Habit Series Validation Service (Application Layer)
 *
 * ARCHITECTURE: Hexagonal - Application Service
 * DATE: 2026-01-13
 *
 * WHY IS THIS AN APPLICATION SERVICE AND NOT A USE-CASE?
 * ======================================================
 * - A USE-CASE represents an EXPLICIT USER INTENTION
 *   Example: "Create a thematic habit series", "Delete a series"
 *
 * - An APPLICATION SERVICE orchestrates validations and cross-cutting logic
 *   that are NOT user intentions, but PRECONDITIONS for executing a use-case.
 *   Example: "Check if the user can create a series"
 *
 * This service does NOT represent a user intention. It represents the orchestration
 * of validations required BEFORE executing the actual creation use-case.
 *
 * RESPONSIBILITIES:
 * =================
 * 1. Load the user ONCE (avoids duplicate reads)
 * 2. Determine effective plan (freemium + trial → trial)
 * 3. Validate access to the feature 'habits.series.create' using PlanPolicy
 * 4. Validate the active series limit according to the user's plan
 * 5. Return a structured result with validation information
 *
 * WHAT IT DOES NOT DO:
 * ====================
 * ❌ Does NOT know HTTP (req/res, status codes)
 * ❌ Does NOT persist data
 * ❌ Does NOT generate series content
 * ❌ Is NOT a middleware
 * ❌ Does NOT depend on Express
 *
 * WHAT IT DOES:
 * =============
 * ✅ Uses injected repositories (dependency inversion)
 * ✅ Uses PlanPolicy from domain for business rules
 * ✅ Throws typed errors from the application layer
 * ✅ Returns structured decision objects
 *
 * CONSUMERS:
 * ==========
 * - HabitSeriesController (currently)
 * - CreateThematicHabitSeriesUseCase (future real creation use-case)
 * - Any other flow that needs to validate if a series can be created
 *
 * CONSOLIDATION:
 * ==============
 * This service REPLACES AND CONSOLIDATES:
 * - application/use-cases/ValidatePlanAccess.js
 *   → functions: validateFeatureAccess + validateActiveSeriesLimit
 * - application/use-cases/createHabitSeries.js
 *   → function: createHabitSeries (which only validated, did not create)
 *
 * Both files made duplicate user reads and redundant validations.
 * This service centralizes all that logic in a single orchestration point.
 */

import { hasFeatureAccess, getPlan } from '../../../01domain/policies/PlanPolicy.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../../errors/index.ts';

/**
 * Determines the user's effective plan considering trial status
 *
 * Business rule:
 * - If user has 'freemium' plan AND trial is active → effective plan is 'trial'
 * - In any other case → effective plan is the user's plan
 *
 * @param {object} user - Firestore user
 * @returns {string} - Effective plan ('freemium', 'trial', 'mini', 'base', 'pro')
 */
function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';

  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }

  return effectivePlan;
}

/**
 * Validate if the user can create a new habit series
 *
 * Performs the following validations in order:
 * 1. The user exists in Firestore
 * 2. The user has access to the feature 'habits.series.create' based on their plan
 * 3. The user has not reached the active series limit for their plan
 *
 * @param {string} userId - User ID (Firebase Auth UID)
 * @param {object} deps - Injected dependencies
 * @param {object} deps.userRepository - User repository
 * @returns {Promise<{allowed: true} | {allowed: false, reason: string, ...}>}
 *
 * @throws {ValidationError} If userRepository is missing
 *
 * Returns:
 * - If allowed: { allowed: true }
 * - If not allowed: { allowed: false, reason: string, ...details }
 *
 * Possible rejection reasons:
 * - 'USER_NOT_FOUND': User does not exist in Firestore
 * - 'FEATURE_NOT_ALLOWED': User's plan does not have access to the feature
 * - 'LIMIT_REACHED': User reached the active series limit for their plan
 */
export async function assertCanCreateHabitSeries(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // 1. Load user ONCE
  const user = await userRepository.getUser(userId);

  if (!user) {
    return {
      allowed: false,
      reason: 'USER_NOT_FOUND'
    };
  }

  // 2. Determine effective plan (considering trial)
  const effectivePlan = determineEffectivePlan(user);
  const planConfig = getPlan(effectivePlan, user.trial?.activo);

  // 3. Validate access to 'habits.series.create' feature
  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.create');

  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'FEATURE_NOT_ALLOWED',
      planId: effectivePlan,
      featureKey: 'habits.series.create'
    };
  }

  // 4. Validate active series limit
  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = planConfig.maxActiveSeries || 0;

  if (activeSeriesCount >= maxActiveSeries) {
    return {
      allowed: false,
      reason: 'LIMIT_REACHED',
      limitType: 'active_series',
      used: activeSeriesCount,
      max: maxActiveSeries,
    };
  }

  // All validations passed
  return {
    allowed: true,
    planId: effectivePlan,
    limitType: 'active_series',
    used: activeSeriesCount,
    max: maxActiveSeries,
    remaining: maxActiveSeries - activeSeriesCount,
  };
}

export default {
  assertCanCreateHabitSeries,
};
