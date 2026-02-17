/**
 * Process Subscription Use Case (Domain)
 *
 * MIGRADO DESDE:
 * - src/controllers/webhookController.js (líneas 79-186)
 * - src/models/Subscription.js (líneas 18-104)
 *
 * Responsabilidades:
 * - Procesar eventos de suscripción de Stripe
 * - Actualizar estado de suscripción según eventos
 * - Manejar cancelaciones programadas y definitivas
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Parsing de webhooks
 * - Verificación de firmas
 * - Lógica HTTP
 * - Acceso directo a Firestore
 */

import { ValidationError, NotFoundError } from "../../errors/index.ts";

/**
 * Procesar pago exitoso (checkout.session.completed)
 *
 * MIGRADO DESDE: src/controllers/webhookController.js:handleCheckoutCompleted (líneas 79-106)
 *
 * @param {Object} checkoutData - Datos del checkout {userId, plan, subscriptionId, customerId}
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<void>}
 */
export async function processCheckoutCompleted(checkoutData, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const { userId, plan, subscriptionId, customerId } = checkoutData;

  if (!userId || !plan) {
    throw new ValidationError('Checkout data incomplete: userId and plan required');
  }

  await userRepository.updateUser(userId, {
    subscriptionId,
    subscriptionStatus: 'active',
    stripeCustomerId: customerId,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    canceledAt: null,
    plan,
  });
}

/**
 * Procesar actualización de suscripción (customer.subscription.updated)
 *
 * MIGRADO DESDE: src/controllers/webhookController.js:handleSubscriptionUpdated (líneas 112-153)
 *
 * @param {Object} subscriptionData - {customerId, status, cancelAtPeriodEnd, currentPeriodEnd}
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<void>}
 */
export async function processSubscriptionUpdated(subscriptionData, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const { customerId, status, cancelAtPeriodEnd, currentPeriodEnd } = subscriptionData;

  const user = await userRepository.getUserByCustomerId(customerId);

  if (!user) {
    throw new NotFoundError(`User with customerId: ${customerId}`);
  }

  if (cancelAtPeriodEnd) {
    await userRepository.updateUser(user.id, {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    });
    return;
  }

  await userRepository.updateUser(user.id, {
    subscriptionStatus: status,
  });
}

/**
 * Procesar cancelación definitiva (customer.subscription.deleted)
 *
 * MIGRADO DESDE: src/controllers/webhookController.js:handleSubscriptionDeleted (líneas 160-186)
 *
 * @param {Object} subscriptionData - {customerId}
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<void>}
 */
export async function processSubscriptionDeleted(subscriptionData, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const { customerId } = subscriptionData;

  const user = await userRepository.getUserByCustomerId(customerId);

  if (!user) {
    throw new NotFoundError(`User with customerId: ${customerId}`);
  }

  await userRepository.updateUser(user.id, {
    subscriptionStatus: 'canceled',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    canceledAt: new Date(),
    plan: 'freemium',
  });
}

export default {
  processCheckoutCompleted,
  processSubscriptionUpdated,
  processSubscriptionDeleted,
};
