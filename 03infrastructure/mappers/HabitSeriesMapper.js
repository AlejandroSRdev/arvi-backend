/**
 * HabitSeriesMapper
 *
 * Infrastructure-level mapper.
 *
 * Translates a HabitSeries domain entity into a HabitSeriesOutputDTO
 * suitable for HTTP/API responses.
 *
 * Responsibilities:
 * - Convert domain entities into plain DTOs.
 * - Translate value objects / enums into public primitive representations.
 * - Serialize technical types (e.g. Date → ISO string).
 *
 * This mapper:
 * - Contains NO business logic.
 * - Does NOT validate invariants.
 * - Does NOT create or modify domain entities.
 * - Is a pure, deterministic translation layer.
 */

const HabitSeries = require("../../01domain/entities/HabitSeries.js");
const HabitSeriesOutputDTO = require("../dtos/HabitSeriesOutputDTO.js");

function toHabitSeriesOutputDTO(habitSeries) {
  console.log(`[MAPPER] [Infrastructure] toHabitSeriesOutputDTO called for id=${habitSeries.id}, rank=${habitSeries.getRank()}`);

  return {
    id: habitSeries.id,
    title: habitSeries.title,
    description: habitSeries.description,

    actions: habitSeries.actions.map(action => ({
      name: action.name,
      description: action.description,
      difficulty: action.difficulty, 
      // assumed to already be 'low' | 'medium' | 'high' at domain boundary
    })),

    rank: habitSeries.getRank(), 
    // derived from domain logic, not stored

    totalScore: habitSeries.totalScore,

    createdAt: habitSeries.createdAt.toISOString(),
    lastActivityAt: habitSeries.lastActivityAt.toISOString(),
  };
}

module.exports = {
  toHabitSeriesOutputDTO
};
