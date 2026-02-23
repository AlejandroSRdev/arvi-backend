/**
 * Layer: Infrastructure
 * File: validateInputSize.js
 * Responsibility:
 * Express middleware that enforces byte and field size limits on incoming HTTP request bodies.
 */

import { ValidationError } from '../../../errors/Index.js';

function getBodySize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

function countObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.keys(obj).length;
}

/**
 * Middleware factory that validates the size of HTTP request body fields.
 *
 * @param {object} config
 * @param {number} config.maxBodySize - Maximum body size in bytes
 * @param {object} config.fields - Per-field validation rules
 * @returns {Function} Express middleware
 */
export function validateInputSize(config) {
  const { maxBodySize, fields } = config;

  return (req, res, next) => {
    try {
      if (maxBodySize) {
        const bodySize = getBodySize(req.body);

        if (bodySize > maxBodySize) {
          throw new ValidationError(
            `Body size (${bodySize} bytes) exceeds limit of ${maxBodySize} bytes`
          );
        }
      }

      if (fields) {
        for (const [fieldPath, rules] of Object.entries(fields)) {
          const validation = validateField(req.body, fieldPath, rules);

          if (!validation.valid) {
            throw new ValidationError(validation.message);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * @param {object} body
 * @param {string} fieldPath
 * @param {object} rules
 * @returns {{ valid: boolean, limit?: any, actual?: any, message?: string }}
 */
function validateField(body, fieldPath, rules) {
  const { type, maxLength, maxKeys, required } = rules;

  if (fieldPath.includes('[]')) {
    return validateArrayField(body, fieldPath, rules);
  }

  const value = getNestedValue(body, fieldPath);

  if (required && (value === undefined || value === null)) {
    return {
      valid: false,
      limit: 'required',
      actual: 'missing',
      message: `El campo '${fieldPath}' es requerido`,
    };
  }

  if (value === undefined || value === null) {
    return { valid: true };
  }

  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          valid: false,
          limit: 'string',
          actual: typeof value,
          message: `El campo '${fieldPath}' debe ser un string`,
        };
      }

      if (maxLength && value.length > maxLength) {
        return {
          valid: false,
          limit: maxLength,
          actual: value.length,
          message: `El campo '${fieldPath}' excede el límite de ${maxLength} caracteres (actual: ${value.length})`,
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          valid: false,
          limit: 'array',
          actual: typeof value,
          message: `El campo '${fieldPath}' debe ser un array`,
        };
      }

      if (maxLength && value.length > maxLength) {
        return {
          valid: false,
          limit: maxLength,
          actual: value.length,
          message: `El campo '${fieldPath}' excede el límite de ${maxLength} elementos (actual: ${value.length})`,
        };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        return {
          valid: false,
          limit: 'object',
          actual: Array.isArray(value) ? 'array' : typeof value,
          message: `El campo '${fieldPath}' debe ser un objeto`,
        };
      }

      if (maxKeys) {
        const keyCount = countObjectKeys(value);
        if (keyCount > maxKeys) {
          return {
            valid: false,
            limit: maxKeys,
            actual: keyCount,
            message: `El campo '${fieldPath}' excede el límite de ${maxKeys} keys (actual: ${keyCount})`,
          };
        }
      }
      break;
  }

  return { valid: true };
}

/**
 * @param {object} body
 * @param {string} fieldPath - Path with array notation (e.g., 'messages[].content')
 * @param {object} rules
 * @returns {{ valid: boolean, limit?: any, actual?: any, message?: string }}
 */
function validateArrayField(body, fieldPath, rules) {
  const [arrayPath, itemPath] = fieldPath.split('[].');
  const array = getNestedValue(body, arrayPath);

  if (!Array.isArray(array)) {
    return {
      valid: false,
      limit: 'array',
      actual: typeof array,
      message: `El campo '${arrayPath}' debe ser un array`,
    };
  }

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const itemValue = itemPath ? getNestedValue(item, itemPath) : item;

    const { type, maxLength } = rules;

    if (type === 'string') {
      if (typeof itemValue !== 'string') {
        return {
          valid: false,
          limit: 'string',
          actual: typeof itemValue,
          message: `El elemento ${arrayPath}[${i}].${itemPath} debe ser un string`,
        };
      }

      if (maxLength && itemValue.length > maxLength) {
        return {
          valid: false,
          limit: maxLength,
          actual: itemValue.length,
          message: `El elemento ${arrayPath}[${i}].${itemPath} excede el límite de ${maxLength} caracteres (actual: ${itemValue.length})`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * @param {object} obj
 * @param {string} path - Dot-notation path (e.g., 'user.name')
 * @returns {any}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export default validateInputSize;
