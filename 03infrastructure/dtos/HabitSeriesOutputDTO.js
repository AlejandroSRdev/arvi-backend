/**
 * Layer: Infrastructure
 * File: HabitSeriesOutputDTO.js
 * Responsibility:
 * Defines the serialized HTTP response contract for the habit series creation endpoint.
 */

class HabitSeriesOutputDTO {
  constructor(id, title, description, actions, createdAt, lastActivityAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.actions = actions; // Array of objects with name, description, and difficulty
    this.createdAt = createdAt; // ISO string
    this.lastActivityAt = lastActivityAt; // ISO string
  }
}

export { HabitSeriesOutputDTO };
export default HabitSeriesOutputDTO;
