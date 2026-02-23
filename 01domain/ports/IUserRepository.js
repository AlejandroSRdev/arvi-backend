/**
 * Layer: Domain
 * File: IUserRepository.js
 * Responsibility:
 * Defines the contract for persisting, retrieving, and updating user domain entities.
 */

export class IUserRepository {
  async getUser(userId) {
    throw new Error("Not implemented");
  }

  async getUserByEmail(email) {
    throw new Error("Not implemented");
  }

  async getUserByCustomerId(customerId) {
    throw new Error("Not implemented");
  }

  /**
   * The user must be a fully constructed domain entity; all invariants must be satisfied before calling this method.
   */
  async save(user) {
    throw new Error("Not implemented");
  }

  async update(user) {
    throw new Error("Not implemented");
  }

  async deleteUser(userId) {
    throw new Error("Not implemented");
  }

  async updateLastLogin(userId) {
    throw new Error("Not implemented");
  }

  // The decision to increment must always originate in the domain or use case layer.
  async incrementWeeklySummaries(userId) {
    throw new Error("Not implemented");
  }

  async incrementActiveSeries(userId) {
    throw new Error("Not implemented");
  }

  async decrementActiveSeries(userId) {
    throw new Error("Not implemented");
  }
}

export default IUserRepository;