/**
 * Habit Series Controller (Infrastructure - HTTP Layer)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * RESPONSABILIDAD ÚNICA:
 * - Adaptar HTTP (req/res) → Use Cases
 * - Validar input HTTP
 * - Traducir errores a status codes
 * - NO contiene lógica de negocio
 *
 * LÓGICA DELEGADA A:
 * - domain/use-cases/createHabitSeries.js
 * - domain/use-cases/deleteHabitSeries.js
 */

import { createHabitSeries } from '../../../domain/use-cases/createHabitSeries.js';
import { deleteHabitSeries } from '../../../domain/use-cases/deleteHabitSeries.js';
import { success, error as logError } from '../../../shared/logger.js';

let userRepository;
let habitSeriesRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
  habitSeriesRepository = deps.habitSeriesRepository;
}

/**
 * POST /api/habits/series
 * Validar si el usuario puede crear una nueva serie de hábitos
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
 *   "limitType": "active_series", // solo si reason === "LIMIT_REACHED"
 *   "used": number,
 *   "max": number
 * }
 */
export async function createHabitSeriesEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const payload = req.body || {};

    const result = await createHabitSeries(userId, payload, { userRepository });

    if (!result.allowed) {
      const statusCode = result.reason === 'LIMIT_REACHED' ? 429 : 403;

      logError(`[Habit Series] Validación fallida para ${userId}: ${result.reason}`);

      return res.status(statusCode).json(result);
    }

    success(`[Habit Series] Validación exitosa para ${userId}`);

    res.json(result);
  } catch (err) {
    logError('[Habit Series] Error:', err);
    next(err);
  }
}

/**
 * DELETE /api/habits/series/:seriesId
 * Eliminar una serie de hábitos de Firestore y decrementar contador
 *
 * Request params:
 * - seriesId: ID de la serie a eliminar
 *
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Serie eliminada exitosamente",
 *   "deletedSeriesId": "abc123"
 * }
 *
 * Response 404:
 * {
 *   "success": false,
 *   "error": "SERIES_NOT_FOUND",
 *   "message": "Serie no encontrada o ya fue eliminada"
 * }
 *
 * Response 500:
 * {
 *   "success": false,
 *   "message": "Error eliminando serie"
 * }
 */
export async function deleteHabitSeriesEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const seriesId = req.params?.seriesId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Usuario no autenticado',
      });
    }

    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'seriesId es requerido',
      });
    }

    const result = await deleteHabitSeries({ userId, seriesId, habitSeriesRepository, userRepository });

    if (!result.ok) {
      const statusCode = result.reason === 'SERIES_NOT_FOUND' ? 404 : 500;

      logError(`[Habit Series] Delete fallido para ${userId}: ${result.reason}`);

      return res.status(statusCode).json({
        success: false,
        error: result.reason,
        message: result.reason === 'SERIES_NOT_FOUND'
          ? 'Serie no encontrada o ya fue eliminada'
          : 'Error eliminando serie',
      });
    }

    success(`[Habit Series] Delete exitoso para ${userId}, seriesId: ${seriesId}`);

    res.json({
      success: true,
      message: 'Serie eliminada exitosamente',
      deletedSeriesId: result.deletedSeriesId,
    });
  } catch (err) {
    logError('[Habit Series] Error en delete:', err);
    next(err);
  }
}

export default {
  createHabitSeriesEndpoint,
  deleteHabitSeriesEndpoint,
  setDependencies,
};
