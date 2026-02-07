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

  /**
   * Verify a raw password against a stored hash
   *
   * @param {string} password - Raw password to verify
   * @param {string} hash - Stored hash to compare against
   * @returns {Promise<boolean>} True if password matches
   */
  async verify(password, hash) {
    throw new Error("Not implemented");
  }
}

export default IPasswordHasher;
