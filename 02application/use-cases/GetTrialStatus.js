/**
 * Layer: Application
 * File: GetTrialStatus.js
 * Responsibility:
 * Retrieves the current trial state for a user and returns activation and expiration data.
 */

import { ValidationError, NotFoundError } from "../../errors/Index.js";

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<Object>} Trial state
 */
export async function getTrialStatus(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  const trial = user.trial || {};

  return {
    activo: trial.activo || false,
    startTimestamp: trial.startTimestamp || null,
    expiresAt: trial.expiresAt || null,
  };
}

export default {
  getTrialStatus,
};
