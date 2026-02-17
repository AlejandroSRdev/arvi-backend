/**
 * Rank Value Object (Domain Layer)
 *
 * Represents the rank levels for habit series based on total score.
 * Immutable value object with no external dependencies.
 */

export type Rank = 'bronze' | 'silver' | 'golden' | 'diamond';

export const Rank = {
  BRONZE: 'bronze' as const,
  SILVER: 'silver' as const,
  GOLDEN: 'golden' as const,
  DIAMOND: 'diamond' as const,
} as const;

const VALID_RANKS: ReadonlySet<string> = new Set(['bronze', 'silver', 'golden', 'diamond']);

/**
 * Rank thresholds (business rule).
 * - >= 1000 points: diamond
 * - >= 600 points: golden
 * - >= 300 points: silver
 * - < 300 points: bronze
 */
const RANK_THRESHOLDS = {
  DIAMOND: 1000,
  GOLDEN: 600,
  SILVER: 300,
} as const;

/**
 * Calculate rank from total score.
 *
 * @param totalScore - Total accumulated score
 * @returns The appropriate rank for the score
 */
export function calculateRankFromScore(totalScore: number): Rank {
  if (totalScore >= RANK_THRESHOLDS.DIAMOND) return Rank.DIAMOND;
  if (totalScore >= RANK_THRESHOLDS.GOLDEN) return Rank.GOLDEN;
  if (totalScore >= RANK_THRESHOLDS.SILVER) return Rank.SILVER;
  return Rank.BRONZE;
}

/**
 * Type guard to check if a value is a valid Rank.
 */
export function isRank(value: unknown): value is Rank {
  return typeof value === 'string' && VALID_RANKS.has(value);
}

export default Rank;
