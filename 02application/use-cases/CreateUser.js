/**
 * Layer: Application
 * File: CreateUser.js
 * Responsibility:
 * Orchestrates user registration by hashing credentials, constructing the User entity, and delegating persistence.
 */
import { randomUUID } from "crypto";
import { User } from "../../01domain/entities/User.js";
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

  // Freemium users have no paid plan and no AI feature access.
  // Limits are zero until a subscription is activated via Stripe webhook.
  const user = User.create({
    id: userId,
    email,
    password: passwordHash,
    plan: "freemium",
    trial: Trial.inactive(),
    limits: new Limits(0, 0, 0),
  });

  await userRepository.save(user);

  return { userId, plan: user.plan };
}

export default {
  createUser,
};
