# Flujo de Cancelación de Suscripciones Stripe - ESTÁNDAR SaaS

## Estado: ✅ CERRADO DEFINITIVAMENTE

La lógica de cancelación ahora sigue el estándar SaaS correcto, con separación clara entre cancelación programada y cancelación efectiva.

---

## Campos Agregados al Usuario (Firestore)

### Schema actualizado en `src/models/User.js`:

```javascript
{
  // ... campos existentes ...

  // Campos de cancelación (estándar SaaS)
  cancelAtPeriodEnd: false,        // boolean - ¿Cancelación programada?
  currentPeriodEnd: null,          // Timestamp | null - Fecha fin de periodo
  canceledAt: null,                // Timestamp | null - Fecha cancelación efectiva
}
```

**Nota:** Estos campos se agregan automáticamente en `createUser()` y NO afectan usuarios existentes (compatibilidad backward).

---

## Funciones Nuevas en `src/models/Subscription.js`

### 1. `markSubscriptionForCancellation(userId, currentPeriodEndTimestamp)`

**Cuándo se llama:** Desde `customer.subscription.updated` cuando `cancel_at_period_end === true`

**Qué hace:**
- Marca `cancelAtPeriodEnd = true`
- Guarda `currentPeriodEnd` (fecha hasta la cual el usuario mantiene acceso)
- **NO cambia el plan** (usuario sigue con premium/pro hasta el fin del periodo)

```javascript
await markSubscriptionForCancellation(userId, currentPeriodEnd);
```

---

### 2. `cancelSubscription(userId)` - ACTUALIZADO

**Cuándo se llama:** Desde `customer.subscription.deleted` (fin real del periodo)

**Qué hace:**
- Marca `subscriptionStatus = 'canceled'`
- Resetea `cancelAtPeriodEnd = false`
- Resetea `currentPeriodEnd = null`
- Guarda `canceledAt = now()`

```javascript
await cancelSubscription(userId);
```

---

### 3. `updateSubscriptionAfterPayment(userId, subscriptionData)` - ACTUALIZADO

**Cuándo se llama:** Desde `checkout.session.completed`

**Qué hace:**
- Activa la suscripción
- **Resetea campos de cancelación** (nueva suscripción activa limpia)

```javascript
await updateSubscriptionAfterPayment(userId, {
  subscriptionId,
  customerId,
  status: 'active',
});
```

---

## Flujo Completo de Webhooks

### Evento 1: `checkout.session.completed`

**Cuándo ocurre:** Usuario completa pago exitosamente

**Handler:** `handleCheckoutCompleted()`

**Acciones:**
1. Actualiza suscripción:
   - `subscriptionId`
   - `subscriptionStatus = 'active'`
   - `stripeCustomerId`
   - **Resetea:** `cancelAtPeriodEnd = false`, `currentPeriodEnd = null`, `canceledAt = null`

2. Actualiza plan:
   - `plan = 'premium' | 'pro'`
   - `energia.maxima = [según plan]`

**Estado final:** Usuario con suscripción activa y acceso completo

---

### Evento 2A: `customer.subscription.updated` (CANCELACIÓN PROGRAMADA)

**Cuándo ocurre:** Usuario cancela suscripción en Stripe Dashboard o vía API

**Handler:** `handleSubscriptionUpdated()`

**Condición:** `subscription.cancel_at_period_end === true`

**Acciones:**
1. **NO cambia el plan** (usuario mantiene premium/pro)
2. Marca cancelación programada:
   - `cancelAtPeriodEnd = true`
   - `currentPeriodEnd = Timestamp(subscription.current_period_end)`

**Estado final:** Usuario mantiene acceso hasta `currentPeriodEnd`

**Logs:**
```
⏳ [Webhook] Cancelación programada para fin de periodo
   → Acceso hasta: 2025-02-15T23:59:59.000Z
```

---

### Evento 2B: `customer.subscription.updated` (CAMBIO DE ESTADO)

**Cuándo ocurre:** Cambios en el estado de la suscripción (past_due, unpaid, etc.)

**Handler:** `handleSubscriptionUpdated()`

**Condición:** `subscription.cancel_at_period_end === false`

**Acciones:**
1. Actualiza solo el estado:
   - `subscriptionStatus = status` (active, past_due, unpaid, etc.)
2. **NO cambia el plan**
3. **NO toca campos de cancelación**

**Estado final:** Usuario con estado actualizado, plan sin cambios

---

### Evento 3: `customer.subscription.deleted` (CANCELACIÓN EFECTIVA)

**Cuándo ocurre:** Fin real del periodo de suscripción

**Handler:** `handleSubscriptionDeleted()`

**Acciones:**
1. Cancela suscripción:
   - `subscriptionStatus = 'canceled'`
   - `cancelAtPeriodEnd = false`
   - `currentPeriodEnd = null`
   - `canceledAt = now()`

2. **Revierte plan a freemium:**
   - `plan = 'freemium'`
   - `energia.maxima = [energía freemium]`

**Estado final:** Usuario en freemium sin acceso premium

**Logs:**
```
❌ [Webhook] customer.subscription.deleted
   → Este es el FIN REAL del periodo - usuario pierde acceso
```

---

## Diagrama de Flujo Temporal

