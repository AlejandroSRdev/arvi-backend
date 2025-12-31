/**
 * Shared Logger
 *
 * ORIGEN: src/utils/logger.js (MOVIDO COMPLETO)
 *
 * Responsabilidades:
 * - Funciones de logging compartidas
 * - Utilidades de log
 *
 * CONTIENE:
 * - console.log wrappers
 * - Formateo de logs
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ℹ️  ${message}`);
  if (data && isDevelopment) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function error(message, err = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}`);
  if (err) {
    console.error(err);
  }
}

export function warn(message, data = null) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] ⚠️  ${message}`);
  if (data && isDevelopment) {
    console.warn(JSON.stringify(data, null, 2));
  }
}

export function success(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ ${message}`);
  if (data && isDevelopment) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export default { log, error, warn, success };
