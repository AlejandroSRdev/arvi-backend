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

import { IHabitSeriesRepository } from '../../../domain/ports/HabitSeriesRepository.js';
import { db, FieldValue, Timestamp } from './FirebaseConfig.js';

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
