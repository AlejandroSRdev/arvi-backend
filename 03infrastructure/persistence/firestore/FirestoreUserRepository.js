/**
 * Layer: Infrastructure
 * File: FirestoreUserRepository.js
 * Responsibility:
 * Implements IUserRepository by persisting and querying User entities in Firestore.
 */

import { IUserRepository } from "../../../01domain/ports/IUserRepository.js";
import { DataAccessFailureError } from "../../../errors/Index.js";
import { db, FieldValue } from "./FirebaseConfig.js";

const USERS_COLLECTION = "users";

export class FirestoreUserRepository extends IUserRepository {
  /**
   * Persist a User domain entity.
   *
   * All domain decisions (plan, limits, trial)
   * must be made BEFORE calling this method.
   */
  async save(user, planDates = {}) {
    try {
      const userRef = db.collection(USERS_COLLECTION).doc(user.id);

      const persistenceModel = {
        email: user.email,
        password: user.password,
        plan: user.plan,
        planStartedAt: planDates.planStartedAt ?? null,
        planExpiresAt: planDates.planExpiresAt ?? null,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        subscribedAt: user.subscribedAt,
        canceledAt: user.canceledAt,

        trial: {
          durationDays: user.trial.durationDays,
          startedAt: user.trial.startedAt,
        },

        limits: {
          maxActiveSeries: user.limits.maxActiveSeries,
          activeSeriesCount: user.limits.activeSeriesCount,
          monthlyActionsMax: user.limits.monthlyActionsLimit ?? 0,
          monthlyActionsRemaining: user.limits.monthlyActionsLimit ?? 0,
          monthlyActionsResetAt: null,
        },
      };

      await userRef.set(persistenceModel);
    } catch (error) {
      if (error.code) throw error;
      throw new DataAccessFailureError({ operation: 'save', collection: USERS_COLLECTION, cause: error });
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      const userRef = db.collection(USERS_COLLECTION).doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Billing defaults for legacy users that predate this schema
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        subscribedAt: data.subscribedAt ?? null,
        canceledAt: data.canceledAt ?? null,
      };
    } catch (error) {
      if (error.code) throw error;
      throw new DataAccessFailureError({ operation: 'getUser', collection: USERS_COLLECTION, cause: error });
    }
  }

  /**
   * Get user by email address
   */
  async getUserByEmail(email) {
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      subscribedAt: data.subscribedAt ?? null,
      canceledAt: data.canceledAt ?? null,
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
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      subscribedAt: data.subscribedAt ?? null,
      canceledAt: data.canceledAt ?? null,
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

  /**
   * Atomically process a Stripe event: check idempotency, update user plan, record event.
   * If the event was already processed, the transaction is a no-op.
   *
   * @param {string} eventId - Stripe event ID (used as Firestore document ID)
   * @param {string} userId
   * @param {Object} userUpdates - Fields to update on the user document (dot-notation supported)
   */
  async atomicProcessStripeEvent(eventId, userId, userUpdates) {
    try {
      const userRef = db.collection(USERS_COLLECTION).doc(userId);
      const eventRef = db.collection('stripe_events').doc(eventId);

      let skipped = false;

      await db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(eventRef);

        // Idempotency: event already recorded, skip
        if (eventDoc.exists) {
          skipped = true;
          return;
        }

        // Remove undefined entries; explicit null values are allowed (e.g. clearing canceledAt)
        const filteredUpdates = Object.fromEntries(
          Object.entries(userUpdates).filter(([, v]) => v !== undefined)
        );

        transaction.update(userRef, {
          ...filteredUpdates,
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.set(eventRef, {
          eventId,
          userId,
          processedAt: FieldValue.serverTimestamp(),
        });
      });

      return { skipped };
    } catch (error) {
      if (error.code) throw error;
      throw new DataAccessFailureError({
        operation: 'atomicProcessStripeEvent',
        collection: 'stripe_events',
        cause: error,
      });
    }
  }

  /**
   * Persist a failed Stripe event for manual reconciliation.
   * Failures in this method are logged but not propagated — recording failure
   * must not mask the original non-retryable condition.
   *
   * @param {Object} params
   * @param {string} params.eventId
   * @param {string} params.type
   * @param {string} params.reason
   */
  async recordFailedStripeEvent(params) {
    try {
      await db.collection('stripe_failed_events').add({
        ...params,
        recordedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error(`[WEBHOOK] Failed to record failed event ${params.eventId}: ${error.message}`);
    }
  }
}

export default FirestoreUserRepository;
