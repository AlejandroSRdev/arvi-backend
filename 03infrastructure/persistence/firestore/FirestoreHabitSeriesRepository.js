/**
 * Firestore Habit Series Repository (Infrastructure)
 *
 * IMPLEMENTA: domain/ports/IHabitSeriesRepository.js
 * FECHA CREACIÓN: 2026-01-09
 *
 * Responsabilidades:
 * - Persistir series de hábitos generadas por IA en Firestore
 * - Generar IDs únicos si no existen
 * - Añadir timestamps de creación y actualización
 * - Escribir en el path: users/{userId}/habitSeries/{seriesId}
 *
 * NO contiene:
 * - Lógica de negocio
 * - Validaciones complejas de ownership
 * - Incremento de contadores (se hará en siguiente iteración)
 */

import { IHabitSeriesRepository } from '../../../01domain/ports/HabitSeriesRepository.js';
import {
  InsufficientEnergyError,
  ValidationError,
  DataAccessFailureError,
  TransactionFailureError,
} from '../../../errors/index.ts';
import { db, FieldValue } from './FirebaseConfig.js';

export class FirestoreHabitSeriesRepository extends IHabitSeriesRepository {
  /**
   * Crear una serie de hábitos generada por IA
   *
   * @param {string} userId - ID del usuario propietario
   * @param {object} seriesData - Datos de la serie (puede ser string JSON o objeto)
   * @returns {Promise<{id: string}>} - ID de la serie creada
   * @throws {Error} - Si los datos son inválidos
   */
  async createFromAI(userId, seriesData) {
    if (!userId) {
      throw new Error('userId is required for habit series creation');
    }

    if (!seriesData) {
      throw new Error('seriesData is required for habit series creation');
    }

    // Parsear seriesData si es string
    let parsedData = seriesData;
    if (typeof seriesData === 'string') {
      try {
        parsedData = JSON.parse(seriesData);
      } catch (err) {
        throw new Error('Invalid JSON in seriesData');
      }
    }

    // Generar ID si no existe
    const seriesId = parsedData.id || Date.now().toString();

    // Referencia a la serie en Firestore
    const seriesRef = db
      .collection('users')
      .doc(userId)
      .collection('habitSeries')
      .doc(seriesId);

    // Preparar datos para persistir
    const dataToStore = {
      ...parsedData,
      id: seriesId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Escribir en Firestore
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
   * @returns {Promise<{id: string}>} - ID of the created series
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
        // Re-read user document inside transaction
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

        // Prepare series data
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

        // Persist habit series
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
   * Eliminar una serie de hábitos
   *
   * @param {string} userId - ID del usuario propietario
   * @param {string} seriesId - ID de la serie a eliminar
   * @returns {Promise<{deleted: boolean}>} - Confirmación de eliminación
   * @throws {Error} - Si los parámetros son inválidos o la serie no existe
   */
  async delete(userId, seriesId) {
    if (!userId || !seriesId) {
      throw new Error('Invalid delete parameters');
    }

    const ref = db
      .collection('users')
      .doc(userId)
      .collection('habitSeries')
      .doc(seriesId);

    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new Error('SERIES_NOT_FOUND');
    }

    await ref.delete();
    return { deleted: true };
  }
}

export default FirestoreHabitSeriesRepository;
