/**
 * Layer: Domain
 * File: Rank.js
 * Responsibility:
 * Defines the rank tiers for habit series and derives the applicable rank from an accumulated score.
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

export function calculateRankFromScore(totalScore) {
  if (totalScore >= RANK_THRESHOLDS.DIAMOND) return Rank.DIAMOND;
  if (totalScore >= RANK_THRESHOLDS.GOLDEN) return Rank.GOLDEN;
  if (totalScore >= RANK_THRESHOLDS.SILVER) return Rank.SILVER;
  return Rank.BRONZE;
}

export function isRank(value) {
  return typeof value === "string" && VALID_RANKS.has(value);
}

export default Rank;