/**
 * Execution Summary Controller (Infrastructure - HTTP Layer)
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
 * - application/use-cases/GenerateExecutionSummary.js
 */

import { generateExecutionSummary } from '../../../application/use-cases/GenerateExecutionSummary.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../errorMapper.js';
import { logger } from '../../logger/logger.js';

let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * POST /api/execution-summaries
 * Validar si el usuario puede generar un resumen de ejecución
 */
export async function generateExecutionSummaryEndpoint(req, res) {
  try {
    const userId = req.user?.uid;
    const payload = req.body || {};

    const result = await generateExecutionSummary(userId, payload, { userRepository });

    if (!result.allowed) {
      const statusCode = result.reason === 'LIMIT_REACHED' ? 429 : HTTP_STATUS.FORBIDDEN;

      logger.error(`[Execution Summary] Validación fallida para ${userId}: ${result.reason}`);

      return res.status(statusCode).json(result);
    }

    logger.success(`[Execution Summary] Validación exitosa para ${userId}`);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    logger.error('[Execution Summary] Error:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  generateExecutionSummaryEndpoint,
  setDependencies,
};
