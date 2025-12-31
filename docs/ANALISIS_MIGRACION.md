# 📊 ANÁLISIS DE MIGRACIÓN - ARVI EVOLUTION BACKEND

**Fecha de análisis:** 2025-12-26
**Proyecto:** Arvi Evolution - Asistente IA de desarrollo personal
**Objetivo:** Migrar lógica crítica de Flutter al backend Node.js

---

## 🎯 RESUMEN EJECUTIVO

**Problema crítico identificado:**
- ❌ Claves API de OpenAI, Gemini y Firebase **expuestas en el frontend**
- ❌ Lógica de negocio manipulable desde el cliente
- ❌ Validaciones de energía, planes y límites **bypasseables**
- ❌ SharedPreferences como fuente de verdad (inseguro)

**Solución propuesta:**
- ✅ Backend Node.js con Firebase Admin SDK
- ✅ APIs externas (OpenAI/Gemini) llamadas exclusivamente server-side
- ✅ Firestore como fuente de verdad
- ✅ Validaciones y autenticación centralizadas

---

## 📁 SERVICIOS DETECTADOS EN FRONTEND

### 🔴 CRITICIDAD MÁXIMA - MIGRACIÓN OBLIGATORIA

#### 1. **energy_service.dart** (903 líneas)
**¿Qué hace?**
- Gestiona sistema de energía (moneda virtual del usuario)
- Límites por plan: Trial (135), Mini (75), Base (150), Pro (300)
- Recarga diaria automática (00:00 UTC)
- Trial de 48 horas con 2 recargas (hora 0 y hora 24)
- Sistema de integridad con hashes (client-side, manipulable)

**Problemas de seguridad:**
- ❌ Energía guardada en **SharedPreferences** (fácilmente manipulable)
- ❌ Validaciones client-side (el usuario puede modificar energía infinita)
- ❌ Hash de seguridad generado localmente (inefectivo)
- ❌ Recarga diaria calculada en cliente

**Lógica a migrar al backend:**
```javascript
// ENDPOINTS NECESARIOS
GET    /api/user/energy                    // Obtener energía actual (desde Firestore)
POST   /api/user/energy/consume            // Consumir energía (validación server-side)
POST   /api/user/trial/activate            // Activar trial 48h (una sola vez)
GET    /api/user/trial/status              // Estado del trial (tiempo restante)

// CRON JOB BACKEND
- Recarga diaria de energía a las 00:00 UTC (Cloud Function o node-cron)
- Expiración automática de trials después de 48h
```

**Datos a guardar en Firestore:**
```javascript
users/{userId}/energy {
  plan: 'mini' | 'base' | 'pro' | 'freemium',
  energiaActual: 75,
  energiaMaxima: 75,
  ultimaRecarga: Timestamp,
  trialStartTimestamp: Timestamp | null,
  trialActivo: boolean,
  consumoHistorial: [ {cantidad, timestamp, accion} ]
}
```

---

#### 2. **ai_service.dart** (>300 líneas parciales analizadas)
**¿Qué hace?**
- Llamadas directas a OpenAI GPT-4o, GPT-4o-mini
- Llamadas directas a Gemini 2.5 Flash
- Consumo de energía por cada llamada
- Conversión de respuestas a JSON estructurado
- Limpieza de texto de IA

**Problemas de seguridad:**
- ❌ Claves API de OpenAI y Gemini **expuestas en Dart**:
  ```dart
  'Authorization': 'Bearer ${Secrets.openAIapiKey}'
  ```
- ❌ El usuario puede hacer llamadas ilimitadas sin control
- ❌ No hay rate limiting server-side
- ❌ Prompt engineering visible en el código fuente

**Lógica a migrar al backend:**
```javascript
// ENDPOINTS NECESARIOS
POST   /api/ai/chat                        // Chat con IA (consume energía validada)
POST   /api/ai/habit-check                 // Validar hábito completado
POST   /api/ai/plan-generate               // Generar plan estratégico
POST   /api/ai/reprogramming               // Ritual de reprogramación

// VALIDACIONES SERVER-SIDE
1. Verificar energía disponible antes de llamar a OpenAI/Gemini
2. Decrementar energía en Firestore de forma atómica
3. Registrar uso de tokens y costos
4. Rate limiting por usuario (ej: máx 10 requests/min)
```

