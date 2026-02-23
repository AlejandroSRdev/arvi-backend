/**
 * Layer: Application
 * File: JsonSchemaValidationService.js
 * Responsibility:
 * Validates AI output against a structural schema before data is passed to the parsing layer.
 */

import { ValidationError } from '../../errors/Index.js';

/**
 * Validates that a value is a non-empty string
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 * @private
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a non-empty array
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 * @private
 */
function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

/**
 * @param {object} data - Data to validate
 * @param {object} schema - Schema definition (template structure)
 * @returns {boolean}
 * @throws {ValidationError} If validation fails with specific reason
 * @private
 */
function validateStructure(data, schema) {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Data must be an object');
  }

  // Validate all required keys from schema exist in data
  for (const key of Object.keys(schema)) {
    if (!(key in data)) {
      throw new ValidationError(`Missing required key: "${key}"`);
    }

    const schemaValue = schema[key];
    const dataValue = data[key];

    // Handle array validation
    if (Array.isArray(schemaValue)) {
      if (!Array.isArray(dataValue)) {
        throw new ValidationError(`Key "${key}" must be an array`);
      }

      if (dataValue.length === 0) {
        throw new ValidationError(`Key "${key}" must be a non-empty array`);
      }

      // Validate each array element against the schema template
      const elementSchema = schemaValue[0];
      if (typeof elementSchema === 'object' && elementSchema !== null) {
        for (let i = 0; i < dataValue.length; i++) {
          try {
            validateStructure(dataValue[i], elementSchema);
          } catch (error) {
            throw new ValidationError(
              `Validation failed for ${key}[${i}]: ${error.message}`
            );
          }
        }
      }
    }
    // Handle nested object validation
    else if (typeof schemaValue === 'object' && schemaValue !== null) {
      if (typeof dataValue !== 'object' || dataValue === null) {
        throw new ValidationError(`Key "${key}" must be an object`);
      }
      validateStructure(dataValue, schemaValue);
    }
    // Handle string validation (empty string check)
    else if (schemaValue === '') {
      if (!isNonEmptyString(dataValue)) {
        throw new ValidationError(`Key "${key}" must be a non-empty string`);
      }
    }
  }

  return true;
}

/**
 * @param {string|object} content - AI output to parse
 * @returns {object} Parsed JSON object
 * @throws {ValidationError} If parsing fails
 * @private
 */
function parseAIOutput(content) {
  if (typeof content === 'object' && content !== null) {
    return content;
  }

  if (typeof content !== 'string') {
    throw new ValidationError('AI output must be a string or object');
  }

  let cleanContent = content.trim();

  // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = cleanContent.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleanContent = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    throw new ValidationError(
      `Failed to parse AI output as JSON: ${error.message}`
    );
  }
}

/**
 * Validate AI output against a JSON schema.
 * Must run after AI structured extraction and before any parsing or domain logic.
 *
 * @param {string|object} aiOutput - Raw AI response (string or object)
 * @param {object} schema - Schema definition (template structure)
 * @returns {object} Validated JSON object (unchanged)
 * @throws {ValidationError} If output is not valid JSON, structure doesn't match, or required fields are missing
 */
export function validateJSONSchema(aiOutput, schema) {
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError('Schema must be a valid object');
  }

  const parsed = parseAIOutput(aiOutput);
  validateStructure(parsed, schema);
  return parsed;
}

export default {
  validateJSONSchema,
};
