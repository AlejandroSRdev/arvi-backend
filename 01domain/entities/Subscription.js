/**
 * Subscription Entity (Domain)
 *
 * LÓGICA PURA extraída de: src/models/Subscription.js
 *
 * Funciones migradas:
 * - Estados válidos de suscripción (implícito en líneas 23, 40, 68)
 * - Transiciones de estado permitidas
 * - Validación de cancelación programada
 *
 * NO contiene:
 * - Acceso a Firestore
 * - userId
 * - Timestamps
 * - Efectos secundarios
 */

/**
 * Estados válidos de suscripción de Stripe
 * Basado en: https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export const SUBSCRIPTION_STATES = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  UNPAID: 'unpaid',
};

/**
 * Verificar si un estado de suscripción es válido
 * @param {string} status - Estado a validar
 * @returns {boolean}
 */
export function isValidSubscriptionStatus(status) {
  return Object.values(SUBSCRIPTION_STATES).includes(status);
}

/**
 * Verificar si una suscripción está activa
 * @param {string} status - Estado de la suscripción
 * @returns {boolean}
 */
export function isSubscriptionActive(status) {
  return status === SUBSCRIPTION_STATES.ACTIVE || status === SUBSCRIPTION_STATES.TRIALING;
}

/**
 * Verificar si una suscripción está cancelada
 * @param {string} status - Estado de la suscripción
 * @returns {boolean}
 */
export function isSubscriptionCanceled(status) {
  return status === SUBSCRIPTION_STATES.CANCELED;
}

/**
 * Verificar si una suscripción requiere acción (pago)
 * @param {string} status - Estado de la suscripción
 * @returns {boolean}
 */
export function requiresPaymentAction(status) {
  return (
    status === SUBSCRIPTION_STATES.INCOMPLETE ||
    status === SUBSCRIPTION_STATES.PAST_DUE ||
    status === SUBSCRIPTION_STATES.UNPAID
  );
}

/**
 * Validar transición de estado permitida
 * Define qué cambios de estado son válidos en el dominio
 *
 * @param {string} fromStatus - Estado actual
 * @param {string} toStatus - Estado objetivo
 * @returns {object} - { isValid: boolean, reason?: string }
 */
export function canTransitionTo(fromStatus, toStatus) {
  // Si no hay estado previo, cualquier estado inicial es válido
  if (!fromStatus) {
    return { isValid: true };
  }

  // Validar que ambos estados sean válidos
  if (!isValidSubscriptionStatus(fromStatus) || !isValidSubscriptionStatus(toStatus)) {
    return {
      isValid: false,
      reason: 'Estado inválido',
    };
  }

  // Transiciones prohibidas
  const forbiddenTransitions = {
    [SUBSCRIPTION_STATES.CANCELED]: [
      SUBSCRIPTION_STATES.ACTIVE,
      SUBSCRIPTION_STATES.TRIALING,
    ], // No se puede reactivar una cancelada
  };

  if (forbiddenTransitions[fromStatus]?.includes(toStatus)) {
    return {
      isValid: false,
      reason: `No se puede transicionar de ${fromStatus} a ${toStatus}`,
    };
  }

  return { isValid: true };
}

/**
 * Verificar si una suscripción está programada para cancelación
 * LÓGICA PURA extraída de: src/models/Subscription.js líneas 46-58
 *
 * @param {boolean} cancelAtPeriodEnd - Flag de cancelación programada
 * @param {Date} currentPeriodEnd - Fecha de fin del periodo
 * @param {Date} currentDate - Fecha actual
 * @returns {boolean}
 */
export function isScheduledForCancellation(cancelAtPeriodEnd, currentPeriodEnd, currentDate = new Date()) {
  if (!cancelAtPeriodEnd) {
    return false;
  }

  // Si está marcada para cancelación pero no tiene fecha, es inválido
  if (!currentPeriodEnd) {
    return false;
  }

  // Verificar que aún no haya pasado el fin del periodo
  return currentDate < currentPeriodEnd;
}

/**
 * Verificar si la suscripción ha pasado su periodo de cancelación
 * @param {boolean} cancelAtPeriodEnd - Flag de cancelación programada
 * @param {Date} currentPeriodEnd - Fecha de fin del periodo
 * @param {Date} currentDate - Fecha actual
 * @returns {boolean}
 */
export function hasCancellationPeriodEnded(cancelAtPeriodEnd, currentPeriodEnd, currentDate = new Date()) {
  if (!cancelAtPeriodEnd || !currentPeriodEnd) {
    return false;
  }

  return currentDate >= currentPeriodEnd;
}

export default {
  SUBSCRIPTION_STATES,
  isValidSubscriptionStatus,
  isSubscriptionActive,
  isSubscriptionCanceled,
  requiresPaymentAction,
  canTransitionTo,
  isScheduledForCancellation,
  hasCancellationPeriodEnded,
};
