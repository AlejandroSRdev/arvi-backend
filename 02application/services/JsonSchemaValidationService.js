/**
 * JsonSchemaValidationService (Application Service)
 *
 * ARCHITECTURE: Hexagonal - Application Layer
 * DATE: 2026-01-13
 *
 * RESPONSIBILITY:
 * ==============
 * This service performs final deterministic JSON schema validation.
 * It acts as the last technical validation step before data parsing.
 *
 * This corresponds to STEP 3️⃣ in the legacy implementation:
 * "TERCERA PASADA — Validación JSON final" (lines 203-216 in legacy)
 *
 * WHAT IT DOES:
 * ============
 * ✅ Accept raw AI output (string or object)
 * ✅ Accept a schema definition (structure to validate against)
 * ✅ Validate strictly that the output conforms to the schema structure
 * ✅ Return the validated JSON object unchanged if valid
 * ✅ Throw technical exception if validation fails
 *
 * WHAT IT MUST NOT DO:
 * ===================
 * ❌ Modify values in the output
 * ❌ Add defaults or fallback values
 * ❌ Normalize or transform content
 * ❌ Apply business logic or domain rules
 * ❌ Call AI or external services
 * ❌ Parse or interpret the semantic meaning of the data
 * ❌ Make any assumptions about missing fields (fail explicitly)
 *
 * FAILURE POLICY:
 * ==============
 * - If the schema does not match: throw ValidationError (technical failure)
 * - If JSON is malformed: throw ValidationError (technical failure)
 * - If required keys are missing: throw ValidationError (technical failure)
 * - Prefer explicit failure over silent correction
 *
 * INTEGRATION:
 * ===========
 * This service is used AFTER AI structured extraction and BEFORE parsing.
 * It ensures the AI output has the expected structure before any domain logic.
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:203-216
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
 * Validates that an object matches the expected schema structure recursively
 *
 * This performs STRICT structural validation:
 * - All keys in schema must exist in data
 * - All values must match the expected type
 * - Arrays must contain objects matching the schema template
 *
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
 * Parse AI output as JSON if it's a string
 *
 * Handles common AI output formats:
 * - Raw JSON objects
 * - JSON strings
 * - JSON wrapped in markdown code blocks
 *
 * @param {string|object} content - AI output to parse
 * @returns {object} Parsed JSON object
 * @throws {ValidationError} If parsing fails
 * @private
 */
function parseAIOutput(content) {
  // Already an object
  if (typeof content === 'object' && content !== null) {
    return content;
  }

  // Must be a string to parse
  if (typeof content !== 'string') {
    throw new ValidationError('AI output must be a string or object');
  }

  let cleanContent = content.trim();

  // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = cleanContent.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleanContent = codeBlockMatch[1].trim();
  }

  // Attempt JSON parse
  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    throw new ValidationError(
      `Failed to parse AI output as JSON: ${error.message}`
    );
  }
}

/**
 * Validate AI output against a JSON schema
 *
 * This is the FINAL DETERMINISTIC VALIDATION before parsing.
 * It ensures the AI output matches the expected structure exactly.
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:206-215
 *
 * Process:
 * 1. Parse AI output as JSON (handle string or object)
 * 2. Validate structure matches schema exactly
 * 3. Return validated object UNCHANGED
 * 4. Throw ValidationError on any failure
 *
 * @param {string|object} aiOutput - Raw AI response (string or object)
 * @param {object} schema - Schema definition (template structure)
 * @returns {object} Validated JSON object (unchanged)
 *
 * @throws {ValidationError} If output is not valid JSON
 * @throws {ValidationError} If structure doesn't match schema
 * @throws {ValidationError} If required fields are missing or invalid
 *
 * @example
 * const schema = {
 *   "title": "",
 *   "description": "",
 *   "actions": [
 *     { "name": "", "description": "", "difficulty": "" }
 *   ]
 * };
 *
 * const validated = validateJSONSchema(aiOutput, schema);
 * // Returns: { title: "...", description: "...", actions: [...] }
 */
export function validateJSONSchema(aiOutput, schema) {
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError('Schema must be a valid object');
  }

  // 1. Parse AI output as JSON
  const parsed = parseAIOutput(aiOutput);

  // 2. Validate structure against schema
  validateStructure(parsed, schema);

  // 3. Return validated object unchanged
  return parsed;
}

export default {
  validateJSONSchema,
};
