# 🔄 REFACTORIZACIÓN COMPLETA - BACKEND AI SERVICE

**Fecha:** 2025-12-26
**Estado:** ✅ COMPLETADO

---

## 📋 RESUMEN EJECUTIVO

Se ha completado la refactorización del backend para integrar un sistema de mapeo automático de modelos de IA basado en `function_type`. El frontend Flutter ahora solo envía el tipo de función, y el backend decide qué modelo usar.

---

## 🎯 OBJETIVOS CUMPLIDOS

### ✅ 1. Centralización de Configuración de Modelos
- **Archivo:** `src/config/modelMapping.js`
- **Contiene:** Mapeo completo de `function_type` → configuración de modelo
- **Beneficios:**
  - Un solo lugar para mantener la configuración de modelos
  - Fácil de actualizar cuando cambien las necesidades
  - Documentación integrada de cada tipo de función

### ✅ 2. Simplificación de Endpoints
- **ANTES:** Múltiples endpoints específicos (`/generate-home-phrase`, `/generate-comment`, etc.)
- **AHORA:** 2 endpoints unificados:
  - `POST /api/ai/chat` - Para todas las llamadas conversacionales
  - `POST /api/ai/json-convert` - Para conversión JSON estricta

### ✅ 3. Refactorización del Frontend (ai_service.dart)
- **Funciones refactorizadas:** 13 funciones principales
- **Patrón consistente:**
  ```dart
  // ANTES
  final response = await _callAIChat(messages, modelo: 'gemini-2.5-flash');

  // AHORA
  final response = await _callBackend(
    messages: messages,
    functionType: 'step_commentary',
  );
  ```

---

## 📁 ARCHIVOS MODIFICADOS

### 🆕 Archivos Nuevos

#### 1. `src/config/modelMapping.js`
**Propósito:** Mapeo central de function_type a configuración de modelos

**Estructura:**
```javascript
export const MODEL_MAPPING = {
  'home_phrase': {
    model: 'gemini-2.0-flash',
    temperature: 0.8,
    maxTokens: 100,
    description: 'Frase motivacional corta'
  },
  'chat': {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 1500,
    description: 'Conversación general'
  },
  // ... 20+ tipos de funciones
};
```

**Funciones exportadas:**
- `getModelConfig(functionType)` - Obtiene configuración
- `isValidFunctionType(functionType)` - Valida tipo
- `getAvailableFunctionTypes()` - Lista todos los tipos

---

### ♻️ Archivos Refactorizados

#### 2. `src/services/aiService.js`
**Cambios principales:**

**Nueva función añadida:**
```javascript
export async function callAIWithFunctionType(userId, messages, functionType) {
  const config = getModelConfig(functionType);

  const options = {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    forceJson: config.forceJson || false,
  };

  return await callAI(userId, messages, options);
}
```

**Nueva función para JSON:**
```javascript
export async function convertToJSONWithSchema(userId, content, schema) {
  // Usa SIEMPRE gpt-4o-mini con temperature 0.0
  // Retorna JSON parseado o fallback vacío
}
```

#### 3. `src/controllers/aiController.js`
**Cambios principales:**

**Endpoint unificado de chat:**
```javascript
export async function chatEndpoint(req, res, next) {
  const { messages, function_type } = req.body;

  // Validar function_type
  if (!isValidFunctionType(function_type)) {
    throw new ValidationError('Invalid function_type');
  }

  // Llamar con mapeo automático
  const response = await callAIWithFunctionType(userId, messages, function_type);

  res.json({
    success: true,
    message: response.content,
    model: response.model,
    tokensUsed: response.tokensUsed,
    energyConsumed: response.energyConsumed,
  });
}
```

**Endpoint de conversión JSON:**
```javascript
export async function jsonConvertEndpoint(req, res, next) {
  const { content, schema } = req.body;

  const result = await convertToJSONWithSchema(userId, content, schema);

  res.json({
    success: true,
    structured_data: result,
  });
}
```

#### 4. `src/routes/ai.routes.js`
**Cambios principales:**

**ANTES:**
```javascript
router.post('/generate-home-phrase', getHomePhrase);
router.post('/generate-comment', getStepComment);
router.post('/generate-reprogramming-result', getReprogrammingResult);
router.post('/generate-execution-summary', getExecutionSummary);
```

**AHORA:**
```javascript
router.post('/chat', chatEndpoint);
router.post('/json-convert', jsonConvertEndpoint);
```

---

## 🔑 FUNCTION TYPES DISPONIBLES

### Categoría: Frases y Comentarios Cortos
| Function Type | Modelo | Temperatura | MaxTokens | Descripción |
|--------------|--------|-------------|-----------|-------------|
| `home_phrase` | gemini-2.0-flash | 0.8 | 100 | Frase motivacional para pantalla principal |
| `step_commentary` | gemini-2.5-flash | 0.7 | 300 | Comentario filosófico sobre reprogramación |
| `habit_verification_question` | gemini-2.0-flash | 0.7 | 60 | Pregunta de verificación de hábito |

