/**
 * Habit Series Repository Port (Interface)
 *
 * PATRÓN: Hexagonal Architecture - Port
 * FECHA CREACIÓN: 2026-01-09
 *
 * Define QUÉ necesita el dominio para persistir series de hábitos.
 * NO define CÓMO se implementa (sin Firestore, sin SDKs).
 *
 * Implementaciones esperadas:
 * - infrastructure/persistence/firestore/FirestoreHabitSeriesRepository.js
 */

/**
 * Contrato de repositorio de series de hábitos
 */
export class IHabitSeriesRepository {
  /**
   * Crear una serie de hábitos generada por IA
   *
   * @param {string} userId - ID del usuario propietario
   * @param {object} seriesData - Datos de la serie generados por IA
   * @returns {Promise<{id: string}>} - ID de la serie creada
   * @throws {Error} - Si los datos son inválidos o falla la persistencia
   */
  async createFromAI(userId, seriesData) {
    throw new Error('Not implemented');
  }

  /**
   * Eliminar una serie de hábitos
   *
   * @param {string} userId - ID del usuario propietario
   * @param {string} seriesId - ID de la serie a eliminar
   * @returns {Promise<{deleted: boolean}>} - Confirmación de eliminación
   * @throws {Error} - Si la serie no existe o falla la eliminación
   */
  async delete(userId, seriesId) {
    throw new Error('Not implemented');
  }

  /**
   * Atomic creation of a habit series with energy deduction and counter increment.
   *
   * All operations (persist series, deduct energy, increment counter) must
   * execute atomically. If any step fails, no changes are committed.
   *
   * @param {string} userId - User ID
   * @param {object} seriesData - Parsed series data from AI
   * @param {number} totalEnergyConsumed - Total energy to deduct
   * @returns {Promise<{id: string}>} - ID of the created series
   * @throws {Error} - If energy is insufficient or persistence fails
   */
  async atomicCommitCreation(userId, seriesData, totalEnergyConsumed) {
    throw new Error('Not implemented');
  }
}

export default IHabitSeriesRepository;
