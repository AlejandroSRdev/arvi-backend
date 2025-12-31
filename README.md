# 🚀 Arvi Backend - Node.js

Backend profesional para **Arvi Evolution**, asistente de IA para desarrollo personal.

---

## 📋 Descripción

Este backend centraliza toda la lógica crítica de negocio que anteriormente estaba expuesta en el frontend Flutter, incluyendo:

- ✅ Gestión de energía (moneda virtual del usuario)
- ✅ Llamadas a APIs de IA (OpenAI GPT y Google Gemini) **protegidas server-side**
- ✅ Validaciones de planes y límites
- ✅ Sistema de trial de 48 horas
- ✅ Integración con Stripe para suscripciones
- ✅ Autenticación con Firebase Admin SDK

---

## 🏗️ Arquitectura

```
stripe_backend/
├── src/
│   ├── config/           # Configuración (Firebase, Stripe, OpenAI, Gemini, Plans)
│   ├── models/           # Modelos de datos (User, Energy, Trial, Subscription)
│   ├── services/         # Lógica de negocio (energyService, aiService)
│   ├── controllers/      # Controladores de endpoints
│   ├── middleware/       # Middleware (auth, rate limiting, validaciones)
│   ├── routes/           # Definición de rutas
│   └── utils/            # Utilidades (logger, validator, errorTypes)
├── server.js             # Entry point
├── package.json
├── .env                  # Variables de entorno (NO SUBIR A GIT)
├── .env.example          # Template de variables de entorno
└── README.md
```

---

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone <url-repo>
cd stripe_backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y completa con tus valores:

```bash
cp .env.example .env
```

**Variables obligatorias:**
- Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Stripe: `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST`, Price IDs
- OpenAI: `OPENAI_API_KEY`
- Gemini: `GEMINI_API_KEY`

### 4. Iniciar servidor

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📡 Endpoints

### **Autenticación**
```
POST   /api/auth/register        # Registrar nuevo usuario
POST   /api/auth/login           # Login (requiere Firebase Auth token)
```

### **Usuario**
```
GET    /api/user/profile         # Obtener perfil
PUT    /api/user/profile         # Actualizar perfil
GET    /api/user/subscription    # Estado de suscripción
DELETE /api/user/account         # Eliminar cuenta
```

### **Energía**
```
GET    /api/user/energy          # Obtener energía disponible
POST   /api/user/energy/consume  # Consumir energía (validado server-side)
POST   /api/user/trial/activate  # Activar trial de 48h
GET    /api/user/trial/status    # Estado del trial
```

### **IA (OpenAI/Gemini)** - VERSIÓN CORREGIDA
```
POST   /api/ai/call                           # Llamada universal a OpenAI/Gemini (consume energía)
POST   /api/ai/convert-json                   # Convertir texto a JSON (gpt-4o-mini)
POST   /api/ai/generate-home-phrase           # Generar frase pantalla principal (gemini-2.0-flash)
POST   /api/ai/generate-comment               # Generar comentario filosófico (gemini-2.5-flash)
POST   /api/ai/generate-reprogramming-result  # Generar resultado reprogramación (gemini-2.5-pro)
POST   /api/ai/generate-execution-summary     # Generar resumen ejecución diaria (gemini-2.5-flash)
```

### **Stripe**
```
POST   /api/stripe/create-checkout    # Crear sesión de pago
POST   /api/stripe/portal-session     # Portal de gestión de suscripciones
POST   /api/webhooks/stripe           # Webhook de Stripe (eventos de suscripción)
```

---

## 🤖 Endpoints de IA - Documentación Detallada

### POST /api/ai/call
Llamada universal a OpenAI o Gemini. Detecta automáticamente el proveedor según el modelo.

**Request:**
```json
{
  "messages": [
    {"role": "system", "content": "Eres un asistente útil"},
    {"role": "user", "content": "Hola"}
  ],
  "options": {
    "model": "gemini-2.5-flash",  // o "gpt-4o-mini", "gemini-2.5-pro", etc.
    "temperature": 0.7,
    "maxTokens": 1500,
    "forceJson": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "Respuesta de la IA",
  "model": "gemini-2.5-flash",
  "tokensUsed": 150,
  "energyConsumed": 2
}
```

