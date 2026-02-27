/**
 * Layer: Domain
 * File: HabitSeriesRepository.js
 * Responsibility:
 * Defines the contract for persisting and managing habit series within the domain.
 */

export class IHabitSeriesRepository {
  async createFromAI(userId, seriesData) {
    throw new Error('Not implemented');
  }

  async delete(userId, seriesId) {
    throw new Error('Not implemented');
  }

  /**
   * All operations — persist series, deduct energy, increment counter — must execute atomically.
   * If any step fails, no changes are committed.
   */
  async atomicCommitCreation(userId, seriesData, totalEnergyConsumed) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} userId
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array<{id: string, createdAt: string, updatedAt: string}>>}
   */
  async listByUser(userId, limit) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} userId
   * @param {string} seriesId
   * @returns {Promise<HabitSeries | null>}
   */
  async getHabitSeriesById(userId, seriesId) {
    throw new Error('Not implemented');
  }
}

export default IHabitSeriesRepository;
