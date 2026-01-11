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
 * - application/use-cases/createHabitSeries.js
 * - application/use-cases/deleteHabitSeries.js
 */

import { createHabitSeries } from '../../../application/use-cases/createHabitSeries.js';
import { deleteHabitSeries } from '../../../application/use-cases/deleteHabitSeries.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../errorMapper.js';
import { logger } from '../../logger/logger.js';

let userRepository;
let habitSeriesRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
  habitSeriesRepository = deps.habitSeriesRepository;
}

/**
 * POST /api/habits/series
 * Validar si el usuario puede crear una nueva serie de hábitos
 */
export async function createHabitSeriesEndpoint(req, res) {
  try {
    const userId = req.user?.uid;
    const payload = req.body || {};

    const result = await createHabitSeries(userId, payload, { userRepository });

    if (!result.allowed) {
      const statusCode = result.reason === 'LIMIT_REACHED' ? 429 : HTTP_STATUS.FORBIDDEN;

      logger.error(`[Habit Series] Validación fallida para ${userId}: ${result.reason}`);

      return res.status(statusCode).json(result);
    }

    logger.success(`[Habit Series] Validación exitosa para ${userId}`);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    logger.error('[Habit Series] Error:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * DELETE /api/habits/series/:seriesId
 * Eliminar una serie de hábitos de Firestore y decrementar contador
 */
export async function deleteHabitSeriesEndpoint(req, res) {
  try {
    const userId = req.user?.uid;
    const seriesId = req.params?.seriesId;

    await deleteHabitSeries({ userId, seriesId, habitSeriesRepository, userRepository });

    logger.success(`[Habit Series] Delete exitoso para ${userId}, seriesId: ${seriesId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Serie eliminada exitosamente',
      deletedSeriesId: seriesId,
    });
  } catch (err) {
    logger.error('[Habit Series] Error en delete:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json({
      success: false,
      error: httpError.body.error,
      message: httpError.body.message,
    });
  }
}

export default {
  createHabitSeriesEndpoint,
  deleteHabitSeriesEndpoint,
  setDependencies,
};
