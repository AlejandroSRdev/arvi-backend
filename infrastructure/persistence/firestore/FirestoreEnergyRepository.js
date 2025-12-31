/**
 * Firestore Energy Repository (Infrastructure)
 *
 * ORIGEN: src/models/Energy.js (líneas 28-189)
 * IMPLEMENTA: domain/ports/IEnergyRepository.js
 * AJUSTADO: 2025-12-30 - Eliminadas fugas de lógica de negocio
 *
 * Responsabilidades:
 * - Operaciones de energía en Firestore
 * - Transacciones atómicas de persistencia
 * - Logs técnicos de energía
 *
 * CAMBIOS ARQUITECTURALES:
 * - ❌ ELIMINADO: consumeEnergy() (validaba y calculaba energía - lógica de negocio)
 * - ❌ ELIMINADO: rechargeEnergy() (llamaba a getPlan() - lógica de negocio)
 * - ❌ ELIMINADO: needsDailyRecharge() (query innecesaria, existe función pura en entities)
 * - ✅ IMPLEMENTADO: updateEnergy() (operación atómica genérica SIN decisiones)
 *
 * RESPONSABILIDAD ACTUAL:
 * - Recibir valores YA CALCULADOS por el caso de uso
 * - Persistir atómicamente (transacción)
 * - Registrar logs técnicos
 * - NO validar, NO calcular, NO decidir
 */

import { IEnergyRepository } from '../../../domain/ports/IEnergyRepository.js';
import { db, FieldValue } from './FirebaseConfig.js';

const USERS_COLLECTION = 'users';
const ENERGY_LOGS_COLLECTION = 'energyLog';

export class FirestoreEnergyRepository extends IEnergyRepository {
  /**
   * Obtener energía actual de un usuario
   * ORIGEN: src/models/Energy.js:28-44
   */
  async getEnergy(userId) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const data = doc.data();

    return {
      actual: data.energia?.actual || 0,
      maxima: data.energia?.maxima || 0,
      ultimaRecarga: data.energia?.ultimaRecarga,
      consumoTotal: data.energia?.consumoTotal || 0,
    };
  }

  /**
   * Actualizar energía del usuario (operación atómica)
   *
   * RESPONSABILIDAD:
   * - Persistir cambios en campos de energía (YA CALCULADOS por el caso de uso)
   * - Ejecutar update atómico con transacción
   * - Registrar log técnico si se proporciona action
   *
   * NO HACE:
   * - Validar si tiene energía suficiente (caso de uso lo hace)
   * - Calcular nueva energía (caso de uso lo hace)
   * - Decidir cuánta energía asignar (caso de uso lo hace con getPlan)
   * - Llamar a getPlan() o policies
   *
   * @param {string} userId - ID del usuario
   * @param {Object} energyPatch - Campos a actualizar {actual?, maxima?, ultimaRecarga?, consumoTotal?}
   * @param {string} [action] - Acción para logging técnico (opcional)
   * @returns {Promise<Object>} {actual, maxima, consumoTotal} (estado final)
   */
  async updateEnergy(userId, energyPatch, action) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('Usuario no encontrado');
        }

        const userData = userDoc.data();
        const energiaActual = userData.energia || {};

        // Construir update solo con campos proporcionados
        const updateData = {};

        if (energyPatch.actual !== undefined) {
          updateData['energia.actual'] = energyPatch.actual;
        }

        if (energyPatch.maxima !== undefined) {
          updateData['energia.maxima'] = energyPatch.maxima;
        }

        if (energyPatch.ultimaRecarga !== undefined) {
          updateData['energia.ultimaRecarga'] = energyPatch.ultimaRecarga;
        }

        if (energyPatch.consumoTotal !== undefined) {
          updateData['energia.consumoTotal'] = energyPatch.consumoTotal;
        }

        updateData.updatedAt = FieldValue.serverTimestamp();

        // Actualizar energía
        transaction.update(userRef, updateData);

        // Estado final para retornar
        const finalState = {
          actual: energyPatch.actual !== undefined ? energyPatch.actual : energiaActual.actual,
          maxima: energyPatch.maxima !== undefined ? energyPatch.maxima : energiaActual.maxima,
          consumoTotal: energyPatch.consumoTotal !== undefined ? energyPatch.consumoTotal : energiaActual.consumoTotal,
        };

        // Registrar log técnico si se proporciona action
        if (action) {
          const logRef = userRef.collection(ENERGY_LOGS_COLLECTION).doc();

          // Calcular amount para el log (positivo para recargas, negativo para consumos)
          let amount = 0;
          if (energyPatch.actual !== undefined && energiaActual.actual !== undefined) {
            amount = energyPatch.actual - energiaActual.actual;
          }

          transaction.set(logRef, {
            timestamp: FieldValue.serverTimestamp(),
            action,
            amount,
            energiaAntes: energiaActual.actual || 0,
            energiaDespues: finalState.actual,
          });
        }

        return finalState;
      });

      // Log técnico de operación exitosa
      if (action) {
        console.log(`✅ [Energy] Actualizado energía para ${userId} (acción: ${action})`);
      }

      return result;
    } catch (error) {
      console.error(`❌ [Energy] Error actualizando energía: ${error.message}`);
      throw error;
    }
  }
}

export default FirestoreEnergyRepository;