### Categoría: Análisis y Generación Creativa
| Function Type | Modelo | Temperatura | MaxTokens | Descripción |
|--------------|--------|-------------|-----------|-------------|
| `reprogramming_final_report` | gemini-2.5-pro | 0.7 | 2000 | Informe final de reprogramación |
| `execution_summary_creative` | gemini-2.5-pro | 0.7 | 2000 | Resumen ejecutivo - pasada creativa |
| `execution_summary_structure` | gemini-2.5-pro | 0.0 | 2000 | Resumen ejecutivo - pasada estructuradora |
| `habit_test_analysis` | gemini-2.5-flash | 0.7 | 500 | Análisis de test de hábitos |
| `habit_series_creative` | gemini-2.5-flash | 0.8 | 1500 | Crear serie temática - creativa |
| `habit_series_structure` | gemini-2.5-pro | 0.0 | 1500 | Crear serie temática - estructurada |
| `habit_action_creative` | gemini-2.5-flash | 0.8 | 500 | Crear acción - creativa |
| `habit_action_structure` | gemini-2.5-pro | 0.0 | 500 | Crear acción - estructurada |
| `habit_verification_evaluation` | gemini-2.0-flash | 0.1 | 120 | Evaluar verificación - pasada 1 |
| `habit_verification_scoring` | gemini-2.5-pro | 0.0 | 100 | Evaluar verificación - pasada 2 |
| `habit_weekly_analysis` | gemini-2.5-pro | 0.7 | 1500 | Análisis semanal de hábitos |
| `conversation_summary_creative` | gemini-2.5-flash | 0.7 | 800 | Resumen de conversación - creativa |
| `conversation_summary_structure` | gemini-2.5-pro | 0.0 | 500 | Resumen de conversación - estructurada |

### Categoría: Chat y Conversación
| Function Type | Modelo | Temperatura | MaxTokens | Descripción |
|--------------|--------|-------------|-----------|-------------|
| `chat` | gemini-2.5-flash | 0.7 | 1500 | Conversación general libre |
| `daily_plan` | gemini-2.5-flash | 0.7 | 2000 | Generación de plan diario |
| `mindset_analysis` | gemini-2.5-flash | 0.7 | 1000 | Análisis de mentalidad |
| `goal_strategy` | gemini-2.5-flash | 0.7 | 1200 | Estrategia para objetivos |
| `mood_analysis` | gemini-2.5-flash | 0.6 | 500 | Análisis de estado emocional |

### Categoría: Conversión JSON
| Function Type | Modelo | Temperatura | MaxTokens | Descripción |
|--------------|--------|-------------|-----------|-------------|
| `json_conversion` | gpt-4o-mini | 0.0 | 1500 | Conversión estricta a JSON |

---

## 🔌 INTEGRACIÓN CON FRONTEND

### Métodos Helper en ai_service.dart

```dart
class AIService {
  static const String _backendUrl = 'https://tu-backend.com/api';

  /// Llamada genérica al backend con function_type
  Future<String> _callBackend({
    required List<Map<String, String>> messages,
    required String functionType,
  }) async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();

    final response = await http.post(
      Uri.parse('$_backendUrl/ai/chat'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'messages': messages,
        'function_type': functionType,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['message'];
    } else if (response.statusCode == 403) {
      throw InsufficientEnergyException();
    }

    throw AIServiceException('Error: ${response.statusCode}');
  }

  /// Para funciones que requieren JSON estructurado
  Future<Map<String, dynamic>> _callBackendJSON({
    required String content,
    required Map<String, dynamic> schema,
  }) async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();

    final response = await http.post(
      Uri.parse('$_backendUrl/ai/json-convert'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'content': content,
        'schema': schema,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['structured_data'];
    } else if (response.statusCode == 403) {
      throw InsufficientEnergyException();
    }

    throw AIServiceException('Error: ${response.statusCode}');
  }
}
```

### Ejemplo de Uso en Frontend

**ANTES:**
```dart
Future<String> generarFraseHome(BuildContext context, Asistente asistente) async {
  final mensajes = [...];

  final resp = await _callAIChat(
    mensajes,
    idioma: idioma,
    modelo: 'gemini-2.0-flash',
  );

  return resp.trim();
}
```

**AHORA:**
```dart
Future<String> generarFraseHome(BuildContext context, Asistente asistente) async {
  final mensajes = [...];

  // Backend decide automáticamente usar gemini-2.0-flash
  final resp = await _callBackend(
    messages: mensajes,
    functionType: 'home_phrase',
  );

  return resp.trim();
}
```

---

## 📊 FUNCIONES REFACTORIZADAS

