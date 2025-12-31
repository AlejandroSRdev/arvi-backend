# ARQUITECTURA HEXAGONAL - ESTRUCTURA CREADA

**Fecha de creación**: 2025-12-28
**Estado**: ✅ Estructura completa creada en paralelo
**Backend original**: Intacto en `src/`

---

## 📁 ESTRUCTURA CREADA

```
/
├── server.js                           # ✅ Original (NO MODIFICADO)
├── server-hexagonal.js                 # 🆕 Nuevo entrypoint (ejemplo)
│
├── src/                                # ✅ Backend original (NO MODIFICADO)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── domain/                             # 🆕 Núcleo de negocio (JS puro)
│   ├── entities/
│   │   ├── User.js                     ⚪ Vacío - TODO
│   │   ├── Energy.js                   ⚪ Vacío - TODO
│   │   ├── Trial.js                    ⚪ Vacío - TODO
│   │   ├── Subscription.js             ⚪ Vacío - TODO
│   │   └── Plan.js                     ⚪ Vacío - TODO
│   │
│   ├── policies/
│   │   ├── PlanPolicy.js               ⚪ Vacío - TODO: Mover desde src/config/plans.js
│   │   ├── ModelSelectionPolicy.js     ⚪ Vacío - TODO: Mover desde src/config/modelMapping.js
│   │   └── EnergyPolicy.js             ⚪ Vacío - TODO
│   │
│   ├── use-cases/
│   │   ├── GenerateAIResponse.js       ⚪ Vacío - TODO
│   │   ├── ConsumeEnergy.js            ⚪ Vacío - TODO
│   │   ├── ValidatePlanAccess.js       ⚪ Vacío - TODO
│   │   ├── ActivateTrial.js            ⚪ Vacío - TODO
│   │   └── ProcessSubscription.js      ⚪ Vacío - TODO
│   │
│   ├── ports/
│   │   ├── IAIProvider.js              ⚪ Vacío - TODO: Definir interface
│   │   ├── IUserRepository.js          ⚪ Vacío - TODO: Definir interface
│   │   ├── IEnergyRepository.js        ⚪ Vacío - TODO: Definir interface
│   │   └── IPaymentProvider.js         ⚪ Vacío - TODO: Definir interface
│   │
│   └── validators/
│       └── InputValidator.js           ⚪ Vacío - TODO: Mover desde src/utils/validator.js
│
├── infrastructure/                     # 🆕 Adaptadores (SDKs, BD, HTTP)
│   │
│   ├── ai/
│   │   ├── openai/
│   │   │   ├── OpenAIConfig.js         ⚪ Vacío - TODO: Mover desde src/config/openai.js
│   │   │   └── OpenAIAdapter.js        ⚪ Vacío - TODO: Implementar IAIProvider
│   │   └── gemini/
│   │       ├── GeminiConfig.js         ⚪ Vacío - TODO: Mover desde src/config/gemini.js
│   │       └── GeminiAdapter.js        ⚪ Vacío - TODO: Implementar IAIProvider
│   │
│   ├── persistence/
│   │   └── firestore/
│   │       ├── FirebaseConfig.js       ⚪ Vacío - TODO: Mover desde src/config/firebase.js
│   │       ├── FirestoreUserRepository.js      ⚪ Vacío - TODO: Implementar IUserRepository
│   │       ├── FirestoreEnergyRepository.js    ⚪ Vacío - TODO: Implementar IEnergyRepository
│   │       ├── FirestoreTrialRepository.js     ⚪ Vacío - TODO
│   │       └── FirestoreSubscriptionRepository.js  ⚪ Vacío - TODO
│   │
│   ├── payment/
│   │   └── stripe/
│   │       ├── StripeConfig.js         ⚪ Vacío - TODO: Mover desde src/config/stripe.js
│   │       └── StripeAdapter.js        ⚪ Vacío - TODO: Implementar IPaymentProvider
│   │
│   └── http/
│       ├── middleware/
│       │   ├── authenticate.js         ⚪ Vacío - TODO: Mover desde src/middleware/auth.js
│       │   ├── authorizeFeature.js     ⚪ Vacío - TODO: Mover desde src/middleware/authorizeFeature.js
│       │   ├── validateEnergy.js       ⚪ Vacío - TODO: Mover desde src/middleware/validateEnergy.js
│       │   ├── validatePlanLimit.js    ⚪ Vacío - TODO: Mover desde src/middleware/validatePlanLimit.js
│       │   ├── validateInputSize.js    ⚪ Vacío - TODO: Mover desde src/middleware/validateInputSize.js
│       │   ├── rateLimiter.js          ⚪ Vacío - TODO: Mover desde src/middleware/rateLimiter.js
│       │   └── errorHandler.js         ⚪ Vacío - TODO: Mover desde src/middleware/errorHandler.js
│       │
│       ├── controllers/
│       │   ├── AIController.js         ⚪ Vacío - TODO: Mover desde src/controllers/aiController.js
│       │   ├── AuthController.js       ⚪ Vacío - TODO: Mover desde src/controllers/authController.js
│       │   ├── EnergyController.js     ⚪ Vacío - TODO: Mover desde src/controllers/energyController.js
│       │   ├── UserController.js       ⚪ Vacío - TODO: Mover desde src/controllers/userController.js
│       │   └── WebhookController.js    ⚪ Vacío - TODO: Mover desde src/controllers/webhookController.js
│       │
│       └── routes/
│           ├── ai.routes.js            ⚪ Vacío - TODO: Mover desde src/routes/ai.routes.js
│           ├── auth.routes.js          ⚪ Vacío - TODO: Mover desde src/routes/auth.routes.js
│           ├── energy.routes.js        ⚪ Vacío - TODO: Mover desde src/routes/energy.routes.js
│           ├── user.routes.js          ⚪ Vacío - TODO: Mover desde src/routes/user.routes.js
│           ├── stripe.routes.js        ⚪ Vacío - TODO: Mover desde src/routes/stripe.routes.js
│           └── webhook.routes.js       ⚪ Vacío - TODO: Mover desde src/routes/webhook.routes.js
│
└── shared/                             # 🆕 Compartido entre capas
    ├── constants.js                    ⚪ Vacío - TODO: Mover desde src/utils/constants.js
    ├── errorTypes.js                   ⚪ Vacío - TODO: Mover desde src/utils/errorTypes.js
    └── logger.js                       ⚪ Vacío - TODO: Mover desde src/utils/logger.js
```

