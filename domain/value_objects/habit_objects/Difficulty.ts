/**
 * Difficulty Value Object (Domain Layer)
 *
 * Represents the difficulty levels for habit actions.
 * Immutable value object with no external dependencies.
 */

export type Difficulty = 'low' | 'medium' | 'high';

export const Difficulty = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
} as const;

const VALID_DIFFICULTIES: ReadonlySet<string> = new Set(['low', 'medium', 'high']);

/**
 * Validates and normalizes a difficulty string.
 * Accepts both Spanish and English values for AI compatibility.
 *
 * @param value - Raw difficulty string
 * @returns Normalized Difficulty value
 */
export function parseDifficulty(value: string | null | undefined): Difficulty {
  if (!value) {
    return Difficulty.LOW;
  }

  const normalized = value.toLowerCase().trim();

  if (['medium'].includes(normalized)) {
    return Difficulty.MEDIUM;
  }

  if (['high'].includes(normalized)) {
    return Difficulty.HIGH;
  }

  return Difficulty.LOW;
}

/**
 * Type guard to check if a value is a valid Difficulty.
 */
export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && VALID_DIFFICULTIES.has(value);
}

export default Difficulty;
