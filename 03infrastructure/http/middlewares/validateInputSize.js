/**
 * Input Size Validation Middleware (Infrastructure HTTP)
 *
 * MIGRADO DESDE: src/middleware/validateInputSize.js (COMPLETO)
 *
 * Middleware de Express para validar tamaño de inputs y prevenir abusos/costes innecesarios.
 * PURA INFRAESTRUCTURA HTTP: depende de req/res/next.
 *
 * USO:
 * router.post('/chat',
 *   authenticate,
 *   authorizeFeature('ai.chat'),
 *   validateInputSize({
 *     maxBodySize: 50 * 1024,
 *     fields: {
 *       messages: { type: 'array', maxLength: 20 },
 *       'messages[].content': { type: 'string', maxLength: 2000 }
 *     }
 *   }),
 *   controller
 * );
 *
 * IMPORTANTE:
 * - NO valida semántica, solo tamaños
 * - NO confía en validaciones del frontend
 * - Responde con 413 Payload Too Large
 * - Se ejecuta ANTES del controller
 *
 * Responsabilidades:
 * - Validar tamaño total del body HTTP
 * - Validar tamaño de campos individuales
 * - Validar arrays y objetos anidados
 * - Responder con errores HTTP apropiados
 */

import { ValidationError } from '../../../errors/index.ts';

/**
 * Calcula el tamaño aproximado en bytes de un objeto JSON
 * MIGRADO DESDE: src/middleware/validateInputSize.js:getBodySize (líneas 34-36)
 *
 * @param {any} obj - Objeto a medir
 * @returns {number} Tamaño en bytes
 */
function getBodySize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

/**
 * Cuenta las keys de un objeto (recursivo hasta nivel 1)
 * MIGRADO DESDE: src/middleware/validateInputSize.js:countObjectKeys (líneas 43-46)
 *
 * @param {object} obj - Objeto a analizar
 * @returns {number} Cantidad de keys
 */
function countObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.keys(obj).length;
}

/**
 * Middleware factory para validar tamaño de inputs
 * MIGRADO DESDE: src/middleware/validateInputSize.js:validateInputSize (líneas 56-109)
 *
 * @param {object} config - Configuración de validación
 * @param {number} config.maxBodySize - Tamaño máximo del body en bytes
 * @param {object} config.fields - Validaciones por campo
 * @returns {Function} Middleware de Express
 */
export function validateInputSize(config) {
  const { maxBodySize, fields } = config;

  return (req, res, next) => {
    try {
      // 1. Validar tamaño total del body
      if (maxBodySize) {
        const bodySize = getBodySize(req.body);

        if (bodySize > maxBodySize) {
          throw new ValidationError(
            `Body size (${bodySize} bytes) exceeds limit of ${maxBodySize} bytes`
          );
        }
      }

      // 2. Validar campos individuales
      if (fields) {
        for (const [fieldPath, rules] of Object.entries(fields)) {
          const validation = validateField(req.body, fieldPath, rules);

          if (!validation.valid) {
            throw new ValidationError(validation.message);
          }
        }
      }

      // 3. Validación exitosa
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Valida un campo específico del body
 * MIGRADO DESDE: src/middleware/validateInputSize.js:validateField (líneas 119-212)
 *
 * @param {object} body - Body del request
 * @param {string} fieldPath - Path del campo (ej: 'messages', 'messages[].content')
 * @param {object} rules - Reglas de validación
 * @returns {object} { valid: boolean, limit?: any, actual?: any, message?: string }
 */
function validateField(body, fieldPath, rules) {
  const { type, maxLength, maxKeys, required } = rules;

  // Manejar paths con array notation (ej: 'messages[].content')
  if (fieldPath.includes('[]')) {
    return validateArrayField(body, fieldPath, rules);
  }

  // Obtener valor del campo
  const value = getNestedValue(body, fieldPath);

  // Validar campo requerido
  if (required && (value === undefined || value === null)) {
    return {
      valid: false,
      limit: 'required',
      actual: 'missing',
      message: `El campo '${fieldPath}' es requerido`,
    };
  }

  // Si no es requerido y no existe, pasar
  if (value === undefined || value === null) {
    return { valid: true };
  }

  // Validar según tipo
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
 * Valida campos de arrays (ej: 'messages[].content')
 * MIGRADO DESDE: src/middleware/validateInputSize.js:validateArrayField (líneas 222-266)
 *
 * @param {object} body - Body del request
 * @param {string} fieldPath - Path con notación de array
 * @param {object} rules - Reglas de validación
 * @returns {object} Resultado de validación
 */
function validateArrayField(body, fieldPath, rules) {
  const [arrayPath, itemPath] = fieldPath.split('[].');
  const array = getNestedValue(body, arrayPath);

  // Verificar que sea un array
  if (!Array.isArray(array)) {
    return {
      valid: false,
      limit: 'array',
      actual: typeof array,
      message: `El campo '${arrayPath}' debe ser un array`,
    };
  }

  // Validar cada elemento del array
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const itemValue = itemPath ? getNestedValue(item, itemPath) : item;

    // Validar según tipo
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
 * Obtiene valor de un objeto usando path notation
 * MIGRADO DESDE: src/middleware/validateInputSize.js:getNestedValue (líneas 275-277)
 *
 * @param {object} obj - Objeto fuente
 * @param {string} path - Path del valor (ej: 'user.name', 'config.api.key')
 * @returns {any} Valor encontrado o undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export default validateInputSize;
