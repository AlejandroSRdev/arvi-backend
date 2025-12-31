# 🔧 CORRECCIONES CRÍTICAS: ai_service.dart → aiService.js

**Fecha:** 2025-12-26
**Archivos afectados:**
- `src/services/aiService.js` ✅ Reescrito completamente
- `src/controllers/aiController.js` ✅ Actualizado con nuevos endpoints
- `src/routes/ai.routes.js` ✅ Actualizado con rutas corregidas
- `README.md` ✅ Documentación actualizada

---

## ❌ PROBLEMAS IDENTIFICADOS EN LA VERSIÓN ORIGINAL

### 1. **Selección de Modelo Incorrecta**
**Error:** Se asumió que el modelo se seleccionaba según el plan del usuario.

**Realidad:** El modelo se selecciona **POR TIPO DE FUNCIÓN**, no por plan.

**Evidencia:**
- `convertirAStrictJSON` (línea 59): Siempre usa `gpt-4o-mini`
- `generarFraseHome` (línea 567): Siempre usa `gemini-2.0-flash`
- `generarComentarioPaso` (línea 657): Siempre usa `gemini-2.5-flash`
- `generarResultadoReprogramacion` (línea 753): Siempre usa `gemini-2.5-pro`

### 2. **Consumo de Energía Asimétrico**
**Error:** Solo Gemini consumía energía automáticamente en `_callAIChat`.

**Realidad:** OpenAI NO consumía energía en el código original de Flutter (posible bug).

**Decisión:** Consumir energía para **AMBOS** proveedores en el backend (corrección de bug).

### 3. **Cálculo de Energía Incorrecto**
**Error:** Fórmula de cálculo no coincidía con el original.

**Fórmula Original (ai_service.dart:336-348):**
```dart
final tokensPrompt = calcularTokensGeminiSolo(prompt);
final tokensRespuesta = calcularTokensGeminiSolo(respuesta);
final tokens = (tokensRespuesta + (tokensPrompt * 0.30)).round();
final energiaARestar = (tokens / 100).ceil();
```

**Corrección Aplicada:**
```javascript
export function calculateGeminiEnergy(prompt, response) {
  const tokensPrompt = calculateGeminiTokens(prompt);
  const tokensRespuesta = calculateGeminiTokens(response);
  const totalTokens = Math.round(tokensRespuesta + (tokensPrompt * 0.30));
  const energia = Math.ceil(totalTokens / 100);
  return energia;
}
```

### 4. **Funciones Específicas Faltantes**
**Error:** El `aiService.js` original solo tenía 3 funciones genéricas (`chatCompletion`, `validateHabitCompletion`, `generateDailyPlan`).

**Realidad:** El archivo original tiene más de 10 funciones especializadas.

**Funciones Migradas:**
- ✅ `callAI()` (universal)
- ✅ `convertToJSON()` (siempre gpt-4o-mini)
- ✅ `generateHomePhrase()` (gemini-2.0-flash)
- ✅ `generateStepComment()` (gemini-2.5-flash)
- ✅ `generateReprogrammingResult()` (gemini-2.5-pro)
- ✅ `generateExecutionSummary()` (gemini-2.5-flash, retorna JSON)
- ✅ `cleanAIText()` (helper)
- ✅ `calculateGeminiTokens()` (helper)
- ✅ `calculateGeminiEnergy()` (helper)

---

## ✅ CORRECCIONES IMPLEMENTADAS

### 1. **Función Universal `callAI()`**

**Migrado desde:** `_callAIChat` (ai_service.dart:153-368)

**Características:**
- Validación de energía **ANTES** de llamar a la API
- Detección automática de proveedor según modelo:
  - Si empieza con 'gpt' → OpenAI
  - Si no → Gemini
- Consumo de energía para **AMBOS** proveedores
- Cálculo correcto de tokens:
  - OpenAI: Usa `completion.usage.total_tokens`
  - Gemini: Estima con `calculateGeminiTokens()`
- Registro de uso en Firestore

**Ejemplo de uso:**
```javascript
const response = await callAI(userId, messages, {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 1500,
  forceJson: false
});
```

### 2. **Función `convertToJSON()`**

**Migrado desde:** `convertirAStrictJSON` (ai_service.dart:54-148)

**Modelo FIJO:** `gpt-4o-mini`

**Características:**
- Temperature: 0.0 (determinista)
- maxTokens: 1500
- forceJson: true
- Fallback seguro si falla el parsing

**Ejemplo de uso:**
```javascript
const result = await convertToJSON(
  userId,
  'Quiero leer 30 minutos por la mañana',
  { nombre: 'string', duracion: 'number' },
  'es',
  'crear_habito'
);
```

### 3. **Funciones Específicas**

