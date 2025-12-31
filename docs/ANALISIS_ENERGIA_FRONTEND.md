# ANÁLISIS: Sistema de Energía Original (Frontend Flutter)

**Fecha:** 2025-12-26
**Fuente:** `frontend-reference/services/energy_service.dart` + `frontend-reference/services/ai_service.dart`
**Propósito:** Documentar EXACTAMENTE cómo funciona la energía en el frontend para corregir el backend

---

## 1. Almacenamiento y Estado

### Fuente de datos:
- ✅ **SharedPreferences (local)** - Almacenamiento principal
- ✅ **Firestore (cloud)** - Sincronización con servidor (verificada mediante HTTP)
- ✅ **Ambos con sincronización** - Servidor como fuente de verdad para planes

### Estructura de datos (SharedPreferences):

```dart
// Claves principales
_keyEnergiaPrincipal = 'energia_restante';          // int: energía actual
_keyUltimaRecarga = 'ultima_recarga';                // String: timestamp ISO8601 UTC
_keyPlanUsuario = 'plan_usuario';                    // String: 'freemium'|'mini'|'base'|'pro'

// Sistema de Trial (48 horas)
_keyTrialStartTimestamp = 'trial_start_timestamp';   // String: timestamp ISO8601 UTC
_keyTrialActivo = 'trial_activo';                    // bool: true si trial activo

// Seguridad
_keyFechaActivacion = 'fecha_activacion_plan';       // String: timestamp ISO8601 UTC
_keyHashVerificacion = 'hash_verificacion_energia';  // String: hash de integridad
```

### Valores de energía por plan:

```dart
// Líneas 16-22 de energy_service.dart
energiaFreemium = 135;  // Trial de 48 horas (NO acumulable)
energiaMini = 75;       // Plan Mini (diario)
energiaBase = 150;      // Plan Base (diario)
energiaPro = 300;       // Plan Pro (diario)
```

### Conversión tokens → energía:

```dart
// Línea 13 de energy_service.dart
// 1 energía = 100 tokens
```

---

## 2. Recarga de Energía

### Cuándo se recarga:

1. **Diaria (cada 24 horas)** - Para planes de pago (mini/base/pro)
   - Se verifica en `recargarSiCorresponde()` (líneas 403-505)
   - Condición: `diferencia.inHours >= 24` (línea 483)

2. **Al activar un plan** - Con `resetEnergia = true` (default)
   - Función: `activarPlanLocal()` (líneas 145-208)

3. **Sistema Trial (48 horas)**:
   - **Primera recarga**: 135 energía al iniciar trial (hora 0)
   - **Segunda recarga**: +135 energía después de 24 horas (total 270)
   - **Expiración**: A las 48 horas → energía = 0

### Cantidad recargada:

- ✅ **Depende del plan** (75/150/300)
- ✅ **Es el máximo del plan** (no acumula, sobrescribe)
- ❌ **NO se acumula con energía restante**

### Código relevante de recarga diaria:

```dart
// Líneas 483-496 de energy_service.dart
if (diferencia.inHours >= 24) {
  debugPrint('   ✅ Recarga diaria aplicable (≥24h)');
  if (plan == 'freemium' && trialActivo) {
    // Aplicar recarga del trial
    final energiaCalculada = await _calcularEnergiaTrialExacta();
    await prefs.setInt(_keyEnergiaPrincipal, energiaCalculada);
    EnergyService.energiaNotifier.value = energiaCalculada;
    await prefs.setString(_keyUltimaRecarga, now.toIso8601String());
    await _actualizarHash();
    debugPrint('   💰 Recarga del trial aplicada: $energiaCalculada');
  } else {
    // Aplicar recarga del plan de pago
    await _aplicarRecargaPlan(plan, now, prefs);
  }
}
```

### Función `_aplicarRecargaPlan()` (líneas 508-533):

