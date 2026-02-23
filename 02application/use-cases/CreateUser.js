/**
 * Create User Use Case (Application Layer)
 *
 * Orchestrates user registration by defining all business-relevant
 * initial state and delegating persistence to the repository.
 *
 * Responsibilities:
 * - Hash the user password
 * - Create the User domain entity
 * - Define initial plan, energy, trial, and limits
 * - Persist the user via IUserRepository
 * - Returns the new user ID
 *
 * Does NOT contain:
 * - HTTP validation
 * - Transport concerns
 * - Direct access to Firestore
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

  // Defensive checks
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

  // Hash password before entering the domain
  const passwordHash = await passwordHasher.hash(password);

  // Generate a unique user ID
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
