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
 * - domain/use-cases/ConsumeEnergy.js:getUserEnergy (línea 21 del original)
 * - domain/use-cases/ActivateTrial.js (línea 53 del original)
 * - domain/use-cases/GetTrialStatus.js (línea 82 del original)
 */

import { getUserEnergy } from '../../../domain/use-cases/ConsumeEnergy.js';
import { activateTrial } from '../../../domain/use-cases/ActivateTrial.js';
import { getTrialStatus } from '../../../domain/use-cases/GetTrialStatus.js';

// Dependency injection - estas serán inyectadas en runtime
let energyRepository;
let userRepository;

export function setDependencies(deps) {
  energyRepository = deps.energyRepository;
  userRepository = deps.userRepository;
}

/**
 * GET /api/user/energy
 * Obtener energía actual del usuario
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/energyController.js:17-31
 */
export async function getEnergy(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza línea 21 del original)
    const energy = await getUserEnergy(userId, { energyRepository, userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:23-26
    res.json({
      success: true,
      energy,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:28-29
    logError('Error en getEnergy:', err);
    next(err);
  }
}

/**
 * POST /api/user/trial/activate
 * Activar trial de 48 horas
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/energyController.js:49-72
 */
export async function activateTrialEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza línea 53 del original)
    const trialData = await activateTrial(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:55
    success(`Trial activado: ${userId}`);

    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:57-61
    res.json({
      success: true,
      message: '48-hour trial successfully activated',
      trial: trialData,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:63-70
    logError('Error en activateTrial:', err);

    // Si ya fue usado, devolver error específico
    if (err.message.includes('ya fue activado')) {
      next(new TrialAlreadyUsedError());
    } else {
      next(err);
    }
  }
}

/**
 * GET /api/user/trial/status
 * Obtener estado del trial
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/energyController.js:78-92
 */
export async function getTrialStatusEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza línea 82 del original)
    const status = await getTrialStatus(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:84-87
    res.json({
      success: true,
      trial: status,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/energyController.js:89-90
    logError('Error en getTrialStatus:', err);
    next(err);
  }
}

export default {
  getEnergy,
  activateTrialEndpoint,
  getTrialStatusEndpoint,
  setDependencies,
};
