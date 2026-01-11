/**
 * Energy Controller (Infrastructure - HTTP Layer)
 *
 * MIGRADO DESDE: src/controllers/energyController.js
 * REFACTORIZADO: 2025-12-29
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 *
 * RESPONSABILIDAD ÚNICA:
 * - Adaptar HTTP (req/res) → Use Cases
 * - Validar input HTTP
 * - Traducir errores a status codes
 * - NO contiene lógica de negocio
 *
 * LÓGICA MOVIDA A:
 * - application/use-cases/ConsumeEnergy.js:getUserEnergy
 * - application/use-cases/ActivateTrial.js
 * - application/use-cases/GetTrialStatus.js
 */

import { getUserEnergy } from '../../../application/use-cases/ConsumeEnergy.js';
import { activateTrial } from '../../../application/use-cases/ActivateTrial.js';
import { getTrialStatus } from '../../../application/use-cases/GetTrialStatus.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../../errorMapper.js';
import { error as logError, success } from '../../../utils/logger.js';

// Dependency injection
let energyRepository;
let userRepository;

export function setDependencies(deps) {
  energyRepository = deps.energyRepository;
  userRepository = deps.userRepository;
}

/**
 * GET /api/user/energy
 * Obtener energía actual del usuario
 */
export async function getEnergy(req, res) {
  try {
    const userId = req.user?.uid;

    const energy = await getUserEnergy(userId, { energyRepository, userRepository });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      energy,
    });
  } catch (err) {
    logError('Error en getEnergy:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * POST /api/user/trial/activate
 * Activar trial de 48 horas
 */
export async function activateTrialEndpoint(req, res) {
  try {
    const userId = req.user?.uid;

    const trialData = await activateTrial(userId, { userRepository });

    success(`Trial activado: ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: '48-hour trial successfully activated',
      trial: trialData,
    });
  } catch (err) {
    logError('Error en activateTrial:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * GET /api/user/trial/status
 * Obtener estado del trial
 */
export async function getTrialStatusEndpoint(req, res) {
  try {
    const userId = req.user?.uid;

    const status = await getTrialStatus(userId, { userRepository });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      trial: status,
    });
  } catch (err) {
    logError('Error en getTrialStatus:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  getEnergy,
  activateTrialEndpoint,
  getTrialStatusEndpoint,
  setDependencies,
};
