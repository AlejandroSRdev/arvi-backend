/**
 * Create Habit Series Use Case (Domain)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * Responsabilidades:
 * - Validar acceso a la feature de creación de series
 * - Validar límite de series activas
 * - NO genera contenido (eso lo hace el frontend con IA)
 * - NO persiste datos (eso lo hace el frontend después de validar)
 *
 * Flujo:
 * 1. Validar acceso a la feature habits.series.create
 * 2. Validar límite de series activas
 * 3. Retornar { allowed: true } o { allowed: false, reason, ... }
 *
 * NO contiene:
 * - Lógica HTTP (req/res)
 * - Llamadas a IA
 * - Persistencia de datos
 * - Construcción de prompts
 */

import { validateFeatureAccess, validateActiveSeriesLimit } from './ValidatePlanAccess.js';
import { ValidationError } from '../errors/index.js';

/**
 * Validar si el usuario puede crear una nueva serie de hábitos
 *
 * @param {string} userId - ID del usuario
 * @param {object} payload - Payload de la request (no usado por ahora, pero preparado para futuras extensiones)
 * @param {object} deps - Dependencias inyectadas
 * @param {object} deps.userRepository - Repositorio de usuarios
 * @returns {Promise<{allowed: true} | {allowed: false, reason: string, ...}>}
 */
export async function createHabitSeries(userId, payload, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const featureAccess = await validateFeatureAccess(userId, 'habits.series.create', deps);

  if (!featureAccess.allowed) {
    return featureAccess;
  }

  const limitValidation = await validateActiveSeriesLimit(userId, deps);

  if (!limitValidation.allowed) {
    return limitValidation;
  }

  return { allowed: true };
}

export default { createHabitSeries };
