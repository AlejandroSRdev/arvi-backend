/**
 * Layer: Infrastructure
 * File: HabitSeriesMapper.js
 * Responsibility:
 * Translates HabitSeries domain entities into HabitSeriesOutputDTO for HTTP API responses.
 */

export function toHabitSeriesOutputDTO(habitSeries) {
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
