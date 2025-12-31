# 📚 ÍNDICE COMPLETO DEL PROYECTO

**Proyecto:** Arvi Backend Node.js
**Versión:** 1.0.0
**Fecha:** 2025-12-26

---

## 📂 ESTRUCTURA DEL PROYECTO

```
stripe_backend/
├── 📄 Archivos de configuración raíz
│   ├── package.json                    # Dependencias y scripts npm
│   ├── package-lock.json               # Lockfile de dependencias
│   ├── server.js                       # Entry point del servidor
│   ├── render.yaml                     # Configuración para deploy en Render.com
│   ├── .env.example                    # Template de variables de entorno
│   ├── .env                            # Variables de entorno (NO en git)
│   ├── .gitignore                      # Archivos ignorados por git
│   └── firebase-service-account.json   # Credenciales Firebase (NO en git)
│
├── 📚 Documentación
│   ├── README.md                       # Documentación principal (310 líneas)
│   ├── RESUMEN_EJECUTIVO.md            # Resumen completo del proyecto
│   ├── ANALISIS_MIGRACION.md           # Análisis de migración desde Flutter
│   ├── ANALISIS_AI_SERVICE.md          # Análisis exhaustivo de ai_service.dart (352 líneas)
│   ├── CORRECCIONES_AI_SERVICE.md      # Correcciones críticas aplicadas
│   ├── GUIA_MIGRACION_FLUTTER.md       # Guía paso a paso para migrar Flutter (500 líneas)
│   ├── EJEMPLOS_PRUEBA.md              # Ejemplos de testing de endpoints
│   ├── MIGRACION_COMPLETADA.md         # Reporte de migración completada
│   └── INDICE_PROYECTO.md              # Este archivo
│
├── 📁 src/
│   │
│   ├── 📁 config/                      # Configuración de servicios externos
│   │   ├── env.js                      # Validación de variables de entorno
│   │   ├── firebase.js                 # Firebase Admin SDK
│   │   ├── stripe.js                   # Stripe SDK
│   │   ├── openai.js                   # OpenAI SDK
│   │   ├── gemini.js                   # Google Gemini SDK
│   │   └── plans.js                    # Definición de planes y límites
│   │
│   ├── 📁 models/                      # Modelos de datos (Firestore)
│   │   ├── User.js                     # Modelo de usuario
│   │   ├── Energy.js                   # Modelo de energía
│   │   ├── Trial.js                    # Modelo de trial de 48h
│   │   └── Subscription.js             # Modelo de suscripción Stripe
│   │
│   ├── 📁 services/                    # Lógica de negocio
│   │   ├── aiService.js                # Servicio de IA (OpenAI + Gemini) ✅ CORREGIDO
│   │   └── energyService.js            # Servicio de gestión de energía
│   │
│   ├── 📁 controllers/                 # Controladores de endpoints
│   │   ├── authController.js           # Autenticación y registro
│   │   ├── userController.js           # Gestión de usuarios
│   │   ├── energyController.js         # Endpoints de energía
│   │   ├── aiController.js             # Endpoints de IA ✅ CORREGIDO
│   │   └── webhookController.js        # Webhooks de Stripe
│   │
│   ├── 📁 middleware/                  # Middleware de Express
│   │   ├── auth.js                     # Autenticación Firebase
│   │   ├── rateLimiter.js              # Rate limiting
│   │   ├── validateEnergy.js           # Validación de energía
│   │   └── errorHandler.js             # Manejo global de errores
│   │
│   ├── 📁 routes/                      # Definición de rutas
│   │   ├── auth.routes.js              # Rutas de autenticación
│   │   ├── user.routes.js              # Rutas de usuario
│   │   ├── energy.routes.js            # Rutas de energía
│   │   ├── ai.routes.js                # Rutas de IA ✅ CORREGIDO
│   │   ├── stripe.routes.js            # Rutas de Stripe
│   │   └── webhook.routes.js           # Rutas de webhooks
│   │
│   └── 📁 utils/                       # Utilidades
│       ├── logger.js                   # Sistema de logging
│       ├── validator.js                # Validaciones
│       ├── errorTypes.js               # Tipos de errores custom
│       └── constants.js                # Constantes globales
│
└── 📁 frontend-reference/              # Código Flutter de referencia
    ├── 📁 config/
    │   └── plan_limits.dart            # Límites de planes (original)
    │
    └── 📁 services/
        ├── ai_service.dart             # Servicio IA original (REFERENCIA)
        ├── ai_service_refactored.dart  # Servicio IA refactorizado ✅ NUEVO
        ├── energy_service.dart         # Servicio energía (original)
        ├── user_service.dart           # Servicio usuario (original)
        ├── payment_service.dart        # Servicio pagos (original)
        ├── storage_service.dart        # Servicio almacenamiento
        ├── navigator_service.dart      # Servicio navegación
        ├── language_service.dart       # Servicio localización
        ├── cache_service.dart          # Servicio caché
        ├── ads_service.dart            # Servicio anuncios
        ├── background_loader.dart      # Carga en background
        ├── plan_background_service.dart # Background de planes
        ├── serie_background_service.dart # Background de series
        ├── operativa_event_bus.dart    # Event bus operativa
        └── serie_event_bus.dart        # Event bus series
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

### Código Backend (JavaScript)

| Categoría | Archivos | Líneas Aprox |
|-----------|----------|--------------|
| **Config** | 6 | ~500 |
| **Models** | 4 | ~800 |
| **Services** | 2 | ~1200 |
| **Controllers** | 5 | ~600 |
| **Middleware** | 4 | ~400 |
| **Routes** | 6 | ~300 |
| **Utils** | 4 | ~300 |
| **Server** | 1 | ~150 |
| **TOTAL** | **32** | **~4250** |

### Documentación (Markdown)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| README.md | 310 | Documentación principal |
| RESUMEN_EJECUTIVO.md | ~450 | Resumen del proyecto |
| ANALISIS_AI_SERVICE.md | 352 | Análisis exhaustivo |
| CORRECCIONES_AI_SERVICE.md | ~400 | Correcciones aplicadas |
| GUIA_MIGRACION_FLUTTER.md | ~500 | Guía de migración |
| EJEMPLOS_PRUEBA.md | ~400 | Ejemplos de testing |
| ANALISIS_MIGRACION.md | ~300 | Análisis inicial |
| MIGRACION_COMPLETADA.md | ~200 | Reporte final |
| INDICE_PROYECTO.md | ~300 | Este archivo |
| **TOTAL** | **~3200** | **9 documentos** |

### Frontend Reference (Dart)

| Archivo | Propósito |
|---------|-----------|
| ai_service.dart | Original (1000+ líneas) |
| ai_service_refactored.dart | Refactorizado (600 líneas) |
| energy_service.dart | Original (903 líneas) |
| payment_service.dart | Original |
| user_service.dart | Original |
| + 10 servicios más | Varios |

---

## 🔑 ARCHIVOS CLAVE

### 1. Entry Point

**`server.js`** (150 líneas)
- Importa todos los módulos
- Configura middleware global (helmet, cors, rate limiting)
- Registra rutas
- Manejo de errores
- Inicia servidor HTTP

### 2. Configuración Principal

**`src/config/env.js`**
- Valida variables de entorno obligatorias
- Define valores por defecto
- Exporta configuración global

**`src/config/plans.js`**
- Define planes: FREEMIUM, TRIAL, MINI, BASE, PRO
- Costos de energía por acción
- Límites por plan
- Funciones helpers

### 3. Servicios Core

**`src/services/aiService.js`** ✅ CORREGIDO (558 líneas)
- `callAI()` - Llamada universal OpenAI/Gemini
- `convertToJSON()` - Conversión a JSON (gpt-4o-mini)
- `generateHomePhrase()` - Frase home (gemini-2.0-flash)
- `generateStepComment()` - Comentario filosófico (gemini-2.5-flash)
- `generateReprogrammingResult()` - Informe reprogramación (gemini-2.5-pro)
- `generateExecutionSummary()` - Resumen ejecución (gemini-2.5-flash)
- Helpers: `calculateGeminiTokens()`, `calculateGeminiEnergy()`, `cleanAIText()`

**`src/services/energyService.js`**
- Gestión de recarga diaria
- Consumo de energía
- Validaciones server-side

### 4. Modelos Principales

**`src/models/Energy.js`**
- `getEnergy()` - Obtener energía actual
- `consumeEnergy()` - Consumir con transacción atómica
- `rechargeEnergy()` - Recarga automática
- `checkAndRecharge()` - Verificar y recargar si es necesario

**`src/models/Trial.js`**
- `activateTrial()` - Activar trial de 48h
- `getTrialStatus()` - Estado del trial
- `checkTrialRecharge()` - Recarga de 24h

### 5. Controladores de IA

**`src/controllers/aiController.js`** ✅ CORREGIDO (269 líneas)
- `universalAICall()` - POST /api/ai/call
- `convertTextToJSON()` - POST /api/ai/convert-json
- `getHomePhrase()` - POST /api/ai/generate-home-phrase
- `getStepComment()` - POST /api/ai/generate-comment
- `getReprogrammingResult()` - POST /api/ai/generate-reprogramming-result
- `getExecutionSummary()` - POST /api/ai/generate-execution-summary

### 6. Middleware Crítico

**`src/middleware/auth.js`**
- Verifica token de Firebase Auth
- Decodifica y agrega `req.user`
- Maneja errores de autenticación

**`src/middleware/rateLimiter.js`**
- Rate limiting general: 100 req/15min
- Rate limiting IA: 50 req/15min
- Rate limiting Stripe: 20 req/15min

---

## 🛣️ MAPA DE RUTAS

### `/api/auth` (auth.routes.js)
```
POST   /api/auth/register
POST   /api/auth/login
```

### `/api/user` (user.routes.js)
```
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/subscription
DELETE /api/user/account
```

### `/api/user` (energy.routes.js)
```
GET    /api/user/energy
POST   /api/user/energy/consume
POST   /api/user/trial/activate
GET    /api/user/trial/status
```

### `/api/ai` (ai.routes.js) ✅ CORREGIDO
```
POST   /api/ai/call
POST   /api/ai/convert-json
POST   /api/ai/generate-home-phrase
POST   /api/ai/generate-comment
POST   /api/ai/generate-reprogramming-result
POST   /api/ai/generate-execution-summary
```

### `/api/stripe` (stripe.routes.js)
```
POST   /api/stripe/create-checkout
POST   /api/stripe/portal-session
```

### `/api/webhooks` (webhook.routes.js)
```
POST   /api/webhooks/stripe
```

**Total:** 19 endpoints

---

## 🔧 DEPENDENCIAS NPM

### Production
```json
{
  "express": "^4.19.2",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "helmet": "^7.1.0",
  "stripe": "^16.6.0",
  "firebase-admin": "^13.6.0",
  "openai": "^4.20.0",
  "@google/generative-ai": "^0.1.3",
  "express-rate-limit": "^7.1.0"
}
```

### Development
```json
{
  "nodemon": "^3.0.2"
}
```

---

## 📝 VARIABLES DE ENTORNO

**Archivo:** `.env` (NO en git)

```bash
# Node
NODE_ENV=development
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Gemini
GEMINI_API_KEY=AIzaSy...

