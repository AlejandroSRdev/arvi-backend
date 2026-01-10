/**
 * Habit Series Policy (Domain)
 *
 * FECHA CREACIÓN: 2026-01-09
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 *
 * Responsabilidades:
 * - Determinar cuándo una serie de hábitos debe ser persistida
 * - Función pura sin efectos secundarios
 * - NO contiene lógica de infraestructura
 *
 * Regla de negocio:
 * - Solo se persisten series finales (pasada estructuradora)
 * - La pasada creativa NO se persiste (es solo exploración)
 */

/**
 * Determina si un function_type corresponde a una serie final que debe persistirse
 *
 * @param {string} functionType - Tipo de función del modelo (ej: 'habit_series_structure')
 * @returns {boolean} - true si debe persistirse, false si no
 */
export function isHabitSeriesFinal(functionType) {
  return functionType === 'habit_series_structure';
}

export default {
  isHabitSeriesFinal,
};