```dart
Future<void> _aplicarRecargaPlan(String plan, DateTime now, SharedPreferences prefs) async {
  await _prefsLock.synchronized(() async {
    int energiaPlan = 0;

    switch (plan) {
      case 'mini':
        energiaPlan = energiaMini;   // 75
        break;
      case 'base':
        energiaPlan = energiaBase;   // 150
        break;
      case 'pro':
        energiaPlan = energiaPro;    // 300
        break;
    }

    debugPrint('   💎 Aplicando recarga plan $plan: $energiaPlan energía');

    await prefs.setInt(_keyEnergiaPrincipal, energiaPlan);
    await prefs.setString(_keyUltimaRecarga, now.toUtc().toIso8601String());
    await _actualizarHash();

    EnergyService.energiaNotifier.value = energiaPlan;
    notifyListeners();
  });
}
```

---

## 3. Consumo de Energía en ai_service.dart

### ⚠️ HALLAZGO CRÍTICO:

**SOLO GEMINI CONSUME ENERGÍA. OPENAI (GPT) NO CONSUME ENERGÍA.**

### Función central: `_callAIChat()` (líneas 153-368)

Esta es la **ÚNICA** función que consume energía en todo el sistema.

#### Ruta OpenAI (GPT-4o-mini, gpt-4o, etc.):

```dart
// Líneas 168-224
if (modeloReal.startsWith('gpt')) {
  debugPrint('[AI] 🟦 Ruta OpenAI activada');

  // ... llamada a OpenAI API ...

  final texto = data["choices"]?[0]?["message"]?["content"]?.toString().trim() ?? '';
  return texto;  // ❌ NO HAY DESCUENTO DE ENERGÍA
}
```

**❌ NO consume energía** - Retorna directamente sin descuento

#### Ruta Gemini (gemini-2.0-flash, gemini-2.5-flash, etc.):

```dart
// Líneas 227-367
// ... llamada a Gemini API ...

final respuesta = extraerTexto(dataGemini).trim();

// ================================================================
// 4️⃣ Descuento de energía (solo Gemini) - LÍNEAS 336-348
// ================================================================
try {
  final tokensPrompt = calcularTokensGeminiSolo(prompt);
  final tokensRespuesta = calcularTokensGeminiSolo(respuesta);
  final tokens = (tokensRespuesta + (tokensPrompt * 0.30)).round();
  final energiaARestar = (tokens / 100).ceil();

  await EnergyService().decrementEnergyBy(energiaARestar);

  debugPrint('[GEMINI] 🔋 Energía descontada: $energiaARestar '
      '(respuesta: $tokensRespuesta, prompt: $tokensPrompt, total: $tokens)');
} catch (e) {
  debugPrint('[GEMINI] ⚠️ Error descontando energía: $e');
}

// Verificar energía restante y redirigir si es necesario
try {
  final energiaRestante = await EnergyService.getEnergiaActual();

  if (energiaRestante != null && energiaRestante <= 0) {
    // 🔁 Asegurar navegación fuera del frame actual
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NavigationService.instance.pushAndRemoveUntil(
        const SubscriptionScreen(),
      );
    });
  }
} catch (e) {
  debugPrint('[AI] ⚠️ Error comprobando energía restante: $e');
}

return respuesta;
```

**✅ SÍ consume energía** - Descuenta DESPUÉS de recibir respuesta

---

## 4. Validación de Energía Disponible

### ¿Hay validación previa ANTES de llamar a IA?

❌ **NO hay validación previa en ai_service.dart**

La validación se hace en **otra capa** (probablemente en widgets/screens):