### POST /api/ai/convert-json
Convierte texto libre a JSON estructurado. Siempre usa **gpt-4o-mini**.

**Request:**
```json
{
  "freeContent": "Quiero crear un hábito de leer 30 minutos por la mañana",
  "targetSchema": {
    "nombre": "string",
    "duracion": "number",
    "momento": "string"
  },
  "language": "es",
  "functionName": "crear_habito"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "nombre": "Leer",
    "duracion": 30,
    "momento": "mañana"
  }
}
```

### POST /api/ai/generate-home-phrase
Genera frase motivadora para pantalla principal (≤25 palabras). Modelo: **gemini-2.0-flash**.

**Request:**
```json
{
  "userContext": "Usuario: Juan. Objetivo: Perder 5kg. Plan: Ejercicio diario.",
  "language": "es"
}
```

**Response:**
```json
{
  "success": true,
  "phrase": "Juan, hoy es otro paso hacia tus 5kg menos. El ejercicio te espera."
}
```

### POST /api/ai/generate-comment
Genera comentario filosófico breve (≤6 líneas). Modelo: **gemini-2.5-flash**.

**Request:**
```json
{
  "question": "¿Qué te impide alcanzar tu objetivo?",
  "answer": "El miedo al fracaso",
  "philosophyTone": "Stoico",
  "language": "es"
}
```

**Response:**
```json
{
  "success": true,
  "comment": "El miedo al fracaso es solo una proyección mental..."
}
```

### POST /api/ai/generate-reprogramming-result
Genera informe final de reprogramación (3-5 párrafos). Modelo: **gemini-2.5-pro**.

**Request:**
```json
{
  "steps": [
    {
      "question": "¿Qué te impide avanzar?",
      "answer": "El miedo",
      "comment": "Comentario filosófico previo"
    }
  ],
  "reprogrammingType": "Creencias limitantes",
  "language": "es"
}
```

**Response:**
```json
{
  "success": true,
  "result": "Informe final de 3-5 párrafos analizando las respuestas..."
}
```

### POST /api/ai/generate-execution-summary
Genera resumen estructurado de ejecución diaria. Modelo: **gemini-2.5-flash**.

**Request:**
```json
{
  "dailyPlan": {
    "actividades": ["Ejercicio", "Leer", "Meditar"]
  },
  "activities": [
    {"name": "Ejercicio", "completed": true},
    {"name": "Leer", "completed": false}
  ],
  "notes": ["No tuve tiempo para leer"],
  "language": "es"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "resumen": "Resumen general del día...",
    "cumplimiento": 66,
    "principales_logros": ["Completaste ejercicio"],
    "desviaciones": [{"actividad": "Leer", "motivo": "Falta de tiempo"}],
    "recomendaciones": ["Planifica tiempo específico para leer"]
  }
}
```

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren un **token de Firebase Auth** en el header:

```http
Authorization: Bearer <firebase-id-token>
```

### Cómo obtener el token desde Flutter:
```dart
final user = FirebaseAuth.instance.currentUser;
final token = await user?.getIdToken();

// Llamada al backend
final response = await http.get(
  Uri.parse('https://tu-backend.com/api/user/profile'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);
```

---

## ⚡ Sistema de Energía

### Planes y Límites

| Plan | Energía Diaria | Series Activas | Resúmenes Semanales | Precio |
|------|---------------|----------------|---------------------|--------|
| **Freemium** | 0 | 0 | 0 | Gratis |
| **Trial (48h)** | 135 (recarga a las 24h) | Ilimitado | Ilimitado | Gratis |
| **Mini** | 75 | 2 | 2 | 1.19 EUR/mes |
| **Base** | 150 | 5 | 5 | 4.29 EUR/mes |
| **Pro** | 300 | Ilimitado | Ilimitado | 10.99 EUR/mes |

### Costos de Energía por Acción

