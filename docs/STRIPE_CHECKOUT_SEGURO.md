# ✅ IMPLEMENTACIÓN: Autenticación Obligatoria en Stripe Checkout

## Cambios Realizados

### 1. **Server.js - Montaje de rutas seguras**
- ✅ Importado `stripeRoutes` desde `src/routes/stripe.routes.js`
- ✅ Montado en `/api/stripe` con todas las protecciones
- ✅ Endpoint legacy `/create-checkout-session` deshabilitado y marcado como deprecado
- ✅ Actualizada documentación en `/` y logs de inicio

**Nuevo endpoint**: `POST /api/stripe/create-checkout`

---

### 2. **stripe.routes.js - Controller mejorado**

#### Seguridad implementada:
- ✅ **Autenticación obligatoria**: Middleware `authenticate` en línea 28
- ✅ **UserId del token validado**: Extraído de `req.user.uid` (NO del body)
- ✅ **Validación de plan**: Verifica contra lista permitida en `config/plans.js`
- ✅ **Rechazo de planes inválidos**: 400 si plan no existe o no tiene Price ID

#### Vinculación segura del usuario:
```javascript
// Doble mecanismo de vinculación
client_reference_id: userId,  // Campo principal de Stripe
metadata: {
  userId,                     // Backup
  plan,
  source: 'arvi_backend_v2'
}
```

#### Logs estructurados:
```javascript
{
  action: 'checkout_create',
  userId: 'abc123',
  plan: 'pro',
  sessionId: 'cs_test_...',
  priceId: 'price_...',
  amount: 12.99,
  currency: 'USD'
}
```

#### Response mejorado:
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

---

## Cómo Verificarlo (Prueba HTTP)

### ✅ PRUEBA 1: Sin autenticación (debe fallar)
```bash
curl -X POST http://localhost:4242/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro"}'
```

**Respuesta esperada**: `401 Unauthorized`
```json
{
  "error": true,
  "message": "Token de autenticación no proporcionado"
}
```

---

### ✅ PRUEBA 2: Con token válido (debe crear sesión)
```bash
# Primero obtén un token de Firebase Auth

curl -X POST http://localhost:4242/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN_FIREBASE>" \
  -d '{"plan": "pro"}'
```

**Respuesta esperada**: `200 OK`
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3...",
  "sessionId": "cs_test_a1b2c3..."
}
```

**Log en consola**:
```
[2025-12-27T...] ✅ Checkout session created {
  action: 'checkout_create',
  userId: 'firebase_uid_123',
  plan: 'pro',
  sessionId: 'cs_test_a1b2c3...',
  priceId: 'price_xyz...',
  amount: 12.99,
  currency: 'USD'
}
```

---

### ✅ PRUEBA 3: Plan inválido (debe rechazar)
```bash
curl -X POST http://localhost:4242/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN_FIREBASE>" \
  -d '{"plan": "hacker_plan"}'
```

**Respuesta esperada**: `400 Bad Request`
```json
{
  "error": true,
  "message": "Plan \"hacker_plan\" no existe. Planes válidos: mini, base, pro"
}
```

---

### ✅ PRUEBA 4: Intentar enviar userId falso (será ignorado)
```bash
curl -X POST http://localhost:4242/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN_FIREBASE>" \
  -d '{"plan": "pro", "userId": "otro_usuario_123"}'
```

**Comportamiento**: El campo `userId` del body es **IGNORADO**. El backend usa el `uid` del token validado.

**Resultado**: Sesión creada para el usuario del token, NO para `otro_usuario_123`.

---

## Verificación en Stripe Dashboard

1. Ve a Stripe Dashboard → Payments → Checkout Sessions
2. Busca la sesión creada (`cs_test_...`)
3. Verifica los campos:
   - **Client reference ID**: Debe ser el `uid` de Firebase
   - **Metadata**:
     - `userId`: UID de Firebase
     - `plan`: Plan solicitado
     - `source`: `arvi_backend_v2`

---

## Flujo de Seguridad

```
Cliente → POST /api/stripe/create-checkout
           ↓
        [Middleware: authenticate]
           ↓ Valida token Firebase
           ↓ Extrae req.user.uid
           ↓
        [Controller]
           ↓ Valida plan contra PLANS
           ↓ Rechaza si inválido
           ↓ Crea sesión con client_reference_id
           ↓
        Stripe API
           ↓
        Response con URL de checkout
```

---

## Diferencias con versión legacy

| Aspecto | Legacy (`/create-checkout-session`) | Nuevo (`/api/stripe/create-checkout`) |
|---------|-------------------------------------|---------------------------------------|
| Autenticación | ❌ No requiere | ✅ Obligatoria |
| UserId | Del body (manipulable) | Del token (validado) |
| Validación de plan | Price ID hardcodeado | Valida contra `config/plans.js` |
| client_reference_id | ❌ No incluido | ✅ Incluido |
| Logs | Console.log básico | Logs estructurados |
| Response | Solo `url` | `url` + `sessionId` |

---

## Estado del Proyecto

✅ **Endpoint seguro montado**: `/api/stripe/create-checkout`
✅ **Autenticación obligatoria**: Middleware activo
✅ **UserId del token**: No acepta userId del body
✅ **Validación de plan**: Contra lista permitida
✅ **Vinculación segura**: `client_reference_id` + `metadata`
✅ **Logs estructurados**: Auditoría completa
⚠️ **Endpoint legacy**: Deshabilitado pero presente (eliminar en próxima versión)

---

## Próximos Pasos (Opcional)

1. Eliminar completamente endpoint legacy de `server.js`
2. Agregar rate limiting específico para checkout (máx 3/hora)
3. Implementar webhook handler unificado (ya existe en `webhookController.js`)
4. Agregar validación de plan según rol del usuario (freemium no puede comprar?)
