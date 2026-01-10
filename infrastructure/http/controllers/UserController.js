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
 * - domain/use-cases/ManageUser.js:getUserProfile (líneas 20-36 del original)
 * - domain/use-cases/ManageUser.js:updateUserProfile (líneas 51-68 del original)
 * - domain/use-cases/ManageUser.js:deleteUserAccount (línea 104 del original)
 * - domain/use-cases/GetSubscriptionStatus.js (línea 84 del original)
 */

import { getUserProfile, updateUserProfile, deleteUserAccount } from '../../../domain/use-cases/ManageUser.js';
import { getSubscriptionStatus } from '../../../domain/use-cases/GetSubscriptionStatus.js';

// Dependency injection - estas serán inyectadas en runtime
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * GET /api/user/profile
 * Obtener perfil del usuario
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/userController.js:16-42
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza líneas 20-36 del original)
    const user = await getUserProfile(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:26-37
    res.json({
      success: true,
      user: user,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/userController.js:39-40
    logError('Error en getProfile:', err);
    next(err);
  }
}

/**
 * PUT /api/user/profile
 * Actualizar perfil del usuario
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/userController.js:48-74
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.uid;
    const { assistant, ...otherData } = req.body;

    // DELEGACIÓN A USE CASE (reemplaza líneas 53-61 del original)
    const updatedUser = await updateUserProfile(userId, { assistant }, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:63
    success(`Perfil actualizado: ${userId}`);

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:65-69
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/userController.js:71-72
    logError('Error en updateProfile:', err);
    next(err);
  }
}

/**
 * GET /api/user/subscription
 * Obtener estado de suscripción
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/userController.js:80-94
 */
export async function getSubscription(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza línea 84 del original)
    const subscription = await getSubscriptionStatus(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:86-89
    res.json({
      success: true,
      subscription,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/userController.js:91-92
    logError('Error en getSubscription:', err);
    next(err);
  }
}

/**
 * DELETE /api/user/account
 * Eliminar cuenta del usuario
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/userController.js:100-116
 */
export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user?.uid;

    // DELEGACIÓN A USE CASE (reemplaza línea 104 del original)
    await deleteUserAccount(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:106
    success(`Cuenta eliminada: ${userId}`);

    // EXTRACCIÓN EXACTA: src/controllers/userController.js:108-111
    res.json({
      success: true,
      message: 'Cuenta eliminada correctamente',
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/userController.js:113-114
    logError('Error en deleteAccount:', err);
    next(err);
  }
}

export default {
  getProfile,
  updateProfile,
  getSubscription,
  deleteAccount,
  setDependencies,
};
