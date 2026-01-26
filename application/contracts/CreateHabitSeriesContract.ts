/**
 * Application Contract: Create Habit Series
 *
 * This contract defines the exact input/output boundary for the
 * CreateHabitSeriesUseCase. It is a pure DTO layer with no logic.
 *
 * The contract MUST match 1:1 with the use-case signature.
 * Controllers transform HTTP DTOs into this contract before
 * invoking the use-case.
 */

/**
 * Difficulty labels provided by the client for prompt construction.
 * Keys are difficulty levels, values are localized labels.
 */
export interface DifficultyLabels {
  baja: string
  media: string
  alta: string
}

/**
 * Input boundary for the "Create Habit Series" use-case.
 *
 * This is the minimum and explicit data required to generate
 * and persist a thematic habit series via AI.
 */
export interface CreateHabitSeriesInput {
  userId: string
  language: 'es' | 'en'
  testData: Record<string, string>
  difficultyLabels: DifficultyLabels
  assistantContext: string
}

/**
 * A single action within a habit series.
 */
export interface HabitActionDTO {
  nombre: string
  descripcion: string
  dificultad: 'baja' | 'media' | 'alta'
}

/**
 * Output boundary for the "Create Habit Series" use-case.
 *
 * Represents the complete Habit Series as persisted.
 * The backend is authoritative over this shape.
 *
 * This is the ONLY valid response format - no wrappers, no metadata.
 */
export interface CreateHabitSeriesOutput {
  id: string
  titulo: string
  descripcion: string
  acciones: HabitActionDTO[]
  rango: 'bronze' | 'silver' | 'golden' | 'diamond'
  puntuacionTotal: number
  fechaCreacion: string
  ultimaActividad: string
}
