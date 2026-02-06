/**
 * Authentication Middleware (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/middleware/auth.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Validación de Firebase Auth tokens
 * - Decodificación de tokens
 * - Agregar usuario a req.user
 */

import { auth } from '../../persistence/firestore/FirebaseConfig.js';
import { AuthenticationError } from '../../../02application/application_errors/AuthenticationError.js';

/**
 * Middleware para validar Firebase Auth token
 * MIGRADO DESDE: src/middleware/auth.js:authenticate (líneas 13-37)
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token de autenticación no proporcionado');
    }

    const token = authHeader.split('Bearer ')[1];

    // Verificar token con Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);

    // Agregar usuario al request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
  console.error('❌ [Auth] Error validando token:', error.message);
  return next(
    error instanceof AuthenticationError
      ? error
      : new AuthenticationError('Token inválido o expirado')
  );
}
}

/**
 * Middleware opcional: permite requests sin autenticación
 * MIGRADO DESDE: src/middleware/auth.js:optionalAuth (líneas 42-61)
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    }

    next();
  } catch (error) {
    // Si falla, continuar sin usuario
    next();
  }
}

export default { authenticate, optionalAuth };
