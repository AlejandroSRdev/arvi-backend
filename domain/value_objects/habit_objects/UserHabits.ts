/**
 * UserHabits Entity (Domain Layer)
 *
 * Represents the aggregated habit statistics for a user.
 * Contains scores and ranks across all series.
 *
 * Note: This is a domain entity, NOT a DTO.
 * Use toDTO() to get a plain object for external communication.
 */

import { Rank } from './Rank.js';

/**
 * DTO interface for UserHabits (used in API responses).
 */
export interface UserHabitsDTO {
  readonly scores: Readonly<Record<string, number>>;
  readonly ranks: Readonly<Record<string, Rank>>;
  readonly overallTotalScore: number;
  readonly lastUpdatedAt: string;
}

export class UserHabits {
  readonly scores: Readonly<Record<string, number>>;
  readonly ranks: Readonly<Record<string, Rank>>;
  readonly overallTotalScore: number;
  readonly lastUpdatedAt: Date;

  private constructor(
    scores: Record<string, number>,
    ranks: Record<string, Rank>,
    overallTotalScore: number,
    lastUpdatedAt: Date
  ) {
    this.scores = Object.freeze({ ...scores });
    this.ranks = Object.freeze({ ...ranks });
    this.overallTotalScore = overallTotalScore;
    this.lastUpdatedAt = lastUpdatedAt;
  }

  /**
   * Create a new empty UserHabits instance.
   */
  static createEmpty(): UserHabits {
    return new UserHabits({}, {}, 0, new Date());
  }

  /**
   * Create a UserHabits with all fields (for hydration from persistence).
   */
  static create(params: {
    scores: Record<string, number>;
    ranks: Record<string, Rank>;
    overallTotalScore: number;
    lastUpdatedAt?: Date;
  }): UserHabits {
    return new UserHabits(
      params.scores,
      params.ranks,
      params.overallTotalScore,
      params.lastUpdatedAt ?? new Date()
    );
  }

  /**
   * Returns a DTO for API responses.
   */
  toDTO(): UserHabitsDTO {
    return {
      scores: this.scores,
      ranks: this.ranks,
      overallTotalScore: this.overallTotalScore,
      lastUpdatedAt: this.lastUpdatedAt.toISOString(),
    };
  }
}

export default UserHabits;
