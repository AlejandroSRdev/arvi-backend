/**
 * Action Value Object (Domain Layer)
 *
 * Represents a single action within a habit series.
 * Contains business state and behavior related to action completion.
 *
 * Note: This is a domain value object, NOT a DTO.
 * Use toDTO() to get a plain object for external communication.
 */

import { Difficulty, parseDifficulty } from './Difficulty.js';

/**
 * DTO interface for Action (used in API responses).
 */
export interface ActionDTO {
  readonly name: string;
  readonly description: string;
  readonly difficulty: Difficulty;
}

/**
 * Full Action DTO including completion state (used internally).
 */
export interface ActionFullDTO extends ActionDTO {
  readonly id: string;
  readonly score: number;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly verificationResponse: string | null;
  readonly bonusPoints: number;
}

/**
 * Input structure from AI output (Spanish keys).
 */
export interface AIActionInput {
  readonly nombre: string;
  readonly descripcion: string;
  readonly dificultad: string;
}

export class Action {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly difficulty: Difficulty;
  readonly score: number;
  readonly completed: boolean;
  readonly completedAt: Date | null;
  readonly verificationResponse: string | null;
  readonly bonusPoints: number;

  private constructor(
    id: string,
    name: string,
    description: string,
    difficulty: Difficulty,
    score: number,
    completed: boolean,
    completedAt: Date | null,
    verificationResponse: string | null,
    bonusPoints: number
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
   * Maps Spanish keys to English and normalizes difficulty.
   */
  static fromAIOutput(input: AIActionInput, id: string): Action {
    return new Action(
      id,
      input.nombre,
      input.descripcion,
      parseDifficulty(input.dificultad),
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
  static create(params: {
    id: string;
    name: string;
    description: string;
    difficulty: Difficulty;
    score?: number;
    completed?: boolean;
    completedAt?: Date | null;
    verificationResponse?: string | null;
    bonusPoints?: number;
  }): Action {
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
   * Returns a minimal DTO for API responses (new series creation).
   */
  toDTO(): ActionDTO {
    return {
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
    };
  }

  /**
   * Returns a full DTO including completion state.
   */
  toFullDTO(): ActionFullDTO {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      score: this.score,
      completed: this.completed,
      completedAt: this.completedAt?.toISOString() ?? null,
      verificationResponse: this.verificationResponse,
      bonusPoints: this.bonusPoints,
    };
  }
}

export default Action;
