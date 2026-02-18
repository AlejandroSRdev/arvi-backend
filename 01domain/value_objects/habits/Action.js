/**
 * Action Value Object (Domain Layer)
 *
 * Represents a single action within a habit series.
 * Domain value object, NOT a DTO.
 * Use toDTO() / toFullDTO() for external communication.
 */

import { parseDifficulty } from "./Difficulty.js";

export class Action {
  constructor(
    id,
    name,
    description,
    difficulty,
    score,
    completed,
    completedAt,
    verificationResponse,
    bonusPoints
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.difficulty = difficulty;
    this.score = score;
    this.completed = completed;
    this.completedAt = completedAt;
    this.verificationResponse = verificationResponse;
    this.bonusPoints = bonusPoints;
  }

  /**
   * Create a new Action from AI output.
   * Normalizes difficulty.
   */
  static fromAIOutput(input, id) {
    return new Action(
      id,
      input.name,
      input.description,
      parseDifficulty(input.difficulty),
      0,
      false,
      null,
      null,
      0
    );
  }

  /**
   * Create an Action with all fields (for hydration from persistence).
   */
  static create(params) {
    return new Action(
      params.id,
      params.name,
      params.description,
      params.difficulty,
      params.score ?? 0,
      params.completed ?? false,
      params.completedAt ?? null,
      params.verificationResponse ?? null,
      params.bonusPoints ?? 0
    );
  }

  /**
   * Returns minimal DTO (new series creation).
   */
  toDTO() {
    return {
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
    };
  }

  /**
   * Returns full DTO including completion state.
   */
  toFullDTO() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      score: this.score,
      completed: this.completed,
      completedAt: this.completedAt
        ? this.completedAt.toISOString()
        : null,
      verificationResponse: this.verificationResponse,
      bonusPoints: this.bonusPoints,
    };
  }
}

export default Action;