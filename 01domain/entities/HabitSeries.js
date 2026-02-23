/**
 * Layer: Domain
 * File: HabitSeries.js
 * Responsibility:
 * Defines a thematic collection of habit actions, enforcing all structural invariants and deriving rank exclusively from accumulated score.
 */

import { Action, calculateRankFromScore } from "../value_objects/habits/Index.js";

export class HabitSeries {
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

    this.id = id;
    this.title = title;
    this.description = description;
    this.actions = actions;
    this.totalScore = totalScore;
    this.createdAt = createdAt;
    this.lastActivityAt = lastActivityAt;
  }

  // Rank is never stored; it is always derived from totalScore.
  getRank() {
    return calculateRankFromScore(this.totalScore);
  }

  /**
   * Factory method — the sole valid entry point to construct a HabitSeries.
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