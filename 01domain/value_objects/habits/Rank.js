/**
 * Rank Value Object (Domain Layer)
 *
 * Represents the rank levels for habit series based on total score.
 * Immutable value object with no external dependencies.
 */

export const Rank = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLDEN: "golden",
  DIAMOND: "diamond",
};

const VALID_RANKS = new Set(["bronze", "silver", "golden", "diamond"]);

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
};

/**
 * Calculate rank from total score.
 *
 * @param totalScore - Total accumulated score
 * @returns The appropriate rank for the score
 */
export function calculateRankFromScore(totalScore) {
  if (totalScore >= RANK_THRESHOLDS.DIAMOND) return Rank.DIAMOND;
  if (totalScore >= RANK_THRESHOLDS.GOLDEN) return Rank.GOLDEN;
  if (totalScore >= RANK_THRESHOLDS.SILVER) return Rank.SILVER;
  return Rank.BRONZE;
}

/**
 * Runtime guard to check if a value is a valid Rank.
 */
export function isRank(value) {
  return typeof value === "string" && VALID_RANKS.has(value);
}

export default Rank;