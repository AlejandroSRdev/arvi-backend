/**
 * Create User Use Case (Domain)
 *
 * MIGRADO DESDE: src/controllers/authController.js (líneas 31-36)
 * EXTRACCIÓN: Creación de usuario nuevo
 *
 * Responsabilidades:
 * - Crear usuario en el sistema con configuración inicial
 * - Asignar plan freemium por defecto
 * - Inicializar energía a 0 (activación de trial posterior)
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Validación de email (eso está en el controller)
 * - Lógica HTTP
 * - Acceso directo a Firestore
 */

import { ValidationError } from './errors/index.js';

/**
 * Crear nuevo usuario en el sistema
 *
 * MIGRADO DESDE: src/controllers/authController.js:register (líneas 31-36)
 *
 * @param {string} userId - ID del usuario (provisto por Firebase Auth)
 * @param {Object} userData - Datos del usuario {email}
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Usuario creado
 */
export async function createUser(userId, userData, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const { email } = userData;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  // EXTRACCIÓN EXACTA: src/controllers/authController.js:31-36
  // Crear usuario con configuración inicial freemium
  const newUser = await userRepository.createUser(userId, {
    email,
    plan: 'freemium',
    energiaInicial: 0,
    energiaMaxima: 0,
  });

  return newUser;
}

export default {
  createUser,
};
