/**
 * Global Error Middleware (Infrastructure - HTTP)
 *
 * Centralized error handling for all Express routes.
 *
 * Responsibilities:
 * - Detect BaseError subclasses and map them to HTTP responses via mapErrorToHttp
 * - Log all errors with structured context
 * - Return consistent HTTP error responses
 * - Handle unknown/unexpected errors safely
 *
 * This is the ONLY place where errors are logged and translated to HTTP.
 */

import { BaseError } from '../../../errors/base/BaseError.ts';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { logger } from '../../logger/logger.js';

/**
 * Express error middleware (must have 4 parameters for Express to recognize it)
 *
 * @param {unknown} err - The error thrown or passed via next(err)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function errorMiddleware(err, req, res, next) {
  if (err instanceof BaseError) {
    const httpError = mapErrorToHttp(err);

    logger.error(`[${req.method}] ${req.path} — ${err.name}: ${err.message}`, {
      code: err.code,
      metadata: err.metadata,
      ...(err.cause && { cause: String(err.cause) }),
    });

    return res.status(httpError.status).json(httpError.body);
  }

  // Unknown / unexpected error
  logger.error(`[${req.method}] ${req.path} — Unexpected error`, {
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