# 📊 ANÁLISIS EXHAUSTIVO: ai_service.dart

**Fecha:** 2025-12-26
**Archivo analizado:** `frontend-reference/services/ai_service.dart`
**Líneas totales:** ~1000+
**Propósito:** Identificar funciones críticas para migrar al backend

---

## 🔍 FUNCIONES DETECTADAS

### FUNCIONES CRÍTICAS - 🔴 MIGRAR AL BACKEND

#### 1. **`_callAIChat()`** (líneas 153-368)
**¿Qué hace?**
- Función universal de llamada a OpenAI (GPT) y Google Gemini
- Determina el modelo a usar (default: `gemini-2.5-flash`)
- Ejecuta llamadas HTTP directas a las APIs
- **Descuenta energía automáticamente** (solo para Gemini, líneas 336-348)

**Llamadas API:**
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent`

**Claves API expuestas:**
- `Secrets.openAIapiKey` (línea 207)
- `Secrets.geminiAIApiKey` (línea 261)

**Lógica crítica:**
- Si modelo empieza con 'gpt' → OpenAI
- Si no → Gemini
- Parámetros: `temperature`, `maxTokens`, `forceJson`
- **CONSUME ENERGÍA** calculando tokens (líneas 337-342):
  ```dart
  final tokens = (tokensRespuesta + (tokensPrompt * 0.30)).round();
  final energiaARestar = (tokens / 100).ceil();
  await EnergyService().decrementEnergyBy(energiaARestar);
  ```

**Decisión:** ✅ **MIGRAR COMPLETA AL BACKEND**
- Protege claves API
- Valida energía ANTES de llamar
- Registra uso en Firestore

---

#### 2. **`convertirAStrictJSON()`** (líneas 54-148)
**¿Qué hace?**
- Conversión de texto libre a JSON estructurado
- **Modelo fijo:** `gpt-4o-mini` (parámetro default, línea 59)
- Usa `forceJson: true` para response_format
- Llama a `_callAIChat()` internamente

**Parámetros:**
```dart
required String contenidoLibre
required Map<String, dynamic> estructuraObjetivo
required String idioma
required String nombreFuncion
String modelo = "gpt-4o-mini"
```

**Lógica crítica:**
- Construye prompt con schema objetivo
- Usa temperature 0.0 (determinista)
- maxTokens: 1500
- Parsea respuesta JSON
- Fallback seguro si falla

**Decisión:** ✅ **MIGRAR AL BACKEND**
- Modelo fijo (siempre gpt-4o-mini)
- Consume energía (vía `_callAIChat`)
- Lógica de negocio crítica

---

#### 3. **`generarFraseHome()`** (líneas 524-575)
**¿Qué hace?**
- Genera frase breve para pantalla principal (≤25 palabras)
- **Modelo:** `gemini-2.0-flash` (línea 567)
- Usa memoria del asistente y contexto del usuario

**Decisión:** 🟡 **MIGRAR PARCIALMENTE**
- **Backend:** Llamada a Gemini con validación de energía
- **Flutter:** Construcción del prompt (tiene BuildContext)

---

#### 4. **`generarComentarioPaso()`** (líneas 578-658)
**¿Qué hace?**
- Genera comentario filosófico sobre respuesta del usuario en reprogramación
- **Modelo:** `gemini-2.5-flash` (línea 657)
- Máx 6 líneas, tono filosófico (Stoico, Jungiano, etc.)

**Decisión:** 🟡 **MIGRAR PARCIALMENTE**
- **Backend:** Llamada a Gemini
- **Flutter:** Prompt con localización

---

#### 5. **`generarResultadoReprogramacion()`** (líneas 661-754)
**¿Qué hace?**
- Genera informe final de reprogramación (3-5 párrafos)
- **Modelo:** `gemini-2.5-pro` (línea 753)
- Analiza 5 pasos del proceso

**Decisión:** 🟡 **MIGRAR PARCIALMENTE**
- **Backend:** Llamada a Gemini Pro
- **Flutter:** Construcción del prompt

---

#### 6. **`generarResumenEjecucion()`** (líneas 756-1000+)
**¿Qué hace?**
- Genera resumen operativo del día
- **Modelo:** NO ESPECIFICADO en el fragmento leído (probablemente Gemini)
- Retorna `ResumenEjecucion` (JSON estructurado)
- Análisis de actividades, desviaciones, notas

**Decisión:** 🟡 **MIGRAR PARCIALMENTE**
- **Backend:** Llamada a IA + validación JSON
- **Flutter:** Construcción del prompt con plan diario

---

### FUNCIONES DE SOPORTE - 🔵 MANTENER EN FLUTTER

#### 7. **`limpiarTextoIA()`** (líneas 22-35)
**¿Qué hace?**
- Limpia caracteres Unicode raros de respuestas
- Reemplaza comillas tipográficas, etc.

**Decisión:** 🔵 **MANTENER EN FLUTTER** (utilidad de UI)

---

#### 8. **`calcularTokensGeminiSolo()`** (líneas 38-41)
**¿Qué hace?**
- Estima tokens: `longitud / 3.7`

**Decisión:** 🟡 **MIGRAR AL BACKEND**
- Necesario para calcular consumo de energía

---

#### 9. **`generarMemoriaCompleta()`** (líneas 395-433)
**¿Qué hace?**
- Construye string de memoria del asistente
- Usa `AppLocalizations` (localización)

**Decisión:** 🔵 **MANTENER EN FLUTTER**
- Depende de BuildContext y localización
- Solo construye strings, no llama APIs

---

#### 10. **`crearContextoConMemoria()`** (líneas 437-460)
**¿Qué hace?**
- Crea array de mensajes con memoria como system message

**Decisión:** 🔵 **MANTENER EN FLUTTER**
- Solo prepara datos, no llama APIs

---

## 🎯 CLASIFICACIÓN FINAL

### 🔴 CRÍTICO - MIGRAR AL BACKEND (OBLIGATORIO)

| Función | Motivo | Prioridad |
|---------|--------|-----------|
| `_callAIChat` | Claves API expuestas, consume energía | 🔴 Alta |
| `convertirAStrictJSON` | Claves API, modelo fijo gpt-4o-mini | 🔴 Alta |

### 🟡 ALTO - MIGRAR PARCIALMENTE

| Función | Backend | Flutter |
|---------|---------|---------|
| `generarFraseHome` | Llamada Gemini + energía | Prompt con localización |
| `generarComentarioPaso` | Llamada Gemini + energía | Prompt con contexto |
| `generarResultadoReprogramacion` | Llamada Gemini Pro + energía | Prompt con pasos |
| `generarResumenEjecucion` | Llamada IA + validación JSON | Prompt con plan diario |

### 🔵 MEDIO - MANTENER EN FLUTTER

| Función | Motivo |
|---------|--------|
| `limpiarTextoIA` | Utilidad de UI |
| `generarMemoriaCompleta` | Depende de localización |
| `crearContextoConMemoria` | Solo prepara datos |

### ⚪ BAJO - HELPERS

| Función | Decisión |
|---------|----------|
| `calcularTokensGeminiSolo` | Migrar al backend (para energía) |

---

## 🔑 DESCUBRIMIENTOS CRÍTICOS

### 1. **Selección de Modelo NO es por plan del usuario**

❌ **CORRECCIÓN NECESARIA:**
En el análisis inicial asumí que el modelo se selecciona según el plan del usuario, pero en realidad:

- `_callAIChat` recibe el modelo como **parámetro opcional**
- Default: `gemini-2.5-flash` (línea 162)
- Cada función que llama a `_callAIChat` **especifica su propio modelo**:
  - `convertirAStrictJSON`: `gpt-4o-mini` (línea 59)
  - `generarFraseHome`: `gemini-2.0-flash` (línea 567)
  - `generarComentarioPaso`: `gemini-2.5-flash` (línea 657)
  - `generarResultadoReprogramacion`: `gemini-2.5-pro` (línea 753)

**Conclusión:** El modelo se selecciona por **tipo de función**, NO por plan del usuario.

---

### 2. **Consumo de Energía SOLO en Gemini**

🚨 **ASIMÉTRICO:**
- Gemini descuenta energía **automáticamente** en `_callAIChat` (líneas 336-348)
- OpenAI **NO descuenta energía** en `_callAIChat`

**Pregunta crítica:** ¿Esto es intencional o es un bug?

**Decisión para backend:**
✅ Consumir energía **SIEMPRE** (tanto OpenAI como Gemini)

---

### 3. **Cálculo de Energía (Gemini)**

```dart
final tokensPrompt = calcularTokensGeminiSolo(prompt);
final tokensRespuesta = calcularTokensGeminiSolo(respuesta);
final tokens = (tokensRespuesta + (tokensPrompt * 0.30)).round();
final energiaARestar = (tokens / 100).ceil();
```

**Fórmula:**
1. Tokens de respuesta (completos)
2. Tokens de prompt (solo 30%)
3. Total tokens = respuesta + (prompt × 0.30)
4. Energía = ceil(tokens / 100)

**Ejemplo:**
- Prompt: 1000 chars → ~270 tokens
- Respuesta: 500 chars → ~135 tokens
- Total: 135 + (270 × 0.30) = 216 tokens
- Energía: ceil(216 / 100) = 3

---

### 4. **Redirección a Suscripción cuando energía = 0**

```dart
if (energiaRestante != null && energiaRestante <= 0) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    NavigationService.instance.pushAndRemoveUntil(
      const SubscriptionScreen(),
    );
  });
}
```

**Decisión para backend:**
❌ NO migrar (es lógica de UI)
✅ Backend solo debe lanzar error `INSUFFICIENT_ENERGY`

---

## 📝 RECOMENDACIONES PARA LA MIGRACIÓN

### Arquitectura del Backend

```javascript
// src/services/aiService.js

