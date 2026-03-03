/**
 * Layer: Infrastructure
 * File: Logger.js
 * Responsibility:
 * Provides a structured logging adapter wrapping Node.js console for consistent output across the infrastructure layer.
 */

export const logger = {
  error(message, error) {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(error);
    }
  },

  success(message, data) {
    console.log(`[SUCCESS] ${message}`);
    if (data) {
      console.log(data);
    }
  },

  info(message, data) {
    console.log(`[INFO] ${message}`);
    if (data) {
      console.log(data);
    }
  },

  // Structured billing observability — outputs a single JSON line per trace point.
  // Each record is self-contained: event name + correlation fields + timestamp.
  log(event, data = {}) {
    console.log(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
  },

  logError(event, data = {}) {
    console.error(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
  },
};
