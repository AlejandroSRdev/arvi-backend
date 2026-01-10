/**
 * Auth Controller (Infrastructure - HTTP Layer)
 *
 * MIGRADO DESDE: src/controllers/authController.js
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
 * - domain/use-cases/CreateUser.js (líneas 31-36 del original)
 * - domain/use-cases/ManageUser.js:updateLastLogin (línea 68 del original)
 */

import { createUser } from '../../../domain/use-cases/CreateUser.js';
import { updateLastLogin } from '../../../domain/use-cases/ManageUser.js';
import { validateEmail } from '../../../domain/validators/InputValidator.js';

// Dependency injection - estas serán inyectadas en runtime
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/authController.js:17-53
 */
export async function register(req, res, next) {
  try {
    const { email, userId } = req.body;

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:22-28
    // Validaciones HTTP
    if (!email || !userId) {
      throw new ValidationError('Email y userId son requeridos');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Email inválido');
    }

    // DELEGACIÓN A USE CASE (reemplaza líneas 31-36 del original)
    const newUser = await createUser(userId, { email }, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:38
    success(`Usuario registrado: ${userId}`);

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:40-48
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: {
        id: userId,
        email: newUser.email,
        plan: newUser.plan,
      },
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/authController.js:50-51
    logError('Error en register:', err);
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Actualizar último login
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/authController.js:59-81
 */
export async function login(req, res, next) {
  try {
    const userId = req.user?.uid;

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:63-65
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // DELEGACIÓN A USE CASE (reemplaza línea 68 del original)
    await updateLastLogin(userId, { userRepository });

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:70
    success(`Login exitoso: ${userId}`);

    // EXTRACCIÓN EXACTA: src/controllers/authController.js:72-76
    res.json({
      success: true,
      message: 'Login exitoso',
      userId,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/authController.js:78-79
    logError('Error en login:', err);
    next(err);
  }
}

export default {
  register,
  login,
  setDependencies,
};