| Función | Modelo | Origen |
|---------|--------|--------|
| `generateHomePhrase` | gemini-2.0-flash | ai_service.dart:524-575 |
| `generateStepComment` | gemini-2.5-flash | ai_service.dart:578-658 |
| `generateReprogrammingResult` | gemini-2.5-pro | ai_service.dart:661-754 |
| `generateExecutionSummary` | gemini-2.5-flash | ai_service.dart:756-1000+ |

Todas incluyen:
- Validación de parámetros
- Consumo automático de energía
- Limpieza de texto con `cleanAIText()`
- Manejo de errores con fallback

---

## 🔄 CAMBIOS EN ENDPOINTS

### Endpoints Anteriores (INCORRECTOS)
```
POST /api/ai/chat
POST /api/ai/habit-check
POST /api/ai/plan-generate
```

### Endpoints Nuevos (CORREGIDOS)
```
POST /api/ai/call                           # Universal
POST /api/ai/convert-json                   # gpt-4o-mini
POST /api/ai/generate-home-phrase           # gemini-2.0-flash
POST /api/ai/generate-comment               # gemini-2.5-flash
POST /api/ai/generate-reprogramming-result  # gemini-2.5-pro
POST /api/ai/generate-execution-summary     # gemini-2.5-flash
```

---

## 📊 EJEMPLO DE CONSUMO DE ENERGÍA

### Caso: Gemini 2.5 Flash

**Prompt:** 1000 caracteres (270 tokens aprox)
**Respuesta:** 500 caracteres (135 tokens aprox)

**Cálculo:**
```javascript
tokensPrompt = 1000 / 3.7 = 270
tokensRespuesta = 500 / 3.7 = 135
totalTokens = 135 + (270 × 0.30) = 135 + 81 = 216
energia = ceil(216 / 100) = 3
```

**Resultado:** Consume **3 energía**

### Caso: OpenAI GPT-4o-mini

**Tokens totales (según API):** 500 tokens

**Cálculo:**
```javascript
energia = ceil(500 / 100) = 5
```

**Resultado:** Consume **5 energía**

---

## 🚀 PRÓXIMOS PASOS (FLUTTER)

Para completar la migración, el frontend Flutter debe:

1. **Eliminar llamadas directas a APIs**
   - ❌ Eliminar `Secrets.openAIapiKey`
   - ❌ Eliminar `Secrets.geminiAIApiKey`
   - ❌ Eliminar imports de `package:openai` y `package:google_generative_ai`

2. **Reemplazar funciones con llamadas HTTP**
   ```dart
   // ANTES (INSEGURO)
   final respuesta = await AIService()._callAIChat(mensajes);

   // DESPUÉS (SEGURO)
   final response = await http.post(
     Uri.parse('$BACKEND_URL/api/ai/call'),
     headers: {
       'Authorization': 'Bearer ${await user.getIdToken()}',
       'Content-Type': 'application/json',
     },
     body: jsonEncode({
       'messages': mensajes,
       'options': {'model': 'gemini-2.5-flash'}
     }),
   );
   ```

3. **Conservar funciones de construcción de prompts**
   - ✅ `generarMemoriaCompleta()` (depende de localización)
   - ✅ `crearContextoConMemoria()` (solo prepara datos)
   - ✅ Construcción de prompts con `AppLocalizations`

4. **Manejo de errores**
   ```dart
   if (response.statusCode == 403 &&
       jsonDecode(response.body)['error'] == 'INSUFFICIENT_ENERGY') {
     // Redirigir a pantalla de suscripción
     Navigator.pushAndRemoveUntil(
       context,
       MaterialPageRoute(builder: (_) => SubscriptionScreen()),
       (route) => false,
     );
   }
   ```

---

## 📚 DOCUMENTACIÓN ACTUALIZADA

✅ **README.md**
- Endpoints corregidos documentados
- Ejemplos de request/response
- Tabla de migración actualizada

✅ **ANALISIS_AI_SERVICE.md**
- Análisis exhaustivo línea por línea
- Clasificación de funciones
- Descubrimientos críticos

✅ **Este archivo (CORRECCIONES_AI_SERVICE.md)**
- Resumen de correcciones
- Comparación antes/después
- Guía de migración Flutter

---

## ✅ VALIDACIÓN

Para validar que las correcciones funcionan:

1. **Probar endpoint universal:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/call \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{"role": "user", "content": "Hola"}],
       "options": {"model": "gemini-2.5-flash"}
     }'
   ```

2. **Verificar consumo de energía:**
   - Revisar colección `users/{userId}/energy`
   - Verificar que `current` disminuye correctamente
   - Revisar colección `ai_usage` (analytics)

3. **Validar modelos específicos:**
   - `convert-json` debe usar siempre `gpt-4o-mini`
   - `generate-home-phrase` debe usar `gemini-2.0-flash`
   - `generate-reprogramming-result` debe usar `gemini-2.5-pro`

---

**Conclusión:** La migración ahora es **coherente con el código original** de Flutter, corrigiendo las asimetrías detectadas y aplicando mejores prácticas de seguridad server-side.
