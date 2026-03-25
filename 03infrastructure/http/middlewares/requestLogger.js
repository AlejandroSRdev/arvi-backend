/**
 * Layer: Infrastructure
 * File: requestLogger.js
 * Responsibility:
 * Generates a requestId per HTTP request, attaches it to res.locals, and emits
 * http.request and http.response structured log events.
 */

import { randomUUID } from 'crypto';
import { logger } from '../../logger/Logger.js';

export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  const start = Date.now();

  logger.log('http.request', { requestId, method: req.method, path: req.path });

  res.on('finish', () => {
    logger.log('http.response', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });

  next();
}