```dart
// Ejemplo de validación en widgets (NO en ai_service)
// Función: checkEnergiaYRecarga() - Líneas 756-808 de energy_service.dart
static Future<void> checkEnergiaYRecarga(
  BuildContext? context,
  VoidCallback onRecarga,
  String userId,
) async {
  try {
    debugPrint('[EnergyService] 🔍 Iniciando check de energía para userId: $userId');

    // 🆕 VERIFICAR CANCELACIÓN PROGRAMADA (si aplica)
    final cancelacionProgramada = await tieneCancelacionProgramada(userId);
    if (cancelacionProgramada) {
      final fechaExpiracion = await getFechaExpiracionCancelacion(userId);
      if (fechaExpiracion != null && DateTime.now().isAfter(fechaExpiracion)) {
        debugPrint('[EnergyService] ⚠️ Plan expirado por cancelación - sincronizando');
        await sincronizarPlanDesdeServidor(userId);
      }
    }

    // ⚡ OBTENER ENERGÍA ACTUAL
    final energia = await getEnergiaActual();

    debugPrint('[EnergyService] 📊 Energía disponible: $energia');

    // 🚨 SI NO HAY ENERGÍA → SUSCRIPCIÓN
    if (energia <= 0) {
      debugPrint('[EnergyService] ❌ Sin energía - redirigiendo a suscripción');

      if (context != null && context.mounted) {
        await Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
          (route) => false,
        );
      }
      return;
    }

    // ✅ HAY ENERGÍA → EJECUTAR ACCIÓN
    debugPrint('[EnergyService] ✅ Ejecutando acción - energía: $energia');
    onRecarga();

  } catch (e) {
    debugPrint('[EnergyService] ❌ Error en checkEnergiaYRecarga: $e');

    if (context != null && context.mounted) {
      await Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
        (route) => false,
      );
    }
  }
}
```

### ¿Qué pasa si no hay energía suficiente?

1. **ANTES de llamar a IA**: `checkEnergiaYRecarga()` → Redirige a SubscriptionScreen
2. **DESPUÉS de llamar a IA**: Verifica energía restante → Redirige si energía <= 0

---

## 5. Cálculo de Energía Consumida

### Cálculo de tokens (Gemini):

```dart
// Líneas 37-40 de ai_service.dart
int calcularTokensGeminiSolo(String texto) {
  final longitud = texto.trim().length;
  return (longitud / 3.7).round(); // ≈ 1 token por 3.7 caracteres
}
```

### Fórmula de energía (Gemini):

```dart
// Líneas 336-340 de ai_service.dart
final tokensPrompt = calcularTokensGeminiSolo(prompt);
final tokensRespuesta = calcularTokensGeminiSolo(respuesta);
final tokens = (tokensRespuesta + (tokensPrompt * 0.30)).round();
final energiaARestar = (tokens / 100).ceil();
```

**Fórmula:**
```
tokens_totales = tokens_respuesta + (tokens_prompt × 0.30)
energia = ceil(tokens_totales / 100)
```

**Ejemplo:**
- Respuesta: 500 caracteres → ~135 tokens
- Prompt: 1000 caracteres → ~270 tokens
- Tokens totales: 135 + (270 × 0.30) = 135 + 81 = 216 tokens
- Energía: ceil(216 / 100) = **3 energía**

### OpenAI:

```
❌ NO CONSUME ENERGÍA
```

---

## 6. Lista de TODAS las Funciones que Usan IA

Todas estas funciones llaman a `_callAIChat()`:

| Función | Archivo | Modelo Default | ¿Consume Energía? | Línea |
|---------|---------|---------------|------------------|-------|
| `convertirAStrictJSON()` | ai_service.dart | `gpt-4o-mini` | ❌ NO (usa OpenAI) | 54 |
| `generarFraseHome()` | ai_service.dart | `gemini-2.0-flash` | ✅ SÍ | 523 |
| `generarComentarioPaso()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | 577 |
| `generarPreguntaReflexiva()` | ai_service.dart | `gemini-2.5-pro` | ✅ SÍ | ~753 |
| `generarMensajeAnalisisCreencias()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1017 |
| `generarSugerenciasAccion()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1077 |
| `generarIndicacionActivacion()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1242 |
| `generarPasosProgramacion()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1426 |
| `generarEjercicioProgramacion()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1579 |
| `generarSerieTematica()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1658 |
| `generarEjercicioSerie()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~1803 |
| `generarAnalisisAvance()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~2009 |
| `generarEvaluacionEjecucion()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~2120 |
| `generarInsightAvance()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~2206 |
| `generarComentarioInforme()` | ai_service.dart | `gemini-2.5-pro` | ✅ SÍ | ~2410 |
| `generarEntradaPersonalizada()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~2473 |
| `generarRespuestaLibre()` | ai_service.dart | `gemini-2.5-flash` (default) | ✅ SÍ | ~2525 |

