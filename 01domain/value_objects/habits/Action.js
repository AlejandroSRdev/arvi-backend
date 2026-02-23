/**
 * Layer: Domain
 * File: Action.js
 * Responsibility:
 * Represents a single habit action as a domain value object, encapsulating identity, difficulty, score, and completion state.
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

  // Difficulty normalization is required because AI output may use non-canonical values.
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

  toDTO() {
    return {
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
    };
  }

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