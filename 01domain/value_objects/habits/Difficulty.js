/**
 * Difficulty Value Object (Domain Layer)
 *
 * Represents the difficulty levels for habit actions.
 * Immutable value object with no external dependencies.
 */

export const Difficulty = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const VALID_DIFFICULTIES = new Set(["low", "medium", "high"]);

/**
 * Validates and normalizes a difficulty string.
 * Accepts both Spanish and English values for AI compatibility.
 *
 * @param value - Raw difficulty string
 * @returns Normalized difficulty value
 */
export function parseDifficulty(value) {
  if (!value) {
    return Difficulty.LOW;
  }

  const normalized = String(value).toLowerCase().trim();

  if (["medium"].includes(normalized)) {
    return Difficulty.MEDIUM;
  }

  if (["high"].includes(normalized)) {
    return Difficulty.HIGH;
  }

  return Difficulty.LOW;
}

/**
 * Runtime guard to check if a value is a valid difficulty.
 */
export function isDifficulty(value) {
  return typeof value === "string" && VALID_DIFFICULTIES.has(value);
}

export default Difficulty;