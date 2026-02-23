/**
 * Layer: Infrastructure
 * File: errorHandler.js
 * Responsibility:
 * Express middleware that catches unhandled errors and translates them into HTTP error responses.
 */

export function errorHandler(err, req, res, next) {
  console.error(`Error en ${req.method} ${req.path}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;
