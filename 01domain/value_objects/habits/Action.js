/**
 * Layer: Domain
 * File: Action.js
 * Responsibility:
 * Represents a single habit action as a domain value object.
 */

import { parseDifficulty, isDifficulty } from "./Difficulty.js";

export class Action {
  constructor(id, name, description, difficulty) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.difficulty = difficulty;
  }

  // Difficulty normalization is required because AI output may use non-canonical values.
  static fromAIOutput(input, id) {
    if (!id || !String(id).trim()) {
      throw new Error('Action id must be non-empty');
    }
    return new Action(
      id,
      input.name,
      input.description,
      parseDifficulty(input.difficulty)
    );
  }

  static create(params) {
    if (!params.id || !String(params.id).trim()) {
      throw new Error('Action id must be non-empty');
    }
    if (!params.name || !String(params.name).trim()) {
      throw new Error('Action name must be non-empty');
    }
    if (!params.description || !String(params.description).trim()) {
      throw new Error('Action description must be non-empty');
    }
    if (!isDifficulty(params.difficulty)) {
      throw new Error(`Action difficulty must be 'low', 'medium', or 'high'. Received: ${params.difficulty}`);
    }

    return new Action(params.id, params.name, params.description, params.difficulty);
  }
}

export default Action;