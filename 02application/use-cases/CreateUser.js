/**
 * Layer: Application
 * File: CreateUser.js
 * Responsibility:
 * Orchestrates user registration by hashing credentials, constructing the User entity, and delegating persistence.
 */
import { randomUUID } from "crypto";
import { User } from "../../01domain/entities/User.js";
import { Energy } from "../../01domain/value_objects/user/Energy.js";
import { Limits } from "../../01domain/value_objects/user/Limits.js";
import { Trial } from "../../01domain/value_objects/user/Trial.js";
import { ValidationError } from "../../errors/Index.js";

/**
 * Create a new user in the system
 *
 * @param {string} email - User email (validated at HTTP layer)
 * @param {string} password - Raw user password (validated at HTTP layer)
 * @param {Object} deps - Injected dependencies
 * @param {IUserRepository} deps.userRepository
 * @param {IPasswordHasher} deps.passwordHasher
 *
 * @returns {Promise<void>}
 */
export async function createUser(email, password, deps) {
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

  // Hash password before constructing the domain entity
  const passwordHash = await passwordHasher.hash(password);

  const userId = randomUUID();

  // TEMPORARY: Users are created with PRO plan by default
  // to validate limits and system coherence during early stages.
  const user = User.create({
    id: userId,
    email,
    password: passwordHash,
    plan: "pro",
    trial: Trial.inactive(),
    energy: Energy.initial(10000),
    limits: Limits.pro(),
  });

  await userRepository.save(user);

  return { userId };
}

export default {
  createUser,
};
