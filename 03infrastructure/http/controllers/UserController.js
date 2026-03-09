/**
 * Layer: Infrastructure
 * File: UserController.js
 * Responsibility:
 * Adapts HTTP requests to user management use cases and translates application errors into HTTP responses.
 */

import { HTTP_STATUS } from '../HttpStatus.js';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { logger } from '../../logger/Logger.js';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getSubscriptionStatus,
} from '../../../02application/use-cases/ManageUser.js';
import { getUserDashboard } from '../../../02application/use-cases/GetUserDashboardUseCase.js';

// Dependency injection
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * GET /api/user/profile
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
 * GET /api/user/dashboard
 */
export async function getDashboard(req, res) {
  const userId = req.user?.uid;

  try {
    logger.info('[dashboard] request received', { userId });

    logger.info('[dashboard] executing GetUserDashboardUseCase', { userId });
    const dashboard = await getUserDashboard(userId, { userRepository });

    logger.info('[dashboard] dashboard computed', {
      userId,
      plan: dashboard.profile?.plan,
      activeSeriesCount: dashboard.limits?.activeSeriesCount,
      monthlyActionsRemaining: dashboard.limits?.monthlyActionsRemaining,
    });

    logger.info('[dashboard] response sent', { userId });
    res.status(HTTP_STATUS.OK).json(dashboard);
  } catch (err) {
    logger.error('[dashboard] error', {
      userId,
      message: err.message,
      stack: err.stack,
    });

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * DELETE /api/user/account
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
  getDashboard,
  setDependencies,
};
