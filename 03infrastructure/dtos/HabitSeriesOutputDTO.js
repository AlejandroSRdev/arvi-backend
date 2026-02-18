/**
 * HabitSeriesOutputDTO
 *
 * Infrastructure-level Data Transfer Object.
 *
 * Represents the exact response contract returned by
 * the POST /api/habits/series endpoint.
 *
 * This DTO:
 * - Is a serialized view of the result.
 * - Exposes only public, stable data.
 * - Uses primitives and explicit unions only.
 * - Does NOT depend on domain entities or value objects.
 *
 * Formatting, naming and structure are aligned with API consumers,
 * not with internal domain models.
 */
class HabitSeriesOutputDTO {
  constructor(id, title, description, actions, rank, totalScore, createdAt, lastActivityAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.actions = actions; // Array of objects with name, description, and difficulty
    this.rank = rank; // "bronze" | "silver" | "golden" | "diamond"
    this.totalScore = totalScore;
    this.createdAt = createdAt; // ISO string
    this.lastActivityAt = lastActivityAt; // ISO string
  }
}

export { HabitSeriesOutputDTO };
export default HabitSeriesOutputDTO;