/**
 * Manage User Use Case (Domain)
 *
 * MIGRADO DESDE:
 * - src/controllers/authController.js (líneas 68)
 * - src/controllers/userController.js (líneas 20-104)
 *
 * Responsabilidades:
 * - Obtener perfil de usuario
 * - Actualizar perfil de usuario
 * - Actualizar último login
 * - Eliminar cuenta de usuario
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Lógica HTTP
 * - Validaciones de permisos
 * - Acceso directo a Firestore
 */

import { ValidationError, NotFoundError } from './errors/index.js';

/**
 * Obtener perfil completo del usuario
 *
 * MIGRADO DESDE: src/controllers/userController.js:getProfile (líneas 20-36)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Perfil del usuario
 */
export async function getUserProfile(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  // EXTRACCIÓN EXACTA: src/controllers/userController.js:26-36
  // Retornar solo campos permitidos (sin datos internos)
  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    energia: user.energia,
    trial: user.trial,
    limits: user.limits,
    assistant: user.assistant,
  };
}

/**
 * Actualizar perfil del usuario
 *
 * MIGRADO DESDE: src/controllers/userController.js:updateProfile (líneas 51-68)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Datos a actualizar {assistant}
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Usuario actualizado
 */
export async function updateUserProfile(userId, updates, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // EXTRACCIÓN EXACTA: src/controllers/userController.js:53-59
  // Solo permitir actualizar ciertos campos
  const allowedUpdates = ['assistant'];
  const safeUpdates = {};

  if (updates.assistant) {
    safeUpdates.assistant = updates.assistant;
  }

  // EXTRACCIÓN EXACTA: src/controllers/userController.js:61
  const updatedUser = await userRepository.updateUser(userId, safeUpdates);

  return updatedUser;
}

/**
 * Actualizar último login del usuario
 *
 * MIGRADO DESDE: src/controllers/authController.js:login (línea 68)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // EXTRACCIÓN EXACTA: src/controllers/authController.js:68
  await userRepository.updateUser(userId, {
    lastLogin: new Date(),
  });
}

/**
 * Eliminar cuenta del usuario
 *
 * MIGRADO DESDE: src/controllers/userController.js:deleteAccount (línea 104)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<void>}
 */
export async function deleteUserAccount(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // EXTRACCIÓN EXACTA: src/controllers/userController.js:104
  await userRepository.deleteUser(userId);
}

export default {
  getUserProfile,
  updateUserProfile,
  updateLastLogin,
  deleteUserAccount,
};
