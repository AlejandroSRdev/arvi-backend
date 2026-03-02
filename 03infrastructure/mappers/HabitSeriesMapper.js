/**
 * Layer: Infrastructure
 * File: HabitSeriesMapper.js
 * Responsibility:
 * Translates HabitSeries domain entities into HabitSeriesOutputDTO for HTTP API responses.
 */

export function toActionOutputDTO(action) {
  return {
    id: action.id,
    name: action.name,
    description: action.description,
    difficulty: action.difficulty,
  };
}

export function toHabitSeriesOutputDTO(habitSeries) {
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

    createdAt: habitSeries.createdAt.toISOString(),
    lastActivityAt: habitSeries.lastActivityAt.toISOString(),
  };
}
