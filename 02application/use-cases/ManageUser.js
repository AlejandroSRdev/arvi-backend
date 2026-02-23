/**
 * Layer: Application
 * File: ManageUser.js
 * Responsibility:
 * Coordinates user profile retrieval, updates, login tracking, account deletion, and subscription status queries through repository ports.
 */

import { ValidationError, NotFoundError } from "../../errors/Index.js";

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Return only permitted fields — internal data is not exposed
  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    energia: user.energia,
    trial: user.trial,
    limits: user.limits,
    assistant: user.assistant,
  };
}

/**
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update { assistant }
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserProfile(userId, updates, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // Only permitted fields are forwarded to the repository
  const allowedUpdates = ['assistant'];
  const safeUpdates = {};

  if (updates.assistant) {
    safeUpdates.assistant = updates.assistant;
  }

  const updatedUser = await userRepository.updateUser(userId, safeUpdates);

  return updatedUser;
}

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  await userRepository.updateUser(userId, {
    lastLogin: new Date(),
  });
}

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<void>}
 */
export async function deleteUserAccount(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  await userRepository.deleteUser(userId);
}

/**
 * Obtener estado de suscripción del usuario
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Estado de suscripción
 */
export async function getSubscriptionStatus(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus || null,
    stripeCustomerId: user.stripeCustomerId || null,
    trial: user.trial || null,
  };
}

export default {
  getUserProfile,
  updateUserProfile,
  updateLastLogin,
  deleteUserAccount,
  getSubscriptionStatus,
};
