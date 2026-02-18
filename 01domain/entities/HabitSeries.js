import { Action, calculateRankFromScore } from "../value_objects/habits/Index.js";

/**
 * HabitSeries (Domain Entity)
 *
 * Represents a thematic collection of habit-related actions.
 *
 * A HabitSeries:
 * - Has an identity, title and description.
 * - Contains a growing list of Actions (minimum 3).
 * - Accumulates a totalScore over time.
 * - Derives its Rank exclusively from totalScore (rank is NOT stored).
 *
 * Pure domain logic.
 * Defensive by construction.
 */
export class HabitSeries {
  /**
   * Constructor.
   * Enforces all domain invariants.
   * Intended to be used only through the static factory method.
   */
  constructor(
    id,
    title,
    description,
    actions,
    totalScore,
    createdAt,
    lastActivityAt
  ) {
    // --- Identity validation ---
    if (typeof id !== "string") {
      throw new Error("HabitSeries id must be a string");
    }

    if (id.trim() === "") {
      throw new Error("HabitSeries id cannot be empty");
    }

    // --- Title validation ---
    if (typeof title !== "string") {
      throw new Error("HabitSeries title must be a string");
    }

    if (title.trim() === "") {
      throw new Error("HabitSeries title cannot be empty");
    }

    // --- Description validation ---
    if (typeof description !== "string") {
      throw new Error("HabitSeries description must be a string");
    }

    if (description.trim() === "") {
      throw new Error("HabitSeries description cannot be empty");
    }

    // --- Actions validation ---
    if (!Array.isArray(actions)) {
      throw new Error("HabitSeries actions must be an array");
    }

    if (actions.length < 3) {
      throw new Error("HabitSeries must contain at least three actions");
    }

    for (const action of actions) {
      if (!(action instanceof Action)) {
        throw new Error("All HabitSeries actions must be valid Action instances");
      }
    }

    // --- Score validation ---
    if (typeof totalScore !== "number") {
      throw new Error("HabitSeries totalScore must be a number");
    }

    if (totalScore < 0) {
      throw new Error("HabitSeries totalScore cannot be negative");
    }

    // --- Temporal validation ---
    if (!(createdAt instanceof Date)) {
      throw new Error("HabitSeries createdAt must be a Date");
    }

    if (!(lastActivityAt instanceof Date)) {
      throw new Error("HabitSeries lastActivityAt must be a Date");
    }

    // --- State assignment ---
    this.id = id;
    this.title = title;
    this.description = description;
    this.actions = actions;
    this.totalScore = totalScore;
    this.createdAt = createdAt;
    this.lastActivityAt = lastActivityAt;
  }

  /**
   * Derived rank of the series.
   * Always calculated from totalScore.
   */
  getRank() {
    return calculateRankFromScore(this.totalScore);
  }

  /**
   * Factory method for creating a new HabitSeries.
   */
  static create(params) {
    const now = new Date();

    return new HabitSeries(
      params.id,
      params.title,
      params.description,
      params.actions,
      params.totalScore ?? 0,
      params.createdAt ?? now,
      params.lastActivityAt ?? now
    );
  }
}

export default HabitSeries;