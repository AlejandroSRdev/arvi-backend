/**
 * Delete Habit Series Use Case (Domain)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-07
 * REFACTORIZADO: 2026-01-09 - Eliminación real de Firestore + decremento de contador
 *
 * Responsabilidades:
 * - Eliminar la serie de hábitos de Firestore
 * - Decrementar contador de series activas
 * - Validar que la serie existe antes de decrementar
 *
 * Flujo:
 * 1. Validar parámetros
 * 2. Eliminar serie de Firestore (valida ownership y existencia)
 * 3. Decrementar contador de series activas
 * 4. Retornar confirmación con seriesId eliminado
 *
 * NO contiene:
 * - Lógica HTTP (req/res)
 * - Transacciones complejas (se hace en orden seguro)
 */

/**
 * Eliminar una serie de hábitos
 *
 * @param {object} params - Parámetros de la operación
 * @param {string} params.userId - ID del usuario autenticado
 * @param {string} params.seriesId - ID de la serie a eliminar
 * @param {object} params.habitSeriesRepository - Repositorio de series de hábitos
 * @param {object} params.userRepository - Repositorio de usuarios
 * @returns {Promise<{ok: true, deletedSeriesId: string} | {ok: false, reason: string}>}
 */
export async function deleteHabitSeries({ userId, seriesId, habitSeriesRepository, userRepository }) {
  if (!habitSeriesRepository || !userRepository) {
    throw new Error('Missing dependencies: habitSeriesRepository and userRepository required');
  }

  if (!userId) {
    return { ok: false, reason: 'USER_ID_REQUIRED' };
  }

  if (!seriesId) {
    return { ok: false, reason: 'SERIES_ID_REQUIRED' };
  }

  try {
    // 1. Eliminar serie de Firestore (valida existencia y ownership)
    await habitSeriesRepository.delete(userId, seriesId);

    // 2. Decrementar contador de series activas
    await userRepository.decrementActiveSeries(userId);

    return {
      ok: true,
      deletedSeriesId: seriesId,
    };
  } catch (error) {
    // Si la serie no existe, retornar error específico
    if (error.message === 'SERIES_NOT_FOUND') {
      return {
        ok: false,
        reason: 'SERIES_NOT_FOUND',
      };
    }

    // Re-lanzar otros errores
    throw error;
  }
}

export default { deleteHabitSeries };
