/**
 * Layer: Application
 * File: CreateHabitSeriesContract.js
 * Responsibility:
 * Defines the input and output data boundaries for the CreateHabitSeries use case.
 */

export interface DifficultyLabels {
  baja: string
  media: string
  alta: string
}

export interface CreateHabitSeriesInput {
  userId: string
  language: 'es' | 'en'
  testData: Record<string, string>
  difficultyLabels: DifficultyLabels
  assistantContext: string
}

export interface HabitActionDTO {
  nombre: string
  descripcion: string
  dificultad: 'baja' | 'media' | 'alta'
}

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
