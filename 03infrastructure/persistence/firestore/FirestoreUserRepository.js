/**
 * Firestore User Repository (Infrastructure)
 *
 * ORIGEN: src/models/User.js (líneas 19-199)
 * IMPLEMENTA: domain/ports/IUserRepository.js
 * AJUSTADO: 2025-12-30 - Eliminado updateUserPlan() (fuga de lógica de negocio)
 *
 * Responsabilidades:
 * - CRUD de usuarios en Firestore
 * - Queries de usuarios
 * - Transacciones de usuario
 *
 * NOTA: updateUserPlan() fue eliminado del puerto.
 * Los casos de uso ahora usan updateUser() genérico con cálculos previos de energía.
 */

import { IUserRepository } from '../../../01domain/ports/IUserRepository.js';
import { db, FieldValue, Timestamp } from './FirebaseConfig.js';

const USERS_COLLECTION = 'users';

export class FirestoreUserRepository extends IUserRepository {
  /**
   * Crear un nuevo usuario en Firestore
   * ORIGEN: src/models/User.js:19-68
   */
  async createUser(userId, data) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    const userData = {
      email: data.email,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),

      // Plan y suscripción
      plan: data.plan || 'freemium',
      stripeCustomerId: data.stripeCustomerId || null,
      subscriptionId: null,
      subscriptionStatus: null,

      // Campos de cancelación (estándar SaaS)
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      canceledAt: null,

      // Energía
      energia: {
        actual: data.energiaInicial || 0,
        maxima: data.energiaMaxima || 0,
        ultimaRecarga: Timestamp.now(),
        consumoTotal: 0,
      },

      // Trial
      trial: {
        activo: false,
        startTimestamp: null,
        expiresAt: null,
      },

      // Límites de uso
      limits: {
        weeklySummariesUsed: 0,
        weeklySummariesResetAt: Timestamp.now(),
        activeSeriesCount: 0,
      },

      // Asistente (opcional, se crea después)
      assistant: null,

      ...data,
    };

    await userRef.set(userData);
    return userData;
  }

  /**
   * Obtener usuario por ID
   * ORIGEN: src/models/User.js:73-85
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
   * Obtener usuario por Stripe Customer ID
   * ORIGEN: src/models/User.js:90-106
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
   * Actualizar datos de usuario
   * ORIGEN: src/models/User.js:111-120
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
   * Eliminar usuario
   * ORIGEN: src/models/User.js:136-139
   */
  async deleteUser(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.delete();
  }

  /**
   * Actualizar último login
   * ORIGEN: src/models/User.js:125-131
   */
  async updateLastLogin(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Incrementar contador de resúmenes semanales
   * ORIGEN: src/models/User.js:166-173
   */
  async incrementWeeklySummaries(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      'limits.weeklySummariesUsed': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Incrementar contador de series activas
   * ORIGEN: src/models/User.js:179-186
   */
  async incrementActiveSeries(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      'limits.activeSeriesCount': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Decrementar contador de series activas
   * ORIGEN: src/models/User.js:192-199
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