**Costos de energía a migrar:**
```javascript
const ENERGY_COST = {
  CHAT_MESSAGE: 1,           // Por mensaje de chat
  HABIT_COMPLETE: 2,         // Por validación de hábito
  PLAN_GENERATE: 3,          // Por plan estratégico
  REPROGRAMMING: 5,          // Por ritual completo
};
```

---

#### 3. **user_service.dart** (213 líneas)
**¿Qué hace?**
- Registro y login con Firebase Auth
- Sincronización Firestore ↔ Local
- Gestión de datos de usuario
- Eliminación de cuenta

**Problemas identificados:**
- ⚠️ Sincronización bidireccional puede causar conflictos
- ⚠️ No hay validación de correos duplicados server-side
- ⚠️ Campos críticos (energía, plan) escritos desde cliente

**Lógica a migrar al backend:**
```javascript
// ENDPOINTS NECESARIOS
POST   /api/auth/register                  // Registro con validaciones
POST   /api/auth/login                     // Login (Firebase Auth)
GET    /api/user/profile                   // Datos usuario + plan activo
PUT    /api/user/profile                   // Actualizar datos (validados)
DELETE /api/user/account                   // Eliminar cuenta
GET    /api/user/subscription              // Estado suscripción Stripe

// VALIDACIONES SERVER-SIDE
1. Email único en Firestore
2. Inicializar energía según plan al registrar
3. Activar trial automáticamente (si aplica)
```

---

#### 4. **payment_service.dart** (37 líneas)
**¿Qué hace?**
- Llama al backend actual para crear sesión de Stripe