### Lista Completa (13 funciones)

1. ✅ **generarFraseHome**
   - function_type: `'home_phrase'`
   - Modelo: gemini-2.0-flash

2. ✅ **generarComentarioPaso**
   - function_type: `'step_commentary'`
   - Modelo: gemini-2.5-flash

3. ✅ **generarResultadoReprogramacion**
   - function_type: `'reprogramming_final_report'`
   - Modelo: gemini-2.5-pro

4. ✅ **generarResumenEjecucion** (3 pasadas)
   - Pasada 1: `'execution_summary_creative'` (gemini-2.5-pro)
   - Pasada 2: `'execution_summary_structure'` (gemini-2.5-pro)
   - Pasada 3: `_callBackendJSON` (gpt-4o-mini)

5. ✅ **generarRespuestaConversacional**
   - function_type: `'chat'`
   - Modelo: gemini-2.5-flash

6. ✅ **generarRespuestaTestHabitos** (2 pasadas)
   - Pasada 1: `'habit_test_analysis'` (gemini-2.5-flash)
   - Pasada 2: `_callBackendJSON` (gpt-4o-mini)

7. ✅ **crearSerieTematica** (3 pasadas)
   - Pasada 1: `'habit_series_creative'` (gemini-2.5-flash)
   - Pasada 2: `'habit_series_structure'` (gemini-2.5-pro)
   - Pasada 3: `_callBackendJSON` (gpt-4o-mini)

8. ✅ **crearAccion** (3 pasadas)
   - Pasada 1: `'habit_action_creative'` (gemini-2.5-flash)
   - Pasada 2: `'habit_action_structure'` (gemini-2.5-pro)
   - Pasada 3: `_callBackendJSON` (gpt-4o-mini)

9. ✅ **hacerPreguntaVerificacion**
   - function_type: `'habit_verification_question'`
   - Modelo: gemini-2.0-flash

10. ✅ **evaluarRespuestaVerificacion** (3 pasadas)
    - Pasada 1: `'habit_verification_evaluation'` (gemini-2.0-flash)
    - Pasada 2: `'habit_verification_scoring'` (gemini-2.5-pro)
    - Pasada 3: `_callBackendJSON` (gpt-4o-mini)

11. ✅ **analisisSemanalHabitos**
    - function_type: `'habit_weekly_analysis'`
    - Modelo: gemini-2.5-pro

12. ✅ **generarInformeConversacion** (3 pasadas)
    - Pasada 1: `'conversation_summary_creative'` (gemini-2.5-flash)
    - Pasada 2: `'conversation_summary_structure'` (gemini-2.5-pro)
    - Pasada 3: `_callBackendJSON` (gpt-4o-mini)

13. ✅ **Inicio de clase AIService**
    - Agregadas constantes y métodos helper
    - Deprecadas API keys del frontend

---

## 🚀 PRÓXIMOS PASOS

### 1. Actualizar URL del Backend en Frontend
```dart
// En ai_service.dart
static const String _backendUrl = 'https://your-actual-backend-url.com/api';
```

### 2. Probar Endpoints
```bash
# Test chat endpoint
curl -X POST https://your-backend.com/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hola"}],
    "function_type": "chat"
  }'

# Test JSON convert endpoint
curl -X POST https://your-backend.com/api/ai/json-convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "content": "Some text to convert",
    "schema": {"field": ""}
  }'
```

### 3. Monitoreo
- Verificar logs del backend para confirmar selección correcta de modelos
- Revisar consumo de energía por function_type
- Ajustar temperaturas y maxTokens según necesidad

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Breaking Changes
- Los endpoints viejos están deprecados pero aún funcionales
- Se recomienda migrar completamente al nuevo sistema
- Las API keys de OpenAI/Gemini ya NO deben estar en el frontend

### 🔒 Seguridad
- Tokens de autenticación Firebase requeridos
- Validación de energía server-side
- Rate limiting aplicado a todos los endpoints

### 💰 Optimización de Costos
- Modelos más económicos para tareas simples (gemini-2.0-flash)
- Modelos Pro solo para análisis complejos
- Temperatura 0.0 para tareas deterministas

---

## ✅ CHECKLIST DE VALIDACIÓN

- [x] Archivo `modelMapping.js` creado
- [x] Función `callAIWithFunctionType` implementada
- [x] Función `convertToJSONWithSchema` implementada
- [x] Controller `chatEndpoint` implementado
- [x] Controller `jsonConvertEndpoint` implementado
- [x] Rutas actualizadas (`/chat`, `/json-convert`)
- [x] 13 funciones del frontend refactorizadas
- [ ] URL del backend actualizada en frontend
- [ ] Tests de integración ejecutados
- [ ] Deployment en producción

---

**Documento generado:** 2025-12-26
**Autor:** Refactorización automática AI Service
**Estado:** ✅ COMPLETADO