**Resumen:**
- **1 función usa OpenAI** (no consume energía): `convertirAStrictJSON()`
- **16 funciones usan Gemini** (consumen energía): Todas las demás

---

## 7. Función `decrementEnergyBy()` (energy_service.dart)

```dart
// Líneas 536-541 de energy_service.dart
Future<void> decrementEnergyBy(int amount) async {
  final energiaActual = await getEnergiaActual();
  final nueva = (energiaActual - amount).clamp(0, 999999);
  await setEnergia(nueva);
  notifyListeners();
}
```

### `setEnergia()` (líneas 373-385):

```dart
static Future<void> setEnergia(int nueva) async {
  await _prefsLock.synchronized(() async {
    final prefs = await SharedPreferences.getInstance();
    final plan = prefs.getString(_keyPlanUsuario) ?? 'freemium';
    final fecha = prefs.getString(_keyUltimaRecarga) ?? DateTime.now().toIso8601String();

    await prefs.setInt(_keyEnergiaPrincipal, nueva);
    final hash = _generateHash(plan, nueva, fecha);
    await prefs.setString(_keyHashVerificacion, hash);

    EnergyService.energiaNotifier.value = nueva;
  });
}
```

**Nota:** `setEnergia()` **NO actualiza `_keyUltimaRecarga`** - Solo para decrementar, NO para recargas.

---

## 8. Sincronización con Backend

### Función: `sincronizarPlanDesdeServidor()` (líneas 216-303)

```dart
static Future<void> sincronizarPlanDesdeServidor(String userId) async {
  await _prefsLock.synchronized(() async {
    try {
      debugPrint('[EnergyService] 🔄 Sincronizando plan desde servidor...');

      final response = await http.get(
        Uri.parse('https://arvi-stripe-backend.onrender.com/user/$userId/status'),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        debugPrint('[EnergyService] ⚠️ Error ${response.statusCode} al consultar servidor');
        return;
      }

      final data = jsonDecode(response.body);
      final planServidor = data['plan'] as String? ?? 'freemium';
      final activo = data['activo'] as bool? ?? false;
      final customerId = data['customerId'] as String?;

      debugPrint('[EnergyService] 📊 Respuesta servidor:');
      debugPrint('   → Plan: $planServidor');
      debugPrint('   → Activo: $activo');
      debugPrint('   → CustomerId: $customerId');

      final prefs = await SharedPreferences.getInstance();
      final planLocal = prefs.getString(_keyPlanUsuario) ?? 'freemium';

      // 🔹 CASO: PLAN ACTIVO (MINI/BASE/PRO)
      if (activo && (planServidor == 'mini' || planServidor == 'base' || planServidor == 'pro')) {
        debugPrint('[EnergyService] ✅ Plan de pago activo: $planServidor');

        await prefs.setString(_keyPlanUsuario, planServidor);
        await prefs.setBool(_keyTrialActivo, false);

        if (planLocal != planServidor) {
          debugPrint('[EnergyService] 🔄 Cambio de plan: $planLocal → $planServidor');

          int energiaPlan = 0;
          switch (planServidor) {
            case 'mini':
              energiaPlan = energiaMini;
              break;
            case 'base':
              energiaPlan = energiaBase;
              break;
            case 'pro':
              energiaPlan = energiaPro;
              break;
          }

          await prefs.setInt(_keyEnergiaPrincipal, energiaPlan);
          await prefs.setString(_keyUltimaRecarga, DateTime.now().toUtc().toIso8601String());
        }

        if (customerId != null) {
          await StorageService.guardarCustomerId(customerId);
        } else {
          debugPrint('[EnergyService] ⚠️ customerId nulo recibido del servidor; no se guarda.');
        }
        await _actualizarHash();

        return;
      }

      // 🔹 CASO: REVERTIR A FREEMIUM (PLAN INACTIVO O CANCELADO)
      if (!activo && planServidor == 'freemium') {
        final trialActivo = await isTrialActivo();

        if (trialActivo) {
          // ✔ El usuario está en trial → NO modificar energía NI hash
          debugPrint('[EnergyService] ✔ Freemium desde servidor, pero trial activo. Se respeta trial.');
          return;
        }

        // ❌ No hay trial → revertir realmente a freemium con energía = 0
        debugPrint('[EnergyService] 🆓 Freemium sin trial - energía 0');
        await prefs.setString(_keyPlanUsuario, 'freemium');
        await prefs.setInt(_keyEnergiaPrincipal, 0);
        await prefs.setBool(_keyTrialActivo, false);
        await prefs.setString(_keyUltimaRecarga, DateTime.now().toUtc().toIso8601String());
        await _actualizarHash();
        return;
      }
    } catch (e) {
      debugPrint('[EnergyService] ❌ Error sincronizando: $e');
    }
  });
}
```

