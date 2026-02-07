/**
 * User Repository Port (Interface)
 *
 * PATTERN: Hexagonal Architecture – Port
 *
 * Defines WHAT the domain/application needs in order
 * to persist and retrieve users.
 *
 * This interface is completely infrastructure-agnostic:
 * - No Firestore
 * - No SDKs
 * - No persistence details
 *
 * Expected implementations:
 * - infrastructure/persistence/firestore/FirestoreUserRepository
 */

export class IUserRepository {
  /**
   * Retrieve a user by its identifier
   *
   * @param {string} userId - User identifier
   * @returns {Promise<User | null>} User entity or null if not found
   */
  async getUser(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Retrieve a user by email address
   *
   * @param {string} email - User email
   * @returns {Promise<Object | null>} User data or null if not found
   */
  async getUserByEmail(email) {
    throw new Error("Not implemented");
  }

  /**
   * Retrieve a user by Stripe customer identifier
   *
   * NOTE:
   * This method is kept for future billing integration.
   * It is not used in the current authentication flow.
   *
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<User | null>} User entity or null if not found
   */
  async getUserByCustomerId(customerId) {
    throw new Error("Not implemented");
  }

  /**
   * Persist a new user
   *
   * The user MUST be a fully constructed domain entity.
   * All invariants and business rules must be enforced
   * before calling this method.
   *
   * @param {User} user - User domain entity
   * @returns {Promise<void>}
   */
  async save(user) {
    throw new Error("Not implemented");
  }

  /**
   * Update an existing user
   *
   * NOTE:
   * This method is reserved for future use cases where
   * the domain explicitly allows partial updates.
   *
   * @param {User} user - Updated user domain entity
   * @returns {Promise<void>}
   */
  async update(user) {
    throw new Error("Not implemented");
  }

  /**
   * Delete a user by identifier
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Update last login timestamp
   *
   * NOTE:
   * This is a technical concern triggered by authentication,
   * not by user domain rules.
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Increment weekly summaries usage counter
   *
   * NOTE:
   * This method exists for usage tracking use cases.
   * The decision to increment must always come from
   * the application/domain layer.
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async incrementWeeklySummaries(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Increment active series count
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async incrementActiveSeries(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Decrement active series count
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async decrementActiveSeries(userId) {
    throw new Error("Not implemented");
  }
}

export default IUserRepository;