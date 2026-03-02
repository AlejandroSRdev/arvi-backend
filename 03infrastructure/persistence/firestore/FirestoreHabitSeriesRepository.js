/**
 * Layer: Infrastructure
 * File: FirestoreHabitSeriesRepository.js
 * Responsibility:
 * Implements IHabitSeriesRepository by persisting and deleting habit series documents in Firestore.
 */

import { HabitSeries } from '../../../01domain/entities/HabitSeries.js';
import { IHabitSeriesRepository } from '../../../01domain/ports/HabitSeriesRepository.js';
import { Action } from '../../../01domain/value_objects/habits/Action.js';
import {
  DataAccessFailureError,
  InsufficientEnergyError,
  TransactionFailureError,
  ValidationError,
} from '../../../errors/Index.js';
import { db, FieldValue } from './FirebaseConfig.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export class FirestoreHabitSeriesRepository extends IHabitSeriesRepository {
  /**
   * Returns habit series for a user ordered by createdAt DESC.
   *
   * @param {string} userId
   * @param {number} limit - Must already be validated and clamped by the caller
   * @returns {Promise<Array<{title: string, createdAt: string}>>}
   */
  async listByUser(userId, limit) {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('habitSeries')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        title: data.title ?? null,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      };
    });
  }

  /**
   * @param {string} userId - Owner user ID
   * @param {object} seriesData - Series data (string JSON or object)
   * @returns {Promise<{id: string}>}
   * @throws {Error} If data is invalid
   */
  async createFromAI(userId, seriesData) {
    if (!userId) {
      throw new Error('userId is required for habit series creation');
    }

    if (!seriesData) {
      throw new Error('seriesData is required for habit series creation');
    }

    let parsedData = seriesData;
    if (typeof seriesData === 'string') {
      try {
        parsedData = JSON.parse(seriesData);
      } catch (err) {
        throw new Error('Invalid JSON in seriesData');
      }
    }

    const seriesId = parsedData.id || Date.now().toString();

    const seriesRef = db
      .collection('users')
      .doc(userId)
      .collection('habitSeries')
      .doc(seriesId);

    const dataToStore = {
      ...parsedData,
      id: seriesId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log(`[REPOSITORY] [Habit Series] Saving series for user ${userId}`);
    try {
      await seriesRef.set(dataToStore);
      console.log(`[REPOSITORY] [Habit Series] Series saved with id ${seriesId}`);
    } catch (err) {
      console.error(`[REPOSITORY ERROR] [Habit Series] Error saving series: ${err.message}`);
      throw err;
    }

    return { id: seriesId };
  }

  /**
   * Atomic creation: persist series, deduct energy, increment counter.
   *
   * Runs inside a single Firestore transaction so all operations
   * succeed or fail together. No partial state is possible.
   *
   * @param {string} userId - User ID
   * @param {object} seriesData - Parsed series data from AI
   * @param {number} totalEnergyConsumed - Total energy to deduct
   * @returns {Promise<{id: string}>}
   */
  async atomicCommitCreation(userId, seriesData, totalEnergyConsumed) {
    if (!userId) {
      throw new ValidationError('userId is required for atomic commit');
    }

    if (!seriesData) {
      throw new ValidationError('seriesData is required for atomic commit');
    }

    const userRef = db.collection('users').doc(userId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new DataAccessFailureError({
            operation: 'atomicCommitCreation',
            collection: 'users',
          });
        }

        const userData = userDoc.data();
        const currentEnergy = userData.energy?.currentAmount || 0;

        // Validate energy inside transaction (authoritative check)
        if (currentEnergy < totalEnergyConsumed) {
          throw new InsufficientEnergyError(totalEnergyConsumed, currentEnergy);
        }

        let parsedData = seriesData;
        if (typeof seriesData === 'string') {
          parsedData = JSON.parse(seriesData);
        }

        const seriesId = parsedData.id || Date.now().toString();
        const seriesRef = userRef.collection('habitSeries').doc(seriesId);

        const dataToStore = {
          ...parsedData,
          id: seriesId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        transaction.set(seriesRef, dataToStore);

        // Deduct energy and increment counter
        const newEnergy = currentEnergy - totalEnergyConsumed;
        const currentTotalConsumption = userData.energy?.totalConsumption || 0;

        transaction.update(userRef, {
          'energy.currentAmount': newEnergy,
          'energy.totalConsumption': currentTotalConsumption + totalEnergyConsumed,
          'limits.activeSeriesCount': FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return { id: seriesId };
      });

      return result;
    } catch (error) {
      // Re-throw typed errors as-is
      if (error instanceof InsufficientEnergyError || error instanceof DataAccessFailureError) {
        throw error;
      }

      // Wrap unexpected Firestore failures
      throw new TransactionFailureError({
        operation: 'atomicCommitCreation',
        cause: error,
      });
    }
  }

  /**
   * Returns a full HabitSeries entity by ID, including its actions subcollection.
   *
   * @param {string} userId
   * @param {string} seriesId
   * @returns {Promise<HabitSeries | null>} null if the series does not exist
   */
  async getHabitSeriesById(userId, seriesId) {
    console.log(`[REPOSITORY] [Habit Series] getHabitSeriesById called - userId=${userId}, seriesId=${seriesId}`);

    const seriesRef = db
      .collection('users')
      .doc(userId)
      .collection('habitSeries')
      .doc(seriesId);

    const seriesDoc = await seriesRef.get();

    if (!seriesDoc.exists) {
      console.log(`[REPOSITORY] [Habit Series] Series document not found - seriesId=${seriesId}`);
      return null;
    }

    console.log(`[REPOSITORY] [Habit Series] Series document found - seriesId=${seriesId}`);

    const data = seriesDoc.data();
    const rawActions = data.actions ?? [];

    const actions = rawActions.map((actionData) =>
      Action.create({
        id: actionData.id,
        name: actionData.name,
        description: actionData.description,
        difficulty: actionData.difficulty,
        score: actionData.score ?? 0,
        completed: actionData.completed ?? false,
        completedAt: actionData.completedAt?.toDate?.() ?? null,
        verificationResponse: actionData.verificationResponse ?? null,
        bonusPoints: actionData.bonusPoints ?? 0,
      })
    );

    console.log(`[REPOSITORY] [Habit Series] HabitSeries entity built - seriesId=${seriesId}, actionsCount=${actions.length}`);

    return HabitSeries.create({
      id: seriesDoc.id,
      title: data.title,
      description: data.description,
      actions,
      totalScore: data.totalScore ?? 0,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      lastActivityAt: data.lastActivityAt?.toDate?.() ?? new Date(),
    });
  }

  /**
   * Atomically delete a habit series, all its actions, and decrement the counter.
   *
   * Idempotent: if the series does not exist, this is a NO-OP.
   * Concurrency-safe: Firestore optimistic concurrency retries and exits as NO-OP
   * once the series is gone, so the counter is decremented at most once per series.
   *
   * @param {string} userId - Owner user ID
   * @param {string} seriesId - Series ID to delete
   * @returns {Promise<{ deleted: boolean, activeSeriesCount_before?: number, activeSeriesCount_after?: number }>}
   */
  async delete(userId, seriesId) {
    if (!userId || !seriesId) {
      throw new ValidationError('userId and seriesId are required for delete');
    }

    const userRef = db.collection('users').doc(userId);
    const seriesRef = userRef.collection('habitSeries').doc(seriesId);
    const actionsRef = seriesRef.collection('actions');

    try {
      const result = await db.runTransaction(async (transaction) => {
        // READS FIRST (Firestore requires all reads before any writes)
        const seriesDoc = await transaction.get(seriesRef);

        if (!seriesDoc.exists) {
          // Idempotent NO-OP: series already gone, counter already decremented.
          return { deleted: false };
        }

        const actionsSnapshot = await transaction.get(actionsRef);

        // Read activeSeriesCount from user document (source of truth for limits).
        const userDoc = await transaction.get(userRef);
        const activeSeriesCount = userDoc.exists
          ? (userDoc.data().limits?.activeSeriesCount ?? 0)
          : 0;

        const newCount = Math.max(0, activeSeriesCount - 1);

        // WRITES AFTER ALL READS
        for (const actionDoc of actionsSnapshot.docs) {
          transaction.delete(actionDoc.ref);
        }

        transaction.delete(seriesRef);

        transaction.update(userRef, {
          'limits.activeSeriesCount': newCount,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          deleted: true,
          activeSeriesCount_before: activeSeriesCount,
          activeSeriesCount_after: newCount,
        };
      });

      return result;
    } catch (error) {
      throw new TransactionFailureError({
        operation: 'atomicDelete',
        cause: error,
      });
    }
  }
}

export default FirestoreHabitSeriesRepository;
