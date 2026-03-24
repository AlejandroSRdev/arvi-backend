/**
 * Layer: Infrastructure
 * File: errorMiddleware.js
 * Responsibility:
 * Express error middleware that maps BaseError subclasses to HTTP responses and logs all errors before responding.
 */

import { BaseError } from '../../../errors/base/BaseError.js';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { logger } from '../../logger/Logger.js';

/**
 * Must have 4 parameters for Express to recognize it as an error-handling middleware.
 *
 * @param {unknown} err - The error thrown or passed via next(err)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function errorMiddleware(err, req, res, next) {
  const requestId = res.locals?.requestId;

  if (err instanceof BaseError) {
    const httpError = mapErrorToHttp(err);

    logger.logError('http.error', {
      requestId,
      method: req.method,
      path: req.path,
      status: httpError.status,
      errorCode: err.code,
      message: err.message,
      metadata: err.metadata,
      ...(err.cause && { cause: String(err.cause) }),
    });

    return res.status(httpError.status).json(httpError.body);
  }

  logger.logError('http.unexpected_error', {
    requestId,
    method: req.method,
    path: req.path,
    status: 500,
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected error occurred',
  });
}

export default errorMiddleware;
