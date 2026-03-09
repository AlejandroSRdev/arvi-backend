/**
 * Layer: Application
 * File: GetUserDashboardUseCase.js
 * Responsibility:
 * Aggregates profile and usage limits for the authenticated user in a single read.
 */

import { ValidationError, NotFoundError } from '../../errors/Index.js';

/**
 * Returns the dashboard state needed by the frontend: profile and current limits.
 *
 * @param {string} userId - Authenticated user ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<Object>} Dashboard data
 */
export async function getUserDashboard(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  const limits = user.limits || {};

  return {
    profile: {
      email: user.email,
      plan: user.plan || null,
    },
    limits: {
      activeSeriesCount: limits.activeSeriesCount ?? 0,
      maxActiveSeries: limits.maxActiveSeries ?? 0,
      monthlyActionsMax: limits.monthlyActionsMax ?? 0,
      monthlyActionsRemaining: limits.monthlyActionsRemaining ?? 0,
    },
  };
}

export default { getUserDashboard };
