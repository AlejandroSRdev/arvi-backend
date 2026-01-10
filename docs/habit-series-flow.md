# Flujo de Creación de Serie de Hábitos

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  POST /api/habits/series                                         │
│  Authorization: Bearer <firebase-token>                          │
│  Body: {}                                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  Routes: habitSeries.routes.js                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                MIDDLEWARE: authenticate.js                       │
│  1. Extrae token del header Authorization                       │
│  2. Valida con Firebase Admin SDK                               │
│  3. Decodifica token                                             │
└────────────────┬───────────────────────┬────────────────────────┘
                 │                       │
            ✅ Válido               ❌ Inválido
                 │                       │
                 │                       ▼
                 │              ┌─────────────────┐
                 │              │ 401 Unauthorized│
                 │              │ AuthenticationError
                 │              └─────────────────┘
                 │
                 ▼
        req.user = { uid, email }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           CONTROLLER: HabitSeriesController.js                  │
│  createHabitSeriesEndpoint()                                     │
│  - Extrae userId de req.user.uid                                │
│  - Inyecta userRepository                                        │
│  - Llama al use case                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DOMAIN LAYER: Use Case                              │
│  createHabitSeries.js                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         VALIDACIÓN 1: validateFeatureAccess()                   │
│  ValidatePlanAccess.js                                           │
│                                                                  │
│  1. Obtiene usuario desde Firestore                             │
│     userRepository.getUser(userId)                               │
│                                                                  │
│  2. Determina plan efectivo:                                    │
│     - Si user.plan === 'freemium' && trial.activo               │
│       → effectivePlan = 'trial'                                  │
│     - Sino → effectivePlan = user.plan                           │
│                                                                  │
│  3. Verifica acceso en PlanPolicy.FEATURE_ACCESS                │
│     hasFeatureAccess(plan, 'habits.series.create')               │
└────────────────┬───────────────────────┬────────────────────────┘
                 │                       │
          ✅ Tiene acceso          ❌ Sin acceso
                 │                       │
                 │                       ▼
                 │              ┌─────────────────────────────┐
                 │              │ 403 Forbidden               │
                 │              │ {                            │
                 │              │   "allowed": false,          │
                 │              │   "reason": "FEATURE_NOT_    │
                 │              │             ALLOWED",        │
                 │              │   "planId": "freemium",      │
                 │              │   "featureKey": "habits...   │
                 │              │ }                            │
                 │              └─────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       VALIDACIÓN 2: validateActiveSeriesLimit()                 │
│  ValidatePlanAccess.js                                           │
│                                                                  │
│  1. Obtiene usuario desde Firestore (nuevamente)                │
│                                                                  │
│  2. Determina plan efectivo                                     │
│                                                                  │
│  3. Obtiene límites del plan (PlanPolicy.PLANS):                │
│     - Freemium: maxActiveSeries = 0                             │
│     - Trial:    maxActiveSeries = 9999                          │
│     - Mini:     maxActiveSeries = 2                             │
│     - Base:     maxActiveSeries = 5                             │
│     - Pro:      maxActiveSeries = 9999                          │
│                                                                  │
│  4. Compara:                                                     │
│     user.limits.activeSeriesCount >= plan.maxActiveSeries       │
└────────────────┬───────────────────────┬────────────────────────┘
                 │                       │
        ✅ Dentro del límite    ❌ Límite alcanzado
                 │                       │
                 │                       ▼
                 │              ┌─────────────────────────────┐
                 │              │ 429 Too Many Requests       │
                 │              │ {                            │
                 │              │   "allowed": false,          │
                 │              │   "reason": "LIMIT_REACHED", │
                 │              │   "limitType": "active_      │
                 │              │                series",      │
                 │              │   "used": 2,                 │
                 │              │   "max": 2                   │
                 │              │ }                            │
                 │              └─────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPUESTA EXITOSA                             │
│  200 OK                                                          │
│  {                                                               │
│    "allowed": true                                               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Recibe confirmación para proceder con la creación              │
└─────────────────────────────────────────────────────────────────┘
```

## Códigos de Estado HTTP

| Código | Descripción | Razón |
|--------|-------------|-------|
| **200** | OK | Usuario puede crear serie de hábitos |
| **401** | Unauthorized | Token inválido o expirado |
| **403** | Forbidden | Plan no tiene acceso a la feature |
| **429** | Too Many Requests | Límite de series activas alcanzado |
| **500** | Internal Server Error | Error en el servidor |

## Estructura de Respuestas

### 200 OK - Éxito
```json
{
  "allowed": true
}
```

### 401 Unauthorized - Token inválido
```json
{
  "error": "Token inválido o expirado"
}
```

### 403 Forbidden - Sin acceso a la feature
```json
{
  "allowed": false,
  "reason": "FEATURE_NOT_ALLOWED",
  "planId": "freemium",
  "featureKey": "habits.series.create"
}
```

### 403 Forbidden - Usuario no encontrado
```json
{
  "allowed": false,
  "reason": "USER_NOT_FOUND"
}
```

### 429 Too Many Requests - Límite alcanzado
```json
{
  "allowed": false,
  "reason": "LIMIT_REACHED",
  "limitType": "active_series",
  "used": 2,
  "max": 2
}
```

## Límites por Plan

| Plan | maxActiveSeries | Descripción |
|------|-----------------|-------------|
| **Freemium** | 0 | Sin acceso (requiere trial) |
| **Trial** | 9999 | Ilimitado durante 48h |
| **Mini** | 2 | Máximo 2 series activas |
| **Base** | 5 | Máximo 5 series activas |
| **Pro** | 9999 | Series ilimitadas |

## Archivos Involucrados

### Infrastructure Layer
- `infrastructure/http/routes/habitSeries.routes.js` - Definición de rutas
- `infrastructure/http/controllers/HabitSeriesController.js` - Controlador HTTP
- `infrastructure/http/middleware/authenticate.js` - Autenticación Firebase

### Domain Layer
- `domain/use-cases/createHabitSeries.js` - Lógica de negocio principal
- `domain/use-cases/ValidatePlanAccess.js` - Validaciones de plan y límites
- `domain/policies/PlanPolicy.js` - Definición de planes y permisos

### Application Layer
- `server.js` - Registro de rutas

## Notas Importantes

1. **Este endpoint NO crea la serie de hábitos**, solo valida si el usuario puede crearla
2. **El frontend debe**:
   - Llamar a este endpoint primero
   - Si recibe `allowed: true`, proceder con la creación
   - Manejar los diferentes códigos de error apropiadamente

3. **La validación es doble**:
   - Primero verifica acceso a la feature según el plan
   - Luego verifica que no se haya alcanzado el límite de series activas

4. **Plan Trial**:
   - Los usuarios en freemium con trial activo obtienen límites de plan Pro
   - maxActiveSeries = 9999 (ilimitado)
