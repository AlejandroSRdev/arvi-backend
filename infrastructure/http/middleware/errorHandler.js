/**
 * Error Handler Middleware (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/middleware/errorHandler.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Manejo global de errores
 * - Conversión de errores a respuestas HTTP
 * - Logging de errores
 */

import { log, error as logError } from '../../../shared/logger.js';

/**
 * Middleware global de manejo de errores
 * MIGRADO DESDE: src/middleware/errorHandler.js:errorHandler (líneas 9-22)
 */
export function errorHandler(err, req, res, next) {
  // Log del error
  logError(`Error en ${req.method} ${req.path}:`, err);

  // Respuesta según tipo de error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;
