/**
 * HabitSeriesInputDTO
 *
 * Infrastructure-level Data Transfer Object.
 *
 * Represents the exact input contract for:
 * POST /api/habits/series
 *
 * Shape (runtime expectation):
 *
 * {
 *   language: "es" | "en",
 *   testData: { [key: string]: string },
 *   assistantContext?: string
 * }
 *
 * Notes:
 * - This is raw external input (HTTP / client / AI).
 * - Contains no domain logic.
 * - Intentionally permissive.
 * - Must NOT depend on domain types.
 *
 * Validation must occur at the HTTP or application layer.
 */

export {};