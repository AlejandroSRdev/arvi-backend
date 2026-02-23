/**
 * Layer: Application
 * File: LoginUser.js
 * Responsibility:
 * Orchestrates credential-based authentication by verifying email, validating the password hash, and recording the login timestamp.
 */

import { ValidationError, AuthenticationError } from "../../errors/Index.js";

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
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await passwordHasher.verify(password, user.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Step 3: Update lastLoginAt
  await userRepository.updateLastLogin(user.id);

  // Return userId only — JWT generation is the controller's responsibility
  return { userId: user.id };
}

export default {
  loginUser,
};
