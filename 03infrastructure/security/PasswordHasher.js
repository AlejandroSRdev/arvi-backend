/**
 * Password Hasher (Infrastructure)
 *
 * Implements: IPasswordHasher
 *
 * Uses Node.js built-in crypto.scrypt for password hashing.
 * No external dependencies required.
 */

import { scrypt, randomBytes } from "node:crypto";
import { IPasswordHasher } from "../../01domain/ports/IPasswordHasher.js";

export class PasswordHasher extends IPasswordHasher {
  /**
   * Hash a raw password using scrypt with a random salt.
   *
   * @param {string} password - Raw password
   * @returns {Promise<string>} Format: "salt:hash"
   */
  async hash(password) {
    const salt = randomBytes(16).toString("hex");

    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString("hex")}`);
      });
    });
  }
}

export default PasswordHasher;
