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
 * This corresponds to STEP 4️⃣ in the legacy implementation:
 * "PARSEO Y CREACIÓN FINAL" (lines 218-247 in legacy)
 *
 * CRITICAL: This service implements ONLY the parsing/extraction logic.
 * It stops BEFORE domain entity instantiation (lines 239-257 in legacy).
 *
 * WHAT IT DOES:
 * ============
 * ✅ Accept a schema-validated JSON object
 * ✅ Extract required fields (titulo, descripcion, acciones)
 * ✅ Normalize difficulty values EXACTLY as legacy
 * ✅ Provide defaults for optional fields (nombre, descripcion in actions)
 * ✅ Return a clean, structured DTO ready for domain layer
 * ✅ Throw explicit errors if required fields are missing or malformed
 *
 * WHAT IT MUST NOT DO:
 * ===================
 * ❌ Validate JSON schema (that's JsonSchemaValidationService's job)
 * ❌ Call AI or external services
 * ❌ Instantiate domain entities (Accion, SerieTematica)
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
 *         { titulo, descripcion, acciones: [{nombre, descripcion, dificultad}] }
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

import { ValidationError } from '../../errors/index.js';

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
 * Required keys: titulo, descripcion, acciones
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:221-225
 *
 * @param {object} json - Validated JSON object
 * @throws {ValidationError} If required keys are missing
 * @private
 */
function validateRequiredKeys(json) {
  const requiredKeys = ['titulo', 'descripcion', 'acciones'];

  for (const key of requiredKeys) {
    if (!(key in json)) {
      throw new ValidationError(
        `Estructura JSON incompleta: falta la clave "${key}"`
      );
    }
  }

  if (!Array.isArray(json.acciones)) {
    throw new ValidationError(
      'Estructura JSON incompleta: "acciones" debe ser un array'
    );
  }

  if (json.acciones.length === 0) {
    throw new ValidationError(
      'Estructura JSON incompleta: "acciones" no puede estar vacío'
    );
  }
}

/**
 * Parse and normalize a single action from validated JSON
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:229-246
 *
 * Extracts:
 * - nombre (with default if missing: "Acción sin nombre")
 * - descripcion (with default if missing: "Sin descripción")
 * - dificultad (normalized via normalizeDifficulty)
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
      `Acción en índice ${index} es inválida: debe ser un objeto`
    );
  }

  // Extract fields with defaults (legacy lines 241-242)
  const name = actionJson.nombre?.toString() || 'Acción sin nombre';
  const description = actionJson.descripcion?.toString() || 'Sin descripción';

  // Normalize difficulty (legacy lines 232-237)
  const rawDifficulty = actionJson.dificultad;
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
 * logic in legacy step 4️⃣ (lines 220-247), stopping BEFORE entity creation.
 *
 * Legacy reference: docs/createHabitSeriesLegacy.dart:220-247
 *
 * Process:
 * 1. Validate required top-level keys exist
 * 2. Extract titulo and descripcion
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
 *   titulo: "Serie de Meditación",
 *   descripcion: "Una serie para practicar meditación diaria",
 *   acciones: [
 *     { nombre: "Respiración", descripcion: "...", dificultad: "baja" },
 *     { nombre: "Concentración", descripcion: "...", dificultad: "media" }
 *   ]
 * };
 *
 * const parsed = parseHabitSeriesData(input);
 * // Returns:
 * // {
 * //   title: "Serie de Meditación",
 * //   description: "Una serie para practicar meditación diaria",
 * //   actions: [
 * //     { name: "Respiración", description: "...", difficulty: "low" },
 * //     { name: "Concentración", description: "...", difficulty: "medium" }
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
  const title = validatedJSON.titulo.toString();
  const description = validatedJSON.descripcion.toString();

  // 3. Parse and normalize actions (legacy lines 229-246)
  const actions = validatedJSON.acciones.map((actionJson, index) => {
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
