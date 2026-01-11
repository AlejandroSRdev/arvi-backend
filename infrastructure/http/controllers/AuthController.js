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
 * - application/use-cases/CreateUser.js
 * - application/use-cases/ManageUser.js:updateLastLogin
 */

import { createUser } from '../../../application/use-cases/CreateUser.js';
import { updateLastLogin } from '../../../application/use-cases/ManageUser.js';
import { validateEmail } from '../../../domain/validators/InputValidator.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../../errorMapper.js';
import { error as logError, success } from '../../../utils/logger.js';

// Dependency injection
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
export async function register(req, res) {
  try {
    const { email, userId } = req.body;

    // Validaciones HTTP
    if (!email || !userId) {
      const err = new Error('Email y userId son requeridos');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!validateEmail(email)) {
      const err = new Error('Email inválido');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const newUser = await createUser(userId, { email }, { userRepository });

    success(`Usuario registrado: ${userId}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: {
        id: userId,
        email: newUser.email,
        plan: newUser.plan,
      },
    });
  } catch (err) {
    logError('Error en register:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * POST /api/auth/login
 * Actualizar último login
 */
export async function login(req, res) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      const err = new Error('Usuario no autenticado');
      err.code = 'AUTHENTICATION_ERROR';
      throw err;
    }

    await updateLastLogin(userId, { userRepository });

    success(`Login exitoso: ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login exitoso',
      userId,
    });
  } catch (err) {
    logError('Error en login:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  register,
  login,
  setDependencies,
};