### Endpoint del backend:

```
GET https://arvi-stripe-backend.onrender.com/user/{userId}/status
```

**Respuesta esperada:**
```json
{
  "plan": "freemium" | "mini" | "base" | "pro",
  "activo": true | false,
  "customerId": "cus_xxxxx" | null,
  "cancelacion_programada": true | false,
  "fecha_expiracion": "2025-12-31T23:59:59Z" | null,
  "fecha_cancelacion_solicitada": "2025-12-15T10:30:00Z" | null
}
```

---

## 9. Sistema de Integridad (Hash)

### Generación de hash (línea 47-49):

```dart
static String _generateHash(String plan, int energia, String fecha) {
  return (plan + energia.toString() + fecha + _secretKey).hashCode.abs().toString();
}
```

**Secret key:** `'ARVI_2025_ENERGY_SECRET_KEY'` (línea 36)

### Verificación de integridad (líneas 80-111):

```dart
static Future<bool> _verificarIntegridad() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final plan = prefs.getString(_keyPlanUsuario) ?? 'freemium';
    final energia = prefs.getInt(_keyEnergiaPrincipal) ?? 0;
    final fecha = prefs.getString(_keyUltimaRecarga) ?? DateTime.now().toIso8601String();
    final hashGuardado = prefs.getString(_keyHashVerificacion) ?? '';

    final hashCalculado = _generateHash(plan, energia, fecha);

    // 🔹 MODIFICADO: Si NO hay hash, generarlo (primera vez)
    if (hashGuardado.isEmpty) {
      await prefs.setString(_keyHashVerificacion, hashCalculado);
      debugPrint('[EnergyService] 🔧 Hash inicial generado para integridad');
      return true;
    }

    // 🔹 SOLO restaurar si el hash es diferente (integridad rota)
    if (hashGuardado != hashCalculado) {
      debugPrint('[EnergyService] ⚠️ Integridad rota — Restaurando valores seguros');
      await _restaurarSistemasSeguro();
      return false;
    }

    debugPrint('[EnergyService] ✅ Integridad verificada correctamente');
    return true;
  } catch (e) {
    debugPrint('[EnergyService] ❌ Error integridad: $e');
    await _restaurarSistemasSeguro();
    return false;
  }
}
```

⚠️ **Nota:** El backend NO usa este sistema de hash (es solo frontend).

---

## 10. Resumen Ejecutivo para Backend

### ✅ LO QUE EL BACKEND DEBE HACER:

1. **Validación ANTES de llamar a IA:**
   ```javascript
   // ANTES de cualquier llamada a Gemini/OpenAI:
   const energia = await getEnergiaActual(userId);
   if (energia <= 0) {
     throw new Error('Energía insuficiente');
   }
   ```

2. **Consumo DESPUÉS de recibir respuesta (solo Gemini):**
   ```javascript
   // SOLO para llamadas a Gemini:
   const tokensPrompt = Math.round(prompt.length / 3.7);
   const tokensRespuesta = Math.round(respuesta.length / 3.7);
   const tokensTotal = Math.round(tokensRespuesta + (tokensPrompt * 0.30));
   const energiaARestar = Math.ceil(tokensTotal / 100);

   await decrementarEnergia(userId, energiaARestar);
   ```

