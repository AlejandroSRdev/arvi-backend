/**
 * Layer: Infrastructure
 * File: Logger.js
 * Responsibility:
 * Provides a structured logging adapter wrapping Node.js console for consistent output across the infrastructure layer.
 */

function emit(level, event, data = {}) {
  const output = { level, event, ts: new Date().toISOString(), ...data };
  if (level === 'error') {
    console.error(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output));
  }
}

export const logger = {
  log(event, data = {}) { emit('info', event, data); },
  logError(event, data = {}) { emit('error', event, data); },

  // Backward-compatible wrappers — no new code should use these.
  info(message, data = {}) { emit('info', 'log', { message, ...data }); },
  error(message, data = {}) { emit('error', 'log', { message, ...data }); },
  success(message, data = {}) { emit('info', 'log', { message, ...data }); },
};
