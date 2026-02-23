/**
 * Layer: Domain
 * File: Difficulty.js
 * Responsibility:
 * Defines the valid difficulty levels for habit actions and enforces normalization of raw input values.
 */

export const Difficulty = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const VALID_DIFFICULTIES = new Set(["low", "medium", "high"]);

// Accepts non-canonical values from AI output; defaults to LOW when unrecognized.
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

export function isDifficulty(value) {
  return typeof value === "string" && VALID_DIFFICULTIES.has(value);
}

export default Difficulty;