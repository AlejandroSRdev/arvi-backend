/**
 * Layer: Infrastructure
 * File: HabitSeriesInputDTO.js
 * Responsibility:
 * Defines the raw HTTP input contract for the habit series creation endpoint, without dependency on domain types.
 *
 * Shape (runtime expectation):
 *
 * {
 *   language: "es" | "en",
 *   testData: { [key: string]: string },
 *   assistantContext?: string
 * }
 *
 * Intentionally permissive. Validation occurs at the HTTP or application layer.
 */

export {};
