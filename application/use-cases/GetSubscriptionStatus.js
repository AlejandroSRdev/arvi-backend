/**
 * Get Subscription Status Use Case (Domain)
 *
 * MIGRADO DESDE: src/controllers/userController.js (líneas 84)
 * EXTRACCIÓN: Obtención de estado de suscripción
 *
 * Responsabilidades:
 * - Obtener estado actual de la suscripción del usuario
 * - Retornar información de Stripe (subscriptionId, status, etc.)
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Llamadas a Stripe API
 * - Lógica HTTP
 * - Acceso directo a Firestore
 */

import { ValidationError, NotFoundError } from '../errors/index.js';

/**
 * Obtener estado de suscripción del usuario
 *
 * MIGRADO DESDE: src/models/Subscription.js:getSubscriptionStatus
 * (llamado desde src/controllers/userController.js:84)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Estado de la suscripción
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

  // Retornar información de suscripción
  return {
    subscriptionId: user.subscriptionId || null,
    subscriptionStatus: user.subscriptionStatus || 'inactive',
    stripeCustomerId: user.stripeCustomerId || null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
    currentPeriodEnd: user.currentPeriodEnd || null,
    canceledAt: user.canceledAt || null,
    plan: user.plan || 'freemium',
  };
}

export default {
  getSubscriptionStatus,
};
