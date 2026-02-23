/**
 * Layer: Domain
 * File: IPasswordHasher.js
 * Responsibility:
 * Defines the contract for password hashing and verification, keeping the domain independent of any specific hashing library.
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
