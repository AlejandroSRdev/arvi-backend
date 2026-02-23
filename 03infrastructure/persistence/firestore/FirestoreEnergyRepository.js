/**
 * Layer: Infrastructure
 * File: FirestoreEnergyRepository.js
 * Responsibility:
 * Implements IEnergyRepository by reading and writing user energy data in Firestore using atomic transactions.
 */

import { IEnergyRepository } from '../../../01domain/ports/IEnergyRepository.js';
import { db, FieldValue } from './FirebaseConfig.js';

const USERS_COLLECTION = 'users';
const ENERGY_LOGS_COLLECTION = 'energyLog';

export class FirestoreEnergyRepository extends IEnergyRepository {
  /**
   * Get current energy for a user.
   *
   * Reads from Firestore English fields and returns
   * the application-layer contract (Spanish keys).
   */
  async getEnergy(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error('User not found');
    }

    const data = doc.data();

    return {
      actual: data.energy?.currentAmount || 0,
      maxima: data.energy?.maxAmount || 0,
      ultimaRecarga: data.energy?.lastRechargedAt ?? null,
      consumoTotal: data.energy?.totalConsumption || 0,
    };
  }

  /**
   * Update user energy (atomic operation).
   *
   * Accepts application-layer keys (actual, maxima, etc.)
   * and writes to Firestore English fields.
   *
   * @param {string} userId
   * @param {Object} energyPatch - {actual?, maxima?, ultimaRecarga?, consumoTotal?}
   * @param {string} [action] - Action label for technical logging
   * @returns {Promise<Object>} {actual, maxima, consumoTotal}
   */
  async updateEnergy(userId, energyPatch, action) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentEnergy = userData.energy || {};

        // Map application keys to Firestore field paths
        const updateData = {};

        if (energyPatch.actual !== undefined) {
          updateData['energy.currentAmount'] = energyPatch.actual;
        }

        if (energyPatch.maxima !== undefined) {
          updateData['energy.maxAmount'] = energyPatch.maxima;
        }

        if (energyPatch.ultimaRecarga !== undefined) {
          updateData['energy.lastRechargedAt'] = energyPatch.ultimaRecarga;
        }

        if (energyPatch.consumoTotal !== undefined) {
          updateData['energy.totalConsumption'] = energyPatch.consumoTotal;
        }

        updateData.updatedAt = FieldValue.serverTimestamp();

        transaction.update(userRef, updateData);

        const finalState = {
          actual: energyPatch.actual !== undefined ? energyPatch.actual : currentEnergy.currentAmount,
          maxima: energyPatch.maxima !== undefined ? energyPatch.maxima : currentEnergy.maxAmount,
          consumoTotal: energyPatch.consumoTotal !== undefined ? energyPatch.consumoTotal : currentEnergy.totalConsumption,
        };

        if (action) {
          const logRef = userRef.collection(ENERGY_LOGS_COLLECTION).doc();

          let amount = 0;
          if (energyPatch.actual !== undefined && currentEnergy.currentAmount !== undefined) {
            amount = energyPatch.actual - currentEnergy.currentAmount;
          }

          transaction.set(logRef, {
            timestamp: FieldValue.serverTimestamp(),
            action,
            amount,
            energyBefore: currentEnergy.currentAmount || 0,
            energyAfter: finalState.actual,
          });
        }

        return finalState;
      });

      if (action) {
        console.log(`[Energy] Updated for ${userId} (action: ${action})`);
      }

      return result;
    } catch (error) {
      console.error(`[Energy] Error updating energy: ${error.message}`);
      throw error;
    }
  }
}

export default FirestoreEnergyRepository;
