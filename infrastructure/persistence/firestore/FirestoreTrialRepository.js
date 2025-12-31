/**
 * Firestore Trial Repository (Infrastructure)
 *
 * ORIGEN: src/models/Trial.js
 *
 * ⚠️ ESTE ARCHIVO NO DEBE IMPLEMENTARSE ⚠️
 *
 * RAZÓN:
 * Las operaciones de trial NO necesitan un repositorio separado en la arquitectura hexagonal.
 * La lógica ha sido migrada de la siguiente forma:
 *
 * 1. LÓGICA DE NEGOCIO → domain/use-cases/ActivateTrial.js
 *    - Validaciones (plan freemium, trial no usado)
 *    - Cálculo de fechas (inicio, expiración)
 *    - Asignación de energía inicial
 *
 * 2. PERSISTENCIA → infrastructure/persistence/firestore/FirestoreUserRepository.js
 *    - updateUser(userId, { 'trial.activo': true, ... })
 *    - Las operaciones de trial se hacen mediante IUserRepository
 *
 * 3. REGLAS DE TRIAL → domain/policies/PlanPolicy.js
 *    - PLANS.TRIAL (duración, energía, límites)
 *
 * CÓDIGO ORIGINAL (src/models/Trial.js):
 * - activateTrial() → domain/use-cases/ActivateTrial.js:activateTrial()
 * - isTrialActive() → domain/use-cases/GetTrialStatus.js (si existe) o lógica inline
 * - getTrialStatus() → domain/use-cases/GetTrialStatus.js
 * - needsTrialRecharge() → domain/policies/EnergyPolicy.js o caso de uso
 *
 * PATRÓN:
 * Trial NO es una entidad agregada separada, sino un ATRIBUTO del usuario.
 * Por tanto, NO necesita su propio repositorio.
 *
 * SI en el futuro se requiere un ITrialRepository separado:
 * 1. Crear domain/ports/ITrialRepository.js
 * 2. Implementar aquí las operaciones específicas
 * 3. Actualizar casos de uso para inyectar el nuevo repositorio
 */

export default null;
