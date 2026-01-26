/**
 * Habit Series Validation Service (Application Layer)
 *
 * ARQUITECTURA: Hexagonal - Application Service
 * FECHA CREACIÓN: 2026-01-13
 *
 * ¿POR QUÉ ES UN APPLICATION SERVICE Y NO UN USE-CASE?
 * ==================================================
 * - Un USE-CASE representa una INTENCIÓN EXPLÍCITA del usuario/actor del sistema
 *   Ejemplo: "Crear una serie temática de hábitos", "Eliminar una serie"
 *
 * - Un APPLICATION SERVICE orquesta validaciones y lógica transversal que NO son
 *   intenciones del usuario, sino CONDICIONES PREVIAS para ejecutar un use-case.
 *   Ejemplo: "Verificar si el usuario puede crear una serie"
 *
 * Este servicio NO representa una intención del usuario. Representa la orquestación
 * de validaciones necesarias ANTES de ejecutar el use-case real de creación.
 *
 * RESPONSABILIDADES:
 * =================
 * 1. Cargar el usuario UNA SOLA VEZ (evita lecturas duplicadas)
 * 2. Determinar el plan efectivo (freemium + trial → trial)
 * 3. Validar acceso a la feature 'habits.series.create' usando PlanPolicy
 * 4. Validar el límite de series activas según el plan del usuario
 * 5. Retornar un resultado estructurado con información de la validación
 *
 * LO QUE NO HACE:
 * ==============
 * ❌ NO conoce HTTP (req/res, status codes)
 * ❌ NO persiste datos
 * ❌ NO genera contenido de series
 * ❌ NO es un middleware
 * ❌ NO depende de Express
 *
 * LO QUE SÍ HACE:
 * ==============
 * ✅ Usa repositorios inyectados (inversión de dependencias)
 * ✅ Usa PlanPolicy del dominio para reglas de negocio
 * ✅ Lanza errores tipados de la capa de aplicación
 * ✅ Retorna objetos de decisión estructurados
 *
 * CONSUMIDORES:
 * ============
 * - HabitSeriesController (actualmente)
 * - CreateThematicHabitSeriesUseCase (futuro use-case de creación real)
 * - Cualquier otro flujo que necesite validar si se puede crear una serie
 *
 * CONSOLIDACIÓN:
 * =============
 * Este servicio REEMPLAZA Y CONSOLIDA:
 * - application/use-cases/ValidatePlanAccess.js
 *   → funciones: validateFeatureAccess + validateActiveSeriesLimit
 * - application/use-cases/createHabitSeries.js
 *   → función: createHabitSeries (que solo validaba, no creaba)
 *
 * Ambos archivos hacían lecturas duplicadas del usuario y validaciones redundantes.
 * Este servicio centraliza toda esa lógica en un único punto de orquestación.
 */

import { hasFeatureAccess, getPlan } from '../../../domain/policies/PlanPolicy.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../errors/index.js';

/**
 * Determina el plan efectivo del usuario considerando el estado del trial
 *
 * Regla de negocio:
 * - Si el usuario tiene plan 'freemium' Y su trial está activo → plan efectivo es 'trial'
 * - En cualquier otro caso → el plan efectivo es el plan del usuario
 *
 * @param {object} user - Usuario de Firestore
 * @returns {string} - Plan efectivo ('freemium', 'trial', 'mini', 'base', 'pro')
 */
function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';

  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }

  return effectivePlan;
}

/**
 * Validar si el usuario puede crear una nueva serie de hábitos
 *
 * Realiza las siguientes validaciones en orden:
 * 1. El usuario existe en Firestore
 * 2. El usuario tiene acceso a la feature 'habits.series.create' según su plan
 * 3. El usuario no ha alcanzado el límite de series activas de su plan
 *
 * @param {string} userId - ID del usuario (Firebase Auth UID)
 * @param {object} deps - Dependencias inyectadas
 * @param {object} deps.userRepository - Repositorio de usuarios
 * @returns {Promise<{allowed: true} | {allowed: false, reason: string, ...}>}
 *
 * @throws {ValidationError} Si falta el userRepository
 *
 * Retorna:
 * - Si está permitido: { allowed: true }
 * - Si no está permitido: { allowed: false, reason: string, ...detalles }
 *
 * Posibles razones de rechazo:
 * - 'USER_NOT_FOUND': Usuario no existe en Firestore
 * - 'FEATURE_NOT_ALLOWED': El plan del usuario no tiene acceso a la feature
 * - 'LIMIT_REACHED': El usuario alcanzó el límite de series activas de su plan
 */
export async function assertCanCreateHabitSeries(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // 1. Cargar usuario UNA SOLA VEZ
  const user = await userRepository.getUser(userId);

  if (!user) {
    return {
      allowed: false,
      reason: 'USER_NOT_FOUND'
    };
  }

  // 2. Determinar plan efectivo (considerando trial)
  const effectivePlan = determineEffectivePlan(user);
  const planConfig = getPlan(effectivePlan, user.trial?.activo);

  // 3. Validar acceso a la feature 'habits.series.create'
  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.create');

  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'FEATURE_NOT_ALLOWED',
      planId: effectivePlan,
      featureKey: 'habits.series.create'
    };
  }

  // 4. Validar límite de series activas
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

  // ✅ Todas las validaciones pasaron
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
