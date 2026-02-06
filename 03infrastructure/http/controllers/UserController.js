/**
 * User Controller (Infrastructure - HTTP Layer)
 *
 * MIGRADO DESDE: src/controllers/userController.js
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
 * - application/use-cases/ManageUser.js:getUserProfile
 * - application/use-cases/ManageUser.js:updateUserProfile
 * - application/use-cases/ManageUser.js:deleteUserAccount
 * - application/use-cases/GetSubscriptionStatus.js
 */

import { getUserProfile, updateUserProfile, deleteUserAccount } from '../../../02application/use-cases/ManageUser.js';
import { getSubscriptionStatus } from '../../../02application/use-cases/GetSubscriptionStatus.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../errorMapper.js';
import { logger } from '../../logger/logger.js';

// Dependency injection
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * GET /api/user/profile
 * Obtener perfil del usuario
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user?.uid;

    const user = await getUserProfile(userId, { userRepository });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: user,
    });
  } catch (err) {
    logger.error('Error en getProfile:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * PUT /api/user/profile
 * Actualizar perfil del usuario
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user?.uid;
    const { assistant } = req.body;

    const updatedUser = await updateUserProfile(userId, { assistant }, { userRepository });

    logger.success(`Perfil actualizado: ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (err) {
    logger.error('Error en updateProfile:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * GET /api/user/subscription
 * Obtener estado de suscripción
 */
export async function getSubscription(req, res) {
  try {
    const userId = req.user?.uid;

    const subscription = await getSubscriptionStatus(userId, { userRepository });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      subscription,
    });
  } catch (err) {
    logger.error('Error en getSubscription:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * DELETE /api/user/account
 * Eliminar cuenta del usuario
 */
export async function deleteAccount(req, res) {
  try {
    const userId = req.user?.uid;

    await deleteUserAccount(userId, { userRepository });

    logger.success(`Cuenta eliminada: ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Cuenta eliminada correctamente',
    });
  } catch (err) {
    logger.error('Error en deleteAccount:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  getProfile,
  updateProfile,
  getSubscription,
  deleteAccount,
  setDependencies,
};