# Stripe
STRIPE_MODE=test
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...

# Price IDs
STRIPE_PRICE_MINI_TEST=price_...
STRIPE_PRICE_BASE_TEST=price_...
STRIPE_PRICE_PRO_TEST=price_...

# URLs
SUCCESS_BASE_URL=https://tu-app.com/success
CANCEL_URL=https://tu-app.com/cancel
```

---

## 🎯 FLUJO DE DATOS

### Llamada a IA (Ejemplo)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Flutter App                                              │
│    → POST /api/ai/call                                      │
│    → Headers: Authorization: Bearer <firebase-token>        │
│    → Body: {messages, options}                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Middleware                                               │
│    → auth.js: Valida token Firebase                         │
│    → rateLimiter.js: Verifica límite de requests            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Controller (aiController.js)                             │
│    → universalAICall()                                      │
│    → Valida parámetros                                      │
│    → Llama a servicio                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Service (aiService.js)                                   │
│    → callAI()                                               │
│    → Valida energía ANTES de llamar                         │
│    → Llama a OpenAI o Gemini según modelo                   │
│    → Calcula energía consumida                              │
│    → Consume energía DESPUÉS de respuesta exitosa           │
│    → Registra uso en Firestore                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. APIs Externas                                            │
│    → OpenAI: https://api.openai.com/v1/chat/completions     │
│    → Gemini: https://generativelanguage.googleapis.com/...  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Firestore                                                │
│    → users/{userId}/energy: Actualiza energía               │
│    → ai_usage: Registra uso                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Response to Flutter                                      │
│    → {content, model, tokensUsed, energyConsumed}           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 COMANDOS ÚTILES

### Desarrollo
```bash
npm install          # Instalar dependencias
npm run dev          # Iniciar con nodemon (auto-reload)
npm start            # Iniciar en producción
```

### Testing
```bash
curl http://localhost:3000/health                    # Health check
node test-backend.js                                 # Testing script
```

### Git
```bash
git status                                           # Ver cambios
git add .                                            # Agregar todos
git commit -m "Mensaje"                              # Commit
git push origin main                                 # Push a GitHub
```

### Deploy (Render.com)
```bash
# Automático al hacer push a main
git push origin main
```

---

## ✅ ARCHIVOS LISTOS PARA PRODUCCIÓN

- [x] Backend completo (31 archivos JS)
- [x] Documentación exhaustiva (9 archivos MD)
- [x] Servicio Flutter refactorizado (ai_service_refactored.dart)
- [x] Variables de entorno documentadas (.env.example)
- [x] Configuración de deploy (render.yaml)
- [x] Gitignore configurado
- [x] Package.json con scripts
- [x] README completo

---

## 📚 LECTURA RECOMENDADA

1. **Empezar aquí:**
   - `README.md` - Visión general y setup
   - `RESUMEN_EJECUTIVO.md` - Entendimiento completo

2. **Para entender las correcciones:**
   - `ANALISIS_AI_SERVICE.md` - Análisis del código original
   - `CORRECCIONES_AI_SERVICE.md` - Qué se corrigió y por qué

3. **Para migrar Flutter:**
   - `GUIA_MIGRACION_FLUTTER.md` - Paso a paso
   - `frontend-reference/services/ai_service_refactored.dart` - Código nuevo

4. **Para probar:**
   - `EJEMPLOS_PRUEBA.md` - Comandos curl y scripts

5. **Para deploy:**
   - `README.md` sección "Deployment"
   - `.env.example` para variables

---

**Última actualización:** 2025-12-26
**Mantenido por:** Arvi Team