```javascript
CHAT_MESSAGE: 1
HABIT_COMPLETE: 2
PLAN_GENERATE: 3
REPROGRAMMING_COMPLETE: 5
```

### Trial de 48 Horas

- Se activa **una sola vez** por usuario
- Proporciona **135 energía inicial**
- Recarga **+135 energía después de 24 horas**
- Expira automáticamente después de **48 horas**
- Durante el trial, el usuario tiene capacidades equivalentes al plan **Pro**

---

## 🎯 Migración desde Flutter

Este backend migra la lógica que anteriormente estaba en:

| Servicio Flutter | Migrado a | Estado |
|-----------------|-----------|--------|
| `energy_service.dart` | `src/services/energyService.js` | ✅ Completado |
| `ai_service.dart` | `src/services/aiService.js` | ✅ Completado (CORREGIDO 2025-12-26) |
| `user_service.dart` | `src/models/User.js` | ✅ Completado |
| `payment_service.dart` | `src/routes/stripe.routes.js` | ✅ Completado |
| `plan_limits.dart` | `src/config/plans.js` | ✅ Completado |
| Webhooks Stripe | `src/controllers/webhookController.js` | ✅ Completado |

**CORRECCIONES CRÍTICAS EN ai_service.dart (2025-12-26):**
- ✅ Selección de modelo por tipo de función (NO por plan del usuario)
- ✅ Consumo de energía para AMBOS proveedores (OpenAI y Gemini)
- ✅ Cálculo correcto de energía Gemini: ceil((response + prompt×0.30) / 100)
- ✅ Funciones específicas con modelos fijos (ver ANALISIS_AI_SERVICE.md)

---

## 🔒 Seguridad

### ✅ Implementado

- **Firebase Admin SDK**: Validación de tokens server-side
- **Rate Limiting**: Límite de requests por minuto
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración restrictiva en producción
- **Validaciones**: Todas las entradas validadas
- **Claves API**: Nunca expuestas en frontend

### ⚠️ Recomendaciones

- Rotar claves API periódicamente
- Monitorear logs de Firebase y Stripe
- Configurar alertas para uso anormal de energía
- Revisar webhooks de Stripe regularmente

---

## 🧪 Testing

**Pendiente**: Implementar tests automatizados

```bash
# Cuando se implementen
npm test
```

---

## 📊 Monitoreo

### Logs

El servidor usa un sistema de logging centralizado en `src/utils/logger.js`:

```javascript
import { success, error, log, warn } from './src/utils/logger.js';

success('Usuario registrado exitosamente');
error('Error conectando a Firestore', err);
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🚀 Deployment

### Render.com (Recomendado)

1. Conecta tu repositorio Git
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente desde `main` branch

### Variables de entorno en Render:
- Copia todas las variables de `.env.example`
- Asegúrate de usar claves **LIVE** de Stripe en producción
- Cambia `STRIPE_MODE` a `live`

---

## 📚 Documentación Adicional

- [Análisis de Migración](./ANALISIS_MIGRACION.md) - Informe completo de la migración desde Flutter
- [Stripe Webhooks](https://stripe.com/docs/webhooks) - Documentación oficial de Stripe
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) - Configuración de Firebase
- [OpenAI API](https://platform.openai.com/docs/api-reference) - Referencia de OpenAI
- [Google Gemini](https://ai.google.dev/docs) - Documentación de Gemini

---

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Pagos**: Stripe
- **IA**: OpenAI GPT + Google Gemini
- **Seguridad**: Helmet, CORS, Express Rate Limit

---

## 👥 Contribución

Este proyecto está en desarrollo activo. Para contribuir:

1. Crea un branch desde `main`
2. Implementa tu feature/fix
3. Crea un Pull Request con descripción detallada

---

## 📝 Licencia

UNLICENSED - Uso interno de Arvi Team

---

## 📞 Soporte

Para reportar issues o hacer preguntas:
- Crea un issue en el repositorio
- Contacta al equipo de desarrollo

---

**Desarrollado con ❤️ por el equipo de Arvi Evolution**

*Backend migrado y mejorado desde el frontend Flutter original*
*Fecha de migración: 2025-12-26*