/**
 * FUNCIÓN PRINCIPAL: callAI
 *
 * Centraliza TODAS las llamadas a OpenAI/Gemini
 *
 * @param {string} userId - ID del usuario
 * @param {array} messages - Mensajes del chat
 * @param {object} options - Opciones
 *   - model: Modelo específico (gpt-4o-mini, gemini-2.5-flash, etc.)
 *   - temperature: 0.0 - 1.0
 *   - maxTokens: Límite de tokens
 *   - forceJson: Boolean (response_format)
 */
async function callAI(userId, messages, options = {}) {
  // 1. Validar energía ANTES de llamar
  // 2. Ejecutar llamada según modelo
  // 3. Calcular tokens consumidos
  // 4. Descontar energía DESPUÉS de respuesta exitosa
  // 5. Registrar uso en Firestore
  // 6. Retornar respuesta
}

/**
 * FUNCIÓN ESPECÍFICA: convertToJSON
 *
 * Siempre usa gpt-4o-mini
 */
async function convertToJSON(userId, content, schema) {
  return callAI(userId, [...], {
    model: 'gpt-4o-mini',
    forceJson: true,
    temperature: 0.0,
    maxTokens: 1500
  });
}
```

### Endpoints Necesarios

```
POST /api/ai/call
POST /api/ai/convert-json
POST /api/ai/generate-home-phrase
POST /api/ai/generate-comment
POST /api/ai/generate-reprogramming-result
POST /api/ai/generate-execution-summary
```

---

## ✅ PLAN DE ACCIÓN

### FASE 1: Core Functions (URGENTE)
1. ✅ Migrar `_callAIChat` → `callAI`
2. ✅ Migrar `convertirAStrictJSON` → `convertToJSON`
3. ✅ Implementar cálculo de tokens Gemini
4. ✅ Implementar consumo de energía universal

### FASE 2: Specific Functions (ALTA PRIORIDAD)
5. ✅ Endpoint para `generarFraseHome`
6. ✅ Endpoint para `generarComentarioPaso`
7. ✅ Endpoint para `generarResultadoReprogramacion`
8. ✅ Endpoint para `generarResumenEjecucion`

### FASE 3: Documentation
9. ✅ Documentar endpoints en README
10. ✅ Documentar modelos por tipo de función

---

**Conclusión:** La migración requiere separar la **lógica de negocio** (llamadas API, energía) de la **construcción de prompts** (que debe quedarse en Flutter por depender de localización y contexto del usuario).

