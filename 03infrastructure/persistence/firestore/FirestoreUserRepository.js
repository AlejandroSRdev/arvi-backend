/**
 * Firestore User Repository (Infrastructure)
 *
 * Implements: IUserRepository
 *
 * Responsibilities:
 * - Persist User domain entities in Firestore
 *
 * This adapter contains NO business logic.
 * It only maps domain entities to persistence format.
 */

import { IUserRepository } from "../../../01domain/ports/IUserRepository.js";
import { db, FieldValue } from "./FirebaseConfig.js";

const USERS_COLLECTION = "users";

export class FirestoreUserRepository extends IUserRepository {
  /**
   * Persist a User domain entity
   *
   * All domain decisions (plan, energy, limits, trial)
   * must be made BEFORE calling this method.
   */
  async save(user) {
    const userRef = db.collection(USERS_COLLECTION).doc(user.id);

    const persistenceModel = {
      email: user.email,
      plan: user.plan,

      energy: {
        currentAmount: user.energy.currentAmount,
        maxAmount: user.energy.maxAmount,
        lastRechargedAt: user.energy.lastRechargedAt,
      },

      trial: {
        durationDays: user.trial.durationDays,
        startedAt: user.trial.startedAt,
      },

      limits: {
        maxActiveSeries: user.limits.maxActiveSeries,
        activeSeriesCount: user.limits.activeSeriesCount,
      },
    };

    await userRef.set(persistenceModel);
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Get user by Stripe Customer ID
   */
  async getUserByCustomerId(customerId) {
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Update user data
   */
  async updateUser(userId, data) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return this.getUser(userId);
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.delete();
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Increment weekly summaries counter
   */
  async incrementWeeklySummaries(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      'limits.weeklySummariesUsed': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Increment active series counter
   */
  async incrementActiveSeries(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      'limits.activeSeriesCount': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Decrement active series counter
   */
  async decrementActiveSeries(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      'limits.activeSeriesCount': FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

export default FirestoreUserRepository;