3. **OpenAI NO consume energía:**
   ```javascript
   // Si el modelo es gpt-4o-mini, gpt-4o, etc.:
   // ❌ NO DESCONTAR ENERGÍA
   ```

4. **Recarga diaria:**
   ```javascript
   // Verificar cada 24 horas:
   const ultimaRecarga = await getUltimaRecarga(userId);
   const horasTranscurridas = (Date.now() - ultimaRecarga) / (1000 * 60 * 60);

   if (horasTranscurridas >= 24) {
     const plan = await getPlan(userId);
     const energiaPlan = {
       'mini': 75,
       'base': 150,
       'pro': 300
     }[plan];

     await recargarEnergia(userId, energiaPlan);
   }
   ```

5. **Trial de 48 horas:**
   ```javascript
   // Primera recarga (hora 0): 135
   // Segunda recarga (hora 24): 135 (total 270)
   // Expiración (hora 48): 0
   ```

### ❌ LO QUE EL BACKEND **NO** DEBE HACER:

1. ❌ Consumir energía con OpenAI (gpt-4o-mini, gpt-4o)
2. ❌ Acumular energía en recargas (siempre sobrescribe)
3. ❌ Usar sistema de hash (es solo frontend)
4. ❌ Consumir energía ANTES de llamar a IA (solo validar)

### 🔑 FÓRMULA EXACTA DE ENERGÍA (Gemini):

```javascript
energia = Math.ceil((tokensRespuesta + (tokensPrompt * 0.30)) / 100)
```

Donde:
```javascript
tokens = Math.round(texto.length / 3.7)
```

---

## 11. Casos Especiales Detectados

### Trial de 48 horas:

- **Inicio:** Usuario nuevo en `freemium` → 135 energía
- **24 horas después:** +135 energía (total 270)
- **48 horas después:** Trial expira → 0 energía
- **Verificación:** Se hace en `recargarSiCorresponde()` y `isTrialActivo()`

### Cancelación programada:

```dart
// Líneas 765-772 de energy_service.dart
final cancelacionProgramada = await tieneCancelacionProgramada(userId);
if (cancelacionProgramada) {
  final fechaExpiracion = await getFechaExpiracionCancelacion(userId);
  if (fechaExpiracion != null && DateTime.now().isAfter(fechaExpiracion)) {
    debugPrint('[EnergyService] ⚠️ Plan expirado por cancelación - sincronizando');
    await sincronizarPlanDesdeServidor(userId);
  }
}
```

El backend debe manejar `cancelacion_programada` y `fecha_expiracion`.

---

## 12. Diferencias Críticas vs Backend Actual

| Aspecto | Frontend (Correcto) | Backend Actual | ¿Necesita corrección? |
|---------|---------------------|----------------|----------------------|
| OpenAI consume energía | ❌ NO | ⚠️ Desconocido | ✅ Verificar |
| Consumo antes/después | DESPUÉS (Gemini) | ⚠️ Desconocido | ✅ Verificar |
| Fórmula tokens Gemini | `length / 3.7` + 30% prompt | ⚠️ Desconocido | ✅ Verificar |
| Recarga diaria | 24 horas exactas | ⚠️ Desconocido | ✅ Verificar |
| Trial (48h) | 135 × 2 recargas | ⚠️ Desconocido | ✅ Verificar |
| Validación previa | En UI (checkEnergiaYRecarga) | ⚠️ Desconocido | ✅ Implementar |

---

## 13. Próximos Pasos

1. ✅ **Auditar backend actual** - Verificar lógica de energía existente
2. ✅ **Corregir consumo OpenAI** - NO debe consumir energía
3. ✅ **Corregir fórmula Gemini** - Usar `length / 3.7` + 30% prompt
4. ✅ **Implementar validación previa** - Antes de llamar a IA
5. ✅ **Verificar recarga diaria** - Exactamente 24 horas, no más
6. ✅ **Probar trial de 48h** - Recargas en hora 0 y 24

---

**FIN DEL ANÁLISIS**

Este documento es la fuente de verdad para corregir el sistema de energía del backend.