```
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 1: Usuario compra suscripción                              │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ checkout.session.completed                                 │ │
│ │ → plan = 'premium'                                         │ │
│ │ → subscriptionStatus = 'active'                            │ │
│ │ → cancelAtPeriodEnd = false                                │ │
│ │ → currentPeriodEnd = null                                  │ │
│ │ → Usuario tiene ACCESO COMPLETO ✅                         │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DÍA 15: Usuario cancela suscripción (programada)               │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ customer.subscription.updated                              │ │
│ │ → cancel_at_period_end = true                              │ │
│ │                                                            │ │
│ │ Backend ejecuta:                                           │ │
│ │ → cancelAtPeriodEnd = true                                 │ │
│ │ → currentPeriodEnd = Timestamp(31 DIC 2025)                │ │
│ │ → plan = 'premium' (SIN CAMBIOS ✅)                        │ │
│ │ → Usuario mantiene ACCESO COMPLETO hasta fin de periodo ✅ │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DÍA 31 (31 DIC 2025): Fin del periodo                          │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ customer.subscription.deleted                              │ │
│ │                                                            │ │
│ │ Backend ejecuta:                                           │ │
│ │ → subscriptionStatus = 'canceled'                          │ │
│ │ → cancelAtPeriodEnd = false                                │ │
│ │ → currentPeriodEnd = null                                  │ │
│ │ → canceledAt = now()                                       │ │
│ │ → plan = 'freemium' (AQUÍ SÍ cambia ✅)                    │ │
│ │ → Usuario pierde ACCESO PREMIUM ❌                         │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reglas de Negocio Implementadas

### ✅ Regla 1: Cancelación programada NO cambia el plan
- En `subscription.updated` con `cancel_at_period_end = true`
- Solo se marcan los campos de cancelación
- El usuario mantiene acceso hasta `currentPeriodEnd`

### ✅ Regla 2: Cambios de estado NO afectan el plan
- En `subscription.updated` sin cancelación
- Solo se actualiza `subscriptionStatus`
- Estados: active, past_due, unpaid, trialing, etc.

### ✅ Regla 3: Solo `subscription.deleted` revierte a freemium
- Este es el ÚNICO evento que cambia el plan de vuelta
- Representa el fin real del periodo pagado
- El usuario pierde acceso inmediatamente

### ✅ Regla 4: Nuevas suscripciones limpian el estado
- En `checkout.session.completed`
- Se resetean todos los campos de cancelación
- Suscripción completamente limpia

---

## Frontend: ¿Cómo Detectar Cancelación Programada?

El frontend **NO decide nada**, solo lee de Firestore:

```javascript
// Leer estado del usuario desde Firestore
const user = await getUser(userId);

if (user.cancelAtPeriodEnd) {
  // Mostrar: "Tu suscripción finalizará el [currentPeriodEnd]"
  // Usuario mantiene acceso hasta esa fecha
  console.log(`Acceso hasta: ${user.currentPeriodEnd.toDate()}`);
} else if (user.subscriptionStatus === 'active') {
  // Mostrar: "Suscripción activa"
  console.log('Acceso completo');
} else if (user.plan === 'freemium') {
  // Mostrar: "Plan gratuito - Actualiza para premium"
  console.log('Sin suscripción activa');
}
```

**Fuente de verdad:** Firestore (actualizado por backend vía webhooks)

---

## Testing Manual

### Caso 1: Compra de suscripción
1. Usuario completa checkout
2. Verificar en Firestore:
   - `plan = 'premium'`
   - `subscriptionStatus = 'active'`
   - `cancelAtPeriodEnd = false`

### Caso 2: Cancelación programada
1. Cancelar suscripción en Stripe Dashboard
2. Esperar webhook `subscription.updated`
3. Verificar en Firestore:
   - `plan = 'premium'` (SIN CAMBIOS)
   - `cancelAtPeriodEnd = true`
   - `currentPeriodEnd = [fecha futura]`

### Caso 3: Fin del periodo
1. Esperar a que llegue `currentPeriodEnd`
2. Stripe envía `subscription.deleted`
3. Verificar en Firestore:
   - `plan = 'freemium'` (AQUÍ SÍ cambia)
   - `subscriptionStatus = 'canceled'`
   - `cancelAtPeriodEnd = false`
   - `canceledAt = [fecha actual]`

---

## Archivos Modificados

### 1. `src/models/User.js` (líneas 33-36)
- Agregados campos: `cancelAtPeriodEnd`, `currentPeriodEnd`, `canceledAt`

### 2. `src/models/Subscription.js`
- **Nueva función:** `markSubscriptionForCancellation(userId, currentPeriodEndTimestamp)`
- **Actualizada:** `updateSubscriptionAfterPayment()` - resetea campos de cancelación
- **Actualizada:** `cancelSubscription()` - resetea flags y marca `canceledAt`

### 3. `src/controllers/webhookController.js`
- **Actualizado:** `handleCheckoutCompleted()` - sin cambios funcionales
- **Actualizado:** `handleSubscriptionUpdated()` - distingue cancelación vs cambio de estado
- **Actualizado:** `handleSubscriptionDeleted()` - cancelación definitiva

---

## Estado Final

```
✅ Cancelación programada: Usuario mantiene acceso hasta fin de periodo
✅ Cancelación efectiva: Usuario pierde acceso y vuelve a freemium
✅ Backend es la única fuente de verdad (webhooks de Stripe)
✅ Frontend solo lee estado desde Firestore
✅ Sin cron jobs, sin lógica manual, sin race conditions
✅ Código defensivo, explícito y listo para producción
```

**PUNTO CERRADO DEFINITIVAMENTE.**
