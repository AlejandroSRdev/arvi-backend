/**
 * Layer: Infrastructure
 * File: requestLogger.js
 * Responsibility:
 * Generates a requestId per HTTP request, attaches it to res.locals, and emits
 * http.request and http.response structured log events.
 */

import { randomUUID } from 'crypto';
import { logger } from '../../logger/Logger.js';
import { httpRequestsTotal, httpRequestDurationMs } from '../../metrics/AppMetrics.js';

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
    const route = (req.baseUrl ?? '') + (req.route?.path ?? 'unmatched');
    httpRequestsTotal.add(1, { method: req.method, route, status: String(res.statusCode) });
    httpRequestDurationMs.record(Date.now() - start, { method: req.method, route });
  });

  next();
}
