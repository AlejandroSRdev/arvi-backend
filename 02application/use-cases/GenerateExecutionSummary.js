/**
 * Generate Execution Summary Use Case (Domain)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * PATRÓN REPLICADO DE: createHabitSeries.js
 * Este flujo replica el patrón de crearSerieTematica para mantener contratos frontend-backend consistentes.
 *
 * Responsabilidades:
 * - Validar acceso a la feature de generación de resúmenes de ejecución
 * - Validar límite de resúmenes semanales
 * - NO genera el resumen (eso lo hace el servicio de IA después de la validación)
 * - NO persiste datos (eso lo hace el caller después de obtener el resumen)
 *
 * Flujo:
 * 1. Validar acceso a la feature execution.summary.generate
 * 2. Validar límite de resúmenes semanales (con reset lazy si aplica)
 * 3. Retornar { allowed: true } o { allowed: false, reason, ... }
 *
 * NO contiene:
 * - Lógica HTTP (req/res)
 * - Llamadas a IA
 * - Persistencia de datos
 * - Construcción de prompts
 */

import { validateFeatureAccess, validateWeeklySummariesLimit } from './ValidatePlanAccess.js';
import { ValidationError } from './errors/index.js';

/**
 * Validar si el usuario puede generar un resumen de ejecución
 *
 * @param {string} userId - ID del usuario
 * @param {object} payload - Payload de la request (no usado por ahora, pero preparado para futuras extensiones)
 * @param {object} deps - Dependencias inyectadas
 * @param {object} deps.userRepository - Repositorio de usuarios
 * @returns {Promise<{allowed: true} | {allowed: false, reason: string, ...}>}
 */
export async function generateExecutionSummary(userId, payload, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // 1. Validar acceso a la feature
  const featureAccess = await validateFeatureAccess(userId, 'execution.summary.generate', deps);

  if (!featureAccess.allowed) {
    return featureAccess;
  }

  // 2. Validar límite de resúmenes semanales
  const limitValidation = await validateWeeklySummariesLimit(userId, deps);

  if (!limitValidation.allowed) {
    return limitValidation;
  }

  // 3. Si todo está bien, permitir la ejecución
  return { allowed: true };
}

export default { generateExecutionSummary };
