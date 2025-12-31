/**
 * Firestore Subscription Repository (Infrastructure)
 *
 * ORIGEN: src/models/Subscription.js
 *
 * ⚠️ ESTE ARCHIVO NO DEBE IMPLEMENTARSE ⚠️
 *
 * RAZÓN:
 * Las operaciones de suscripción NO necesitan un repositorio separado en la arquitectura hexagonal.
 * La lógica ha sido migrada de la siguiente forma:
 *
 * 1. LÓGICA DE NEGOCIO → domain/use-cases/ProcessSubscription.js
 *    - processCheckoutCompleted() (checkout.session.completed)
 *    - processSubscriptionUpdated() (customer.subscription.updated)
 *    - processSubscriptionDeleted() (customer.subscription.deleted)
 *
 * 2. PERSISTENCIA → infrastructure/persistence/firestore/FirestoreUserRepository.js
 *    - updateUser(userId, { subscriptionId, subscriptionStatus, ... })
 *    - getUserByCustomerId(customerId)
 *    - Las operaciones de subscription se hacen mediante IUserRepository
 *
 * 3. INTEGRACIÓN CON STRIPE → infrastructure/providers/StripeProvider.js (si existe)
 *    - Creación de checkout sessions
 *    - Cancelación de subscripciones
 *
 * CÓDIGO ORIGINAL (src/models/Subscription.js):
 * - updateSubscriptionAfterPayment() → domain/use-cases/ProcessSubscription.js:processCheckoutCompleted()
 * - updateSubscriptionStatus() → domain/use-cases/ProcessSubscription.js:processSubscriptionUpdated()
 * - markSubscriptionForCancellation() → domain/use-cases/ProcessSubscription.js:processSubscriptionUpdated()
 * - cancelSubscription() → domain/use-cases/ProcessSubscription.js:processSubscriptionDeleted()
 * - getSubscriptionStatus() → domain/use-cases/GetSubscriptionStatus.js
 *
 * PATRÓN:
 * Subscription NO es una entidad agregada separada, sino un ATRIBUTO del usuario.
 * Los datos de suscripción (subscriptionId, subscriptionStatus, cancelAtPeriodEnd, etc.)
 * se almacenan directamente en el documento del usuario en Firestore.
 * Por tanto, NO necesita su propio repositorio.
 *
 * SI en el futuro se requiere un ISubscriptionRepository separado:
 * 1. Crear domain/ports/ISubscriptionRepository.js
 * 2. Implementar aquí las operaciones específicas
 * 3. Actualizar casos de uso para inyectar el nuevo repositorio
 * 4. Considerar si subscription debe ser una colección separada en Firestore
 */

export default null;
