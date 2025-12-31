/**
 * User Entity (Domain)
 *
 * LÓGICA PURA extraída de: src/models/User.js
 *
 * Funciones migradas:
 * - Validación de estructura de datos de usuario (líneas 22-64)
 * - Validación de email
 * - Helpers de estado de usuario
 *
 * NO contiene:
 * - CRUD de Firestore
 * - Timestamps
 * - userId en operaciones
 * - Efectos secundarios
 */

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar estructura de datos de usuario
 * LÓGICA PURA extraída de: src/models/User.js createUser() líneas 22-64
 *
 * @param {object} data - Datos del usuario
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validateUserData(data) {
  const errors = [];

  // Email requerido y válido
  if (!data.email) {
    errors.push('Email es requerido');
  } else if (!isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  // Plan válido (si se proporciona)
  if (data.plan) {
    const validPlans = ['freemium', 'mini', 'base', 'pro', 'trial'];
    if (!validPlans.includes(data.plan.toLowerCase())) {
      errors.push(`Plan inválido: ${data.plan}`);
    }
  }

  // Energía inicial válida (si se proporciona)
  if (data.energiaInicial !== undefined) {
    if (typeof data.energiaInicial !== 'number' || data.energiaInicial < 0) {
      errors.push('Energía inicial debe ser un número positivo');
    }
  }

  if (data.energiaMaxima !== undefined) {
    if (typeof data.energiaMaxima !== 'number' || data.energiaMaxima < 0) {
      errors.push('Energía máxima debe ser un número positivo');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Obtener estructura de usuario inicial por defecto
 * LÓGICA PURA extraída de: src/models/User.js createUser() líneas 22-64
 *
 * @param {object} data - Datos del usuario
 * @returns {object} - Estructura de usuario sin timestamps de Firestore
 */
export function getDefaultUserStructure(data) {
  return {
    email: data.email,
    plan: data.plan || 'freemium',
    stripeCustomerId: data.stripeCustomerId || null,
    subscriptionId: null,
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    canceledAt: null,
    energia: {
      actual: data.energiaInicial || 0,
      maxima: data.energiaMaxima || 0,
      consumoTotal: 0,
    },
    trial: {
      activo: false,
      startTimestamp: null,
      expiresAt: null,
    },
    limits: {
      weeklySummariesUsed: 0,
      activeSeriesCount: 0,
    },
    assistant: null,
  };
}

/**
 * Verificar si un usuario tiene trial activo
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export function hasActiveTrial(user) {
  return user?.trial?.activo === true;
}

/**
 * Verificar si un usuario ha usado el trial
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export function hasUsedTrial(user) {
  return user?.trial?.startTimestamp != null;
}

/**
 * Verificar si un usuario tiene suscripción activa
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export function hasActiveSubscription(user) {
  return user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
}

/**
 * Verificar si un usuario es freemium (sin trial activo)
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export function isFreemiumUser(user) {
  return user?.plan === 'freemium' && !hasActiveTrial(user);
}

/**
 * Obtener plan efectivo del usuario (considerando trial)
 * @param {object} user - Objeto usuario
 * @returns {string} - Plan efectivo ('trial' si está activo, sino el plan base)
 */
export function getEffectiveUserPlan(user) {
  if (user?.plan === 'freemium' && hasActiveTrial(user)) {
    return 'trial';
  }

  return user?.plan || 'freemium';
}

/**
 * Verificar si el usuario puede realizar una acción según límites
 * @param {object} user - Objeto usuario
 * @param {string} limitType - Tipo de límite ('weeklySummaries' | 'activeSeries')
 * @param {number} maxAllowed - Máximo permitido
 * @returns {object} - { canDo: boolean, used: number, max: number }
 */
export function canPerformAction(user, limitType, maxAllowed) {
  const limits = user?.limits || {};

  let used = 0;
  if (limitType === 'weeklySummaries') {
    used = limits.weeklySummariesUsed || 0;
  } else if (limitType === 'activeSeries') {
    used = limits.activeSeriesCount || 0;
  }

  return {
    canDo: used < maxAllowed,
    used,
    max: maxAllowed,
    remaining: Math.max(0, maxAllowed - used),
  };
}

export default {
  isValidEmail,
  validateUserData,
  getDefaultUserStructure,
  hasActiveTrial,
  hasUsedTrial,
  hasActiveSubscription,
  isFreemiumUser,
  getEffectiveUserPlan,
  canPerformAction,
};
