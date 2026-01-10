/**
 * Execution Summary Controller (Infrastructure - HTTP Layer)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * PATRÓN REPLICADO DE: HabitSeriesController.js
 * Este flujo replica el patrón de crearSerieTematica para mantener contratos frontend-backend consistentes.
 *
 * RESPONSABILIDAD ÚNICA:
 * - Adaptar HTTP (req/res) → Use Cases
 * - Validar input HTTP
 * - Traducir errores a status codes
 * - NO contiene lógica de negocio
 *
 * LÓGICA DELEGADA A:
 * - domain/use-cases/GenerateExecutionSummary.js
 */

import { generateExecutionSummary } from '../../../domain/use-cases/GenerateExecutionSummary.js';
import { success, error as logError } from '../../../shared/logger.js';

let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * POST /api/execution-summaries
 * Validar si el usuario puede generar un resumen de ejecución
 *
 * Request body: (payload vacío por ahora, preparado para extensiones futuras)
 * {}
 *
 * Response 200:
 * { "allowed": true }
 *
 * Response 403/429:
 * {
 *   "allowed": false,
 *   "reason": "LIMIT_REACHED" | "FEATURE_NOT_ALLOWED" | "USER_NOT_FOUND",
 *   "limitType": "weekly_summaries", // solo si reason === "LIMIT_REACHED"
 *   "used": number,
 *   "max": number,
 *   "resetIn": number // días hasta el reset (solo si reason === "LIMIT_REACHED")
 * }
 */
export async function generateExecutionSummaryEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const payload = req.body || {};

    const result = await generateExecutionSummary(userId, payload, { userRepository });

    if (!result.allowed) {
      // 429 para límites alcanzados, 403 para todo lo demás
      const statusCode = result.reason === 'LIMIT_REACHED' ? 429 : 403;

      logError(`[Execution Summary] Validación fallida para ${userId}: ${result.reason}`);

      return res.status(statusCode).json(result);
    }

    success(`[Execution Summary] Validación exitosa para ${userId}`);

    res.json(result);
  } catch (err) {
    logError('[Execution Summary] Error:', err);
    next(err);
  }
}

export default {
  generateExecutionSummaryEndpoint,
  setDependencies,
};