**Estado actual:**
- ✅ Ya llama al backend (https://arvi-stripe-backend.onrender.com)
- ✅ No expone claves de Stripe

**Migración requerida:**
- 🔄 Integrar con el nuevo backend Node.js
- 🔄 Añadir manejo de Customer Portal de Stripe
- 🔄 Endpoint para cancelar suscripciones

```javascript
// ENDPOINTS ADICIONALES NECESARIOS
POST   /api/stripe/create-checkout          // Ya existe, mantener
POST   /api/stripe/portal-session           // Portal de gestión de suscripciones
POST   /api/stripe/cancel-subscription      // Cancelar suscripción
GET    /api/user/{userId}/status            // Estado suscripción (ya existe)
```

---

### 🟡 CRITICIDAD ALTA - MIGRACIÓN RECOMENDADA

#### 5. **storage_service.dart** (1447 líneas)
**¿Qué hace?**
- Gestión de SharedPreferences y Firestore
- Sincronización de asistente, proyectos, hábitos
- CustomerId de Stripe
- Archivos de memoria
- Límites semanales de features

**Problemas identificados:**
- ⚠️ Lógica de sincronización compleja y propensa a errores
- ⚠️ Contadores de límites manipulables (series activas, resúmenes semanales)
- ⚠️ Firebase hibernado en código (AppConfig.FIREBASE_ENABLED = false)

**Lógica a migrar al backend:**
```javascript
// ENDPOINTS NECESARIOS
GET    /api/user/assistant                 // Cargar asistente desde Firestore
PUT    /api/user/assistant                 // Guardar asistente (validado)
GET    /api/user/projects                  // Listar proyectos
POST   /api/user/projects                  // Crear proyecto
GET    /api/user/habits                    // Listar series temáticas
POST   /api/user/habits                    // Crear serie (validar límite según plan)
POST   /api/user/habits/{id}/complete      // Completar hábito (consume energía)

// VALIDACIONES SERVER-SIDE
1. Límites de series activas según plan (PlanLimits)
2. Límites de resúmenes semanales según plan
3. Reset semanal de contadores (Cloud Function)
```

---

#### 6. **plan_limits.dart** (29 líneas)
**¿Qué hace?**
- Define límites por plan:
  - **mini:** 2 resúmenes semanales, 2 series activas
  - **base:** 5 resúmenes semanales, 5 series activas
  - **pro:** Ilimitado (9999)
  - **freemium con trial:** Ilimitado durante 48h

**Migración:**
```javascript
// ARCHIVO: src/config/plans.js
export const PLANS = {
  TRIAL: {
    id: 'trial',
    maxWeeklySummaries: 9999,
    maxActiveSeries: 9999,
    model: 'gpt-4.1-nano',
    maxEnergy: 135,
    dailyRecharge: 135,
    duration: 48 // horas
  },
  MINI: {
    id: 'mini',
    maxWeeklySummaries: 2,
    maxActiveSeries: 2,
    model: 'gpt-5-nano',
    maxEnergy: 75,
    dailyRecharge: 75,
    stripePriceId: process.env.PRICE_MINI_TEST
  },
  // ... BASE, PRO
};
```

---

### 🟢 CRITICIDAD MEDIA - MANTENER EN FRONTEND

#### 7. **cache_service.dart** (33 líneas)
- Limpia SharedPreferences y caché local
- **Decisión:** Mantener en frontend (solo UI)

#### 8. **ads_service.dart** (124 líneas)
- Google Mobile Ads (anuncios recompensados)
- **Decisión:** Mantener en frontend (requiere SDK móvil)
- **Endpoint backend:** POST /api/user/energy/reward-ad (validar que se vio el anuncio)

#### 9. Servicios de UI/UX (navigator_service, language_service, etc.)
- **Decisión:** Mantener en frontend (solo navegación y preferencias locales)

---

## 🗺️ ARQUITECTURA OBJETIVO DEL BACKEND

### Estructura de carpetas
```
stripe_backend/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase Admin SDK
│   │   ├── stripe.js            # Configuración Stripe
│   │   ├── openai.js            # Cliente OpenAI
│   │   ├── gemini.js            # Cliente Gemini
│   │   ├── plans.js             # Definición de planes y límites
│   │   └── env.js               # Validación de .env
│   │
│   ├── models/
│   │   ├── User.js              # Schema usuario
│   │   ├── Subscription.js      # Schema suscripción
│   │   ├── Energy.js            # Schema energía
│   │   └── Habit.js             # Schema hábitos
│   │
│   ├── services/
│   │   ├── energyService.js     # Lógica energía (migrado)
│   │   ├── aiService.js         # Llamadas OpenAI/Gemini (migrado)
│   │   ├── subscriptionService.js
│   │   ├── trialService.js
│   │   └── userService.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── aiController.js
│   │   ├── energyController.js
│   │   └── webhookController.js
│   │
│   ├── middleware/
│   │   ├── auth.js              # Validar Firebase Auth token
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── validateEnergy.js    # Middleware energía
│   │   └── errorHandler.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── ai.routes.js
│   │   ├── energy.routes.js
│   │   └── webhook.routes.js
│   │
│   └── utils/
│       ├── logger.js
│       ├── validator.js
│       ├── constants.js
│       └── errorTypes.js
│
├── server.js
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## 📋 ENDPOINTS NECESARIOS (COMPLETO)

### Autenticación
```
POST   /api/auth/register        # Registro nuevo usuario
POST   /api/auth/login           # Login (Firebase Auth)
POST   /api/auth/logout          # Logout
```

### Usuario
```
GET    /api/user/profile         # Datos usuario + plan activo
PUT    /api/user/profile         # Actualizar datos
DELETE /api/user/account         # Eliminar cuenta
GET    /api/user/subscription    # Estado suscripción Stripe
GET    /api/user/assistant       # Cargar asistente
PUT    /api/user/assistant       # Guardar asistente
```

### Energía
```
GET    /api/user/energy          # Consultar energía disponible
POST   /api/user/energy/consume  # Consumir energía (validado)
POST   /api/user/energy/reward-ad # Recompensa por anuncio
```

### Trial
```
POST   /api/user/trial/activate  # Activar trial (una sola vez)
GET    /api/user/trial/status    # Estado del trial
```

### IA (server-side)
```
POST   /api/ai/chat              # Chat con OpenAI/Gemini
POST   /api/ai/habit-check       # Validar hábito completado
POST   /api/ai/plan-generate     # Generar plan estratégico
POST   /api/ai/reprogramming     # Ritual de reprogramación
```

### Hábitos
```
GET    /api/user/habits          # Listar series temáticas
POST   /api/user/habits          # Crear serie (validar límite)
PUT    /api/user/habits/{id}     # Actualizar serie
DELETE /api/user/habits/{id}     # Eliminar serie
POST   /api/user/habits/{id}/complete # Completar hábito
```

### Proyectos
```
GET    /api/user/projects        # Listar proyectos
POST   /api/user/projects        # Crear proyecto
PUT    /api/user/projects/{id}   # Actualizar proyecto
DELETE /api/user/projects/{id}   # Eliminar proyecto
```

### Stripe
```
POST   /api/stripe/create-checkout       # Crear sesión de pago
POST   /api/stripe/portal-session        # Portal de gestión
POST   /api/stripe/cancel-subscription   # Cancelar suscripción
POST   /api/webhooks/stripe              # Webhooks Stripe
GET    /api/user/{userId}/status         # Estado suscripción
```

---

## 🔐 DATOS A MIGRAR A FIRESTORE

### Colección: `users/{userId}`
```javascript
{
  // Autenticación
  email: "user@example.com",
  createdAt: Timestamp,
  lastLoginAt: Timestamp,

  // Plan y suscripción
  plan: "mini" | "base" | "pro" | "freemium",
  stripeCustomerId: "cus_...",
  subscriptionId: "sub_...",
  subscriptionStatus: "active" | "canceled" | "expired",

  // Energía
  energia: {
    actual: 75,
    maxima: 75,
    ultimaRecarga: Timestamp,
    consumoTotal: 1250
  },

  // Trial
  trial: {
    activo: false,
    startTimestamp: Timestamp | null,
    expiresAt: Timestamp | null
  },

  // Límites de uso
  limits: {
    weeklySummariesUsed: 1,
    weeklySummariesResetAt: Timestamp,
    activeSeriesCount: 2
  },

  // Asistente personalizado
  assistant: {
    nombre: "Arvi",
    edad: 28,
    genero: "masculino",
    // ... resto de propiedades
  }
}
```

### Subcolección: `users/{userId}/habits/{habitId}`
```javascript
{
  id: "uuid",
  nombre: "Meditación diaria",
  objetivo: "Meditar 10 minutos cada mañana",
  categoria: "bienestar",
  puntuacionTotal: 45,
  diasCompletados: 9,
  ultimaActividad: Timestamp,
  activo: true
}
```

### Subcolección: `users/{userId}/energyLog/{logId}`
```javascript
{
  timestamp: Timestamp,
  accion: "chat_message" | "habit_complete" | "plan_generate",
  cantidad: -1,
  energiaAntes: 76,
  energiaDespues: 75
}
```

---

## ⚠️ RIESGOS Y CONSIDERACIONES

### Seguridad
1. **Claves API:** Nunca exponer en frontend
2. **Validaciones:** Siempre server-side, nunca confiar en cliente
3. **Rate limiting:** Proteger contra abuso de endpoints IA
4. **Firebase Auth:** Validar tokens en cada request protegido

### Performance
1. **Caché:** Implementar Redis para energía frecuente
2. **Cloud Functions:** Considerar para tareas programadas (recargas diarias)
3. **Throttling:** Limitar requests por usuario/minuto

### Costos
1. **OpenAI:** Monitorear uso de tokens (GPT-4o es costoso)
2. **Gemini:** Alternativa más económica para algunas tareas
3. **Firebase:** Controlar lectura/escrituras de Firestore

---

## 📊 PRIORIZACIÓN DE MIGRACIÓN

### FASE 1 (CRÍTICO - Semana 1)
1. ✅ Configuración base del backend (Firebase Admin, Stripe)
2. ✅ Endpoints de energía (GET, POST consume)
3. ✅ Endpoints de autenticación (register, login)
4. ✅ Migración de lógica de trial (activate, status)

### FASE 2 (ALTO - Semana 2)
1. ✅ Endpoints de IA (chat, habit-check)
2. ✅ Middleware de validación de energía
3. ✅ Webhooks de Stripe (manejo de suscripciones)
4. ✅ Endpoints de usuario (profile, subscription)

### FASE 3 (MEDIO - Semana 3)
1. ✅ Endpoints de hábitos (CRUD + validaciones de límites)
2. ✅ Endpoints de proyectos
3. ✅ Sistema de logging y monitoreo
4. ✅ Tests automatizados

### FASE 4 (OPCIONAL - Semana 4)
1. ✅ Cloud Functions para tareas programadas
2. ✅ Caché con Redis
3. ✅ Analytics de uso
4. ✅ Dashboard admin

---

## 🎯 MÉTRICAS DE ÉXITO

- ✅ 0 claves API expuestas en frontend
- ✅ 100% de llamadas IA validadas server-side
- ✅ Energía como fuente de verdad en Firestore
- ✅ Rate limiting funcional (máx 10 req/min por usuario)
- ✅ Trial de 48h no manipulable
- ✅ Límites por plan respetados (series activas, resúmenes semanales)

---

**Generado por:** Claude Sonnet 4.5
**Fecha:** 2025-12-26
