/**
 * Layer: Domain
 * File: HabitSeriesPolicy.js
 * Responsibility:
 * Determines which AI generation pass produces a final habit series eligible for persistence.
 */

// Only the structuring pass produces a final series; the creative pass is exploratory and must not be persisted.
export function isHabitSeriesFinal(functionType) {
  return functionType === 'habit_series_structure';
}

export default {
  isHabitSeriesFinal,
};
