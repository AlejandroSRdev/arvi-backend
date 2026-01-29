/**
 * HabitSeries Entity (Domain Layer)
 *
 * Represents a thematic series of habit actions.
 * Contains business logic for rank calculation based on score.
 *
 * Note: This is a domain entity, NOT a DTO.
 * Use toDTO() to get a plain object for external communication.
 */

import { Action, ActionDTO } from './Action.ts';
import type { AIActionInput } from './Action.ts';
import { Rank, calculateRankFromScore } from './Rank.ts';

/**
 * DTO interface for HabitSeries (used in API responses).
 */
export interface HabitSeriesDTO {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actions: readonly ActionDTO[];
  readonly rank: Rank;
  readonly totalScore: number;
  readonly createdAt: string;
  readonly lastActivityAt: string;
}

/**
 * Input structure from AI output
 */
export interface AIHabitSeriesInput {
  readonly title: string;
  readonly description: string;
  readonly actions: readonly AIActionInput[];
}

export class HabitSeries {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actions: readonly Action[];
  readonly rank: Rank;
  readonly totalScore: number;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;

  private constructor(
    id: string,
    title: string,
    description: string,
    actions: readonly Action[],
    rank: Rank,
    totalScore: number,
    createdAt: Date,
    lastActivityAt: Date
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.actions = actions;
    this.rank = rank;
    this.totalScore = totalScore;
    this.createdAt = createdAt;
    this.lastActivityAt = lastActivityAt;
  }

  /**
   * Create a new HabitSeries from AI output.
   *
   * @param id - Generated series ID
   * @param input - AI output with Spanish keys
   * @returns A new HabitSeries entity
   */
  static fromAIOutput(id: string, input: AIHabitSeriesInput): HabitSeries {
    const now = new Date();
    const actions = input.actions.map((actionInput, index) =>
      Action.fromAIOutput(actionInput, `${id}_action_${index}`)
    );

    return new HabitSeries(
      id,
      input.title,
      input.description,
      actions,
      Rank.BRONZE,
      0,
      now,
      now
    );
  }

  /**
   * Create a HabitSeries with all fields (for hydration from persistence).
   */
  static create(params: {
    id: string;
    title: string;
    description: string;
    actions: readonly Action[];
    rank?: Rank;
    totalScore?: number;
    createdAt?: Date;
    lastActivityAt?: Date;
  }): HabitSeries {
    const now = new Date();
    return new HabitSeries(
      params.id,
      params.title,
      params.description,
      params.actions,
      params.rank ?? Rank.BRONZE,
      params.totalScore ?? 0,
      params.createdAt ?? now,
      params.lastActivityAt ?? now
    );
  }

  /**
   * Calculate the rank based on total score.
   * Business rule:
   * - >= 1000 points: diamond
   * - >= 600 points: golden
   * - >= 300 points: silver
   * - < 300 points: bronze
   */
  calculateRank(): Rank {
    return calculateRankFromScore(this.totalScore);
  }

  /**
   * Returns a DTO for API responses.
   */
  toDTO(): HabitSeriesDTO {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      actions: this.actions.map(action => action.toDTO()),
      rank: this.rank,
      totalScore: this.totalScore,
      createdAt: this.createdAt.toISOString(),
      lastActivityAt: this.lastActivityAt.toISOString(),
    };
  }
}

export default HabitSeries;
