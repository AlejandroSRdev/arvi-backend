/**
 * User Repository Port (Interface)
 *
 * PATRÓN: Hexagonal Architecture - Port
 * EXTRACCIÓN: src/models/User.js
 *
 * Define QUÉ necesita el dominio para trabajar con usuarios.
 * NO define CÓMO se implementa (sin Firestore, sin SDKs).
 *
 * Implementaciones esperadas:
 * - infrastructure/persistence/firestore/FirestoreUserRepository.js
 */

/**
 * Contrato de repositorio de usuarios
 *
 * Todas las operaciones extraídas de src/models/User.js (líneas 19-199)
 */
export class IUserRepository {
  /**
   * Obtener usuario por ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Usuario o null si no existe
   */
  async getUser(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Obtener usuario por Stripe Customer ID
   * @param {string} customerId - Stripe Customer ID
   * @returns {Promise<Object|null>} Usuario o null si no existe
   */
  async getUserByCustomerId(customerId) {
    throw new Error('Not implemented');
  }

  /**
   * Crear un nuevo usuario
   * @param {string} userId - ID del usuario
   * @param {Object} data - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser(userId, data) {
    throw new Error('Not implemented');
  }

  /**
   * Actualizar datos de usuario
   * @param {string} userId - ID del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUser(userId, data) {
    throw new Error('Not implemented');
  }

  /**
   * Eliminar usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Actualizar último login
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Incrementar contador de resúmenes semanales
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async incrementWeeklySummaries(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Incrementar contador de series activas
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async incrementActiveSeries(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Decrementar contador de series activas
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async decrementActiveSeries(userId) {
    throw new Error('Not implemented');
  }
}

export default IUserRepository;