---

## 📊 ESTADÍSTICAS

- **Total de archivos creados**: 51 archivos vacíos
- **Backend original**: Intacto (0 archivos modificados)
- **Archivos con TODO**: 51
- **Archivos listos**: 0

### Distribución:

```
domain/
  ├── entities/          5 archivos
  ├── policies/          3 archivos
  ├── use-cases/         5 archivos
  ├── ports/             4 archivos
  └── validators/        1 archivo

infrastructure/
  ├── ai/                4 archivos
  ├── persistence/       5 archivos
  ├── payment/           2 archivos
  └── http/             20 archivos

shared/                  3 archivos
```

---

## 🎯 PRÓXIMOS PASOS

### Opción A: Migración Manual (recomendado)

1. Revisar cada archivo vacío
2. Leer el comentario `// TODO` de cada uno
3. Copiar código desde `src/` siguiendo las instrucciones
4. Ajustar imports según nueva estructura
5. Validar paso a paso

### Opción B: Migración Asistida

Usar el plan detallado en `ARQUITECTURA_HEXAGONAL_PLAN.md` para:

1. **Fase 1**: Mover archivos simples (shared, config)
2. **Fase 2**: Mover HTTP layer (middleware, controllers, routes)
3. **Fase 3**: Dividir archivos mezclados (models → entities + repositories)
4. **Fase 4**: Dividir aiService en use-case + adapters
5. **Fase 5**: Ajustar todos los imports
6. **Fase 6**: Validar funcionamiento

---

## ⚠️ ARCHIVOS CRÍTICOS QUE REQUIEREN DIVISIÓN

Estos 5 archivos NO se pueden mover directamente, deben dividirse:

1. **`src/models/User.js`** →
   - `domain/entities/User.js` (validaciones)
   - `infrastructure/persistence/firestore/FirestoreUserRepository.js` (BD)

2. **`src/models/Energy.js`** →
   - `domain/entities/Energy.js` (cálculos)
   - `infrastructure/persistence/firestore/FirestoreEnergyRepository.js` (BD)

3. **`src/models/Trial.js`** →
   - `domain/entities/Trial.js` (reglas)
   - `infrastructure/persistence/firestore/FirestoreTrialRepository.js` (BD)

4. **`src/models/Subscription.js`** →
   - `domain/entities/Subscription.js` (estados)
   - `infrastructure/persistence/firestore/FirestoreSubscriptionRepository.js` (BD)

5. **`src/services/aiService.js`** →
   - `domain/use-cases/GenerateAIResponse.js` (lógica)
   - `infrastructure/ai/openai/OpenAIAdapter.js` (API OpenAI)
   - `infrastructure/ai/gemini/GeminiAdapter.js` (API Gemini)

---

## ✅ VALIDACIÓN

Cada archivo vacío contiene:

- ✅ Comentario con origen del código
- ✅ Responsabilidades claramente definidas
- ✅ Lista de qué PUEDE contener
- ✅ Lista de qué NO DEBE contener
- ✅ TODO explícito con instrucciones

---

## 🚀 COMANDO DE INICIO (una vez completada la migración)

```bash
# Probar nuevo servidor hexagonal
node server-hexagonal.js

# Comparar con servidor original
node server.js
```

---

**IMPORTANTE**: Esta estructura está en PARALELO al backend original. Puedes:

- Migrar incrementalmente
- Validar cada capa por separado
- Comparar ambas versiones
- Rollback si es necesario

No hay riesgo de romper el backend existente.

---

**Creado por**: Claude Code (Arquitecto de Software)
**Fecha**: 2025-12-28
