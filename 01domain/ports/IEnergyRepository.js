/**
 * Energy Repository Port (Interface)
 *
 * PATRÓN: Hexagonal Architecture - Port
 * AJUSTADO: 2025-12-30 - Eliminación de fugas de lógica de negocio
 *
 * Define QUÉ necesita el dominio para trabajar con energía.
 * NO define CÓMO se implementa (sin Firestore, sin transacciones, sin logs).
 *
 * CAMBIOS:
 * - ❌ ELIMINADO: consumeEnergy() (contenía validaciones y cálculos de negocio)
 * - ❌ ELIMINADO: rechargeEnergy() (llamaba a getPlan, lógica de negocio)
 * - ❌ ELIMINADO: needsDailyRecharge() (query innecesaria, función pura existe en entities)
 * - ✅ AGREGADO: updateEnergy() (operación atómica genérica sin decisiones)
 *
 * Implementaciones esperadas:
 * - infrastructure/persistence/firestore/FirestoreEnergyRepository.js
 */

/**
 * Contrato de repositorio de energía
 *
 * RESPONSABILIDAD: Solo persistencia atómica de datos de energía.
 * NO contiene: validaciones, cálculos, decisiones de negocio.
 */
export class IEnergyRepository {
  /**
   * Obtener energía actual de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} {actual, maxima, ultimaRecarga, consumoTotal}
   */
  async getEnergy(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Actualizar energía del usuario (operación atómica)
   *
   * RESPONSABILIDAD:
   * - Persistir cambios en campos de energía
   * - Ejecutar update atómico (transacción si es necesario)
   * - Registrar log técnico si se proporciona action
   *
   * NO DEBE:
   * - Validar si tiene energía suficiente
   * - Calcular nueva energía (recibe valores ya calculados)
   * - Decidir cuánta energía asignar
   * - Llamar a getPlan() o acceder a policies
   *
   * @param {string} userId - ID del usuario
   * @param {Object} energyPatch - Campos a actualizar {actual?, maxima?, ultimaRecarga?, consumoTotal?}
   * @param {string} [action] - Acción para logging técnico (opcional, ej: 'chat_message', 'daily_recharge')
   * @returns {Promise<Object>} {actual, maxima, consumoTotal} (estado final)
   *
   * @example
   * // Consumo (calculado por el caso de uso):
   * await updateEnergy(userId, {
   *   actual: 50,
   *   consumoTotal: 150
   * }, 'chat_message');
   *
   * @example
   * // Recarga (valores calculados por el caso de uso usando getPlan):
   * await updateEnergy(userId, {
   *   actual: 135,
   *   maxima: 135,
   *   ultimaRecarga: new Date()
   * }, 'daily_recharge');
   */
  async updateEnergy(userId, energyPatch, action) {
    throw new Error('Not implemented');
  }
}

export default IEnergyRepository;
