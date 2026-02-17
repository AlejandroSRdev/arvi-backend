/**
 * Login User Use Case (Application Layer)
 *
 * Orchestrates credential-based authentication:
 * 1. Find user by email
 * 2. Verify password against stored hash
 * 3. Update lastLoginAt timestamp
 * 4. Return userId for token generation
 *
 * Does NOT contain:
 * - HTTP concerns
 * - JWT generation (infrastructure responsibility)
 * - Direct access to Firestore
 */

import { ValidationError, AuthenticationError } from "../../../errors/index.ts";

/**
 * Authenticate a user by email and password
 *
 * @param {string} email - User email
 * @param {string} password - Raw user password
 * @param {Object} deps - Injected dependencies
 * @param {IUserRepository} deps.userRepository
 * @param {IPasswordHasher} deps.passwordHasher
 *
 * @returns {Promise<{ userId: string }>}
 */
export async function loginUser(email, password, deps) {
  const { userRepository, passwordHasher } = deps;

  if (!userRepository) {
    throw new ValidationError("Dependency required: userRepository");
  }

  if (!passwordHasher) {
    throw new ValidationError("Dependency required: passwordHasher");
  }

  if (!email) {
    throw new ValidationError("Email is required");
  }

  if (!password) {
    throw new ValidationError("Password is required");
  }

  // Step 1: Find user by email
  const user = await userRepository.getUserByEmail(email.trim().toLowerCase());

  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Step 2: Verify password against stored hash
  if (!user.password) {
    // User exists but has no password hash stored (legacy data)
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await passwordHasher.verify(password, user.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Step 3: Update lastLoginAt
  await userRepository.updateLastLogin(user.id);

  // Step 4: Return userId for JWT generation at the controller level
  return { userId: user.id };
}

export default {
  loginUser,
};
