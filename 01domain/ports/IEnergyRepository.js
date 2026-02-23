/**
 * Layer: Domain
 * File: IEnergyRepository.js
 * Responsibility:
 * Defines the contract for atomically reading and updating user energy state, without any business logic or calculation.
 */

export class IEnergyRepository {
  async getEnergy(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Persists pre-calculated energy values. Must not validate sufficiency,
   * compute new values, or access plan policies — all decisions belong to the use case.
   */
  async updateEnergy(userId, energyPatch, action) {
    throw new Error('Not implemented');
  }
}

export default IEnergyRepository;
