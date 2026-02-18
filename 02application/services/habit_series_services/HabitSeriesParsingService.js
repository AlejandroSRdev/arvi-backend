/**
 * HabitSeriesParsingService (Application Service)
 *
 * ARCHITECTURE: Hexagonal - Application Layer
 * DATE: 2026-01-13
 *
 * RESPONSIBILITY:
 * ==============
 * This service extracts and normalizes data from schema-validated JSON
 * into a clean structure ready for domain entity instantiation.
 *
 * This corresponds to STEP 4 in the legacy implementation:
 * "PARSING AND FINAL CREATION" (lines 218-247 in legacy)
 *
 * CRITICAL: This service implements ONLY the parsing/extraction logic.
 * It stops BEFORE domain entity instantiation (lines 239-257 in legacy).
 *
 * WHAT IT DOES:
 * ============
 * ✅ Accept a schema-validated JSON object
 * ✅ Extract required fields (title, description, actions)
 * ✅ Normalize difficulty values EXACTLY as legacy
 * ✅ Provide defaults for optional fields (name, description in actions)
 * ✅ Return a clean, structured DTO ready for domain layer
 * ✅ Throw explicit errors if required fields are missing or malformed
 *
 * WHAT IT MUST NOT DO:
 * ===================
 * ❌ Validate JSON schema (that's JsonSchemaValidationService's job)
 * ❌ Call AI or external services
 * ❌ Instantiate domain entities (Action, HabitSeries)
 * ❌ Apply business rules or domain policies
 * ❌ Calculate scores or derived values
 * ❌ Add business logic (e.g., ID generation, ranking, timestamps)
 * ❌ Access infrastructure (database, HTTP, AI)
 *
 * NORMALIZATION RULES (from legacy lines 232-237):
 * ================================================
 * Difficulty normalization (case-insensitive):
 * - "media" or "medium" → "medium"
 * - "alta" or "high" → "high"
 * - anything else (including "baja", "low", empty) → "low"
 *
 * This normalization ensures consistent English difficulty values
 * aligned with the Difficulty domain enum (low, medium, high).
 *
 * FAILURE POLICY:
 * ==============
 * - Missing required top-level keys → throw ValidationError
 * - Invalid action structure → throw ValidationError
 * - Empty or malformed arrays → throw ValidationError
 * - Prefer explicit failure over silent correction (except defaults)
 *
 * DATA FLOW:
 * =========
 * Input:  Schema-validated JSON from JsonSchemaValidationService
 *         { title, description, actions: [{name, description, difficulty}] }
 *
 * Output: Parsed DTO ready for domain layer
 *         { title, description, actions: [{name, description, difficulty}] }
 *
 * INTEGRATION:
 * ===========
 * This service is used AFTER schema validation and BEFORE domain entity creation.
 * It bridges the gap between validated AI output and domain objects.
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:218-247
 */

import { ValidationError } from '../../../errors/Index.js';

/**
 * Normalize difficulty string to canonical English values
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:232-237
 *
 * Normalization rules (case-insensitive):
 * - "media" or "medium" → "medium"
 * - "alta" or "high" → "high"
 * - anything else → "low" (default)
 *
 * This handles both Spanish and English difficulty values,
 * normalizing to English values aligned with Difficulty domain enum.
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

  // Default to 'low' for any other value (including 'baja', 'low', empty, invalid)
  return 'low';
}

/**
 * Validate that a JSON object has the required top-level structure
 *
 * Required keys: title, description, actions
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:221-225
 *
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
 * Parse and normalize a single action from validated JSON
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:229-246
 *
 * Extracts:
 * - name (with default if missing: "Unnamed action")
 * - description (with default if missing: "No description")
 * - difficulty (normalized via normalizeDifficulty)
 *
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

  // Extract fields with defaults (legacy lines 241-242)
  const name = actionJson.name?.toString() || 'Unnamed action';
  const description = actionJson.description?.toString() || 'No description';

  // Normalize difficulty (legacy lines 232-237)
  const rawDifficulty = actionJson.difficulty;
  const difficulty = normalizeDifficulty(rawDifficulty);

  return {
    name,
    description,
    difficulty,
  };
}

/**
 * Parse habit series data from schema-validated JSON
 *
 * This is the main parsing function that corresponds to the extraction
 * logic in legacy step 4 (lines 220-247), stopping BEFORE entity creation.
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:220-247
 *
 * Process:
 * 1. Validate required top-level keys exist
 * 2. Extract title and description
 * 3. Parse and normalize each action
 * 4. Return structured DTO ready for domain layer
 *
 * @param {object} validatedJSON - Schema-validated JSON object
 * @returns {object} Parsed DTO with structure:
 *   {
 *     title: string,
 *     description: string,
 *     actions: Array<{name: string, description: string, difficulty: string}>
 *   }
 *
 * @throws {ValidationError} If structure is incomplete
 * @throws {ValidationError} If any action is malformed
 *
 * @example
 * const input = {
 *   title: "Meditation Series",
 *   description: "A series to practice daily meditation",
 *   actions: [
 *     { name: "Breathing", description: "...", difficulty: "low" },
 *     { name: "Focus", description: "...", difficulty: "medium" }
 *   ]
 * };
 *
 * const parsed = parseHabitSeriesData(input);
 * // Returns:
 * // {
 * //   title: "Meditation Series",
 * //   description: "A series to practice daily meditation",
 * //   actions: [
 * //     { name: "Breathing", description: "...", difficulty: "low" },
 * //     { name: "Focus", description: "...", difficulty: "medium" }
 * //   ]
 * // }
 */
export function parseHabitSeriesData(validatedJSON) {
  if (!validatedJSON || typeof validatedJSON !== 'object') {
    throw new ValidationError('Input must be a validated JSON object');
  }

  // 1. Validate required top-level structure (legacy lines 221-225)
  validateRequiredKeys(validatedJSON);

  // 2. Extract top-level fields (legacy line 227)
  const title = validatedJSON.title.toString();
  const description = validatedJSON.description.toString();

  // 3. Parse and normalize actions (legacy lines 229-246)
  const actions = validatedJSON.actions.map((actionJson, index) => {
    return parseAction(actionJson, index);
  });

  // 4. Return clean DTO (stops here, BEFORE entity instantiation)
  return {
    title,
    description,
    actions,
  };
}

export default {
  parseHabitSeriesData,
};
