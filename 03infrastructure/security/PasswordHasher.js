/**
 * Password Hasher (Infrastructure)
 *
 * Implements: IPasswordHasher
 *
 * Uses Node.js built-in crypto.scrypt for password hashing.
 * No external dependencies required.
 */

import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { IPasswordHasher } from "../../01domain/ports/IPasswordHasher.js";
import { UnknownInfrastructureError } from "../../errors/index.js";

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
        if (err) reject(new UnknownInfrastructureError({ message: 'Password hashing failed', metadata: { provider: 'crypto' }, cause: err }));
        resolve(`${salt}:${derivedKey.toString("hex")}`);
      });
    });
  }

  /**
   * Verify a raw password against a stored "salt:hash" string.
   * Uses timingSafeEqual to prevent timing attacks.
   */
  async verify(password, storedHash) {
    const [salt, hash] = storedHash.split(":");

    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(new UnknownInfrastructureError({ message: 'Password verification failed', metadata: { provider: 'crypto' }, cause: err }));
        resolve(timingSafeEqual(Buffer.from(hash, "hex"), derivedKey));
      });
    });
  }
}

export default PasswordHasher;
