/**
 * Password Hasher Port (Interface)
 *
 * PATTERN: Hexagonal Architecture - Port
 *
 * Defines the contract for password hashing operations.
 * The application layer depends on this interface,
 * not on any specific hashing library.
 */

export class IPasswordHasher {
  /**
   * Hash a raw password
   *
   * @param {string} password - Raw password
   * @returns {Promise<string>} Hashed password
   */
  async hash(password) {
    throw new Error("Not implemented");
  }
}

export default IPasswordHasher;
