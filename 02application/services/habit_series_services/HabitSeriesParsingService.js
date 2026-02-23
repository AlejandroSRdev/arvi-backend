/**
 * Layer: Application
 * File: HabitSeriesParsingService.js
 * Responsibility:
 * Extracts and normalizes schema-validated AI output into a clean DTO ready for domain entity instantiation.
 */

import { ValidationError } from '../../../errors/Index.js';

/**
 * Normalize difficulty string to canonical English values (case-insensitive).
 * Accepts both Spanish and English inputs: "media"/"medium" → "medium", "alta"/"high" → "high", anything else → "low".
 *
 * @param {string} difficultyStr - Raw difficulty string from AI
 * @returns {"low"|"medium"|"high"} Normalized English difficulty
 * @private
 */
function normalizeDifficulty(difficultyStr) {
  if (!difficultyStr) {
    return 'low';
  }

  const normalized = difficultyStr.toString().toLowerCase().trim();

  if (['media', 'medium'].includes(normalized)) {
    return 'medium';
  }

  if (['alta', 'high'].includes(normalized)) {
    return 'high';
  }

  return 'low';
}

/**
 * @param {object} json - Validated JSON object
 * @throws {ValidationError} If required keys are missing
 * @private
 */
function validateRequiredKeys(json) {
  const requiredKeys = ['title', 'description', 'actions'];

  for (const key of requiredKeys) {
    if (!(key in json)) {
      throw new ValidationError(
        `Incomplete JSON structure: missing key "${key}"`
      );
    }
  }

  if (!Array.isArray(json.actions)) {
    throw new ValidationError(
      'Incomplete JSON structure: "actions" must be an array'
    );
  }

  if (json.actions.length === 0) {
    throw new ValidationError(
      'Incomplete JSON structure: "actions" cannot be empty'
    );
  }
}

/**
 * @param {object} actionJson - Single action object from AI output
 * @param {number} index - Index in array (for error messages)
 * @returns {object} Normalized action { name, description, difficulty }
 * @throws {ValidationError} If action structure is invalid
 * @private
 */
function parseAction(actionJson, index) {
  if (typeof actionJson !== 'object' || actionJson === null) {
    throw new ValidationError(
      `Action at index ${index} is invalid: must be an object`
    );
  }

  const name = actionJson.name?.toString() || 'Unnamed action';
  const description = actionJson.description?.toString() || 'No description';
  const rawDifficulty = actionJson.difficulty;
  const difficulty = normalizeDifficulty(rawDifficulty);

  return {
    name,
    description,
    difficulty,
  };
}

/**
 * Parse habit series data from schema-validated JSON.
 * Stops before domain entity instantiation — returns a plain DTO only.
 *
 * @param {object} validatedJSON - Schema-validated JSON object
 * @returns {object} Parsed DTO { title, description, actions: [{name, description, difficulty}] }
 * @throws {ValidationError} If structure is incomplete or any action is malformed
 */
export function parseHabitSeriesData(validatedJSON) {
  if (!validatedJSON || typeof validatedJSON !== 'object') {
    throw new ValidationError('Input must be a validated JSON object');
  }

  validateRequiredKeys(validatedJSON);

  const title = validatedJSON.title.toString();
  const description = validatedJSON.description.toString();
  const actions = validatedJSON.actions.map((actionJson, index) => {
    return parseAction(actionJson, index);
  });

  // Returns here — domain entity instantiation is the caller's responsibility
  return {
    title,
    description,
    actions,
  };
}

export default {
  parseHabitSeriesData,
};
