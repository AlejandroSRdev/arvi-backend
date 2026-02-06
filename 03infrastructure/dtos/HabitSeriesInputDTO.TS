/**
 * HabitSeriesInputDTO
 *
 * Infrastructure-level Data Transfer Object.
 *
 * Represents the exact input contract for the
 * POST /api/habits/series endpoint.
 *
 * This DTO:
 * - Models raw external input (HTTP / client / AI).
 * - Contains no domain logic.
 * - Is intentionally permissive and unvalidated.
 * - Must NOT import or depend on domain types.
 *
 * Its sole responsibility is to cross a technical boundary.
 */
export type HabitSeriesInputDTO = {
  language: "es" | "en";
  testData: Record<string, string>;
  assistantContext?: string;
};