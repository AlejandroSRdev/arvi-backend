# IMPLEMENTATION PROMPT — Observabilidad del runner de experimento

---

## 1. PURPOSE

Mejorar la observabilidad del runner de carga (`synthetic/runner-experiment.js`) y su cliente HTTP (`synthetic/http.js`) para que todos los puntos de fallo emitan información diagnóstica precisa en stderr.

**Problema a resolver:** actualmente el sistema aborta en múltiples puntos sin exponer la causa real del fallo. Errores de red, logins fallidos por credenciales incorrectas, y logins fallidos por conexión son indistinguibles. El diagnóstico post-ejecución es imposible.

---

## 2. SCOPE

**INCLUIDO:**
- `synthetic/http.js` — exponer tipo y mensaje de error de red en el objeto de retorno
- `synthetic/runner-experiment.js` — añadir logs diagnósticos en todos los puntos de fallo y corte

**EXCLUIDO:**
- Cambios en lógica de negocio del runner (secuencia, concurrencia, batches, payloads, timeouts)
- Cambios en `synthetic/seed.js`, `synthetic/config.js`, `synthetic/scenarios.js`
- Cambios en cualquier archivo de backend
- Refactors de estructura, nombres o flujo general del runner
- Creación de archivos nuevos

---

## 3. FILES

Modificar únicamente:

- `synthetic/http.js`
- `synthetic/runner-experiment.js`

---

## 4. REQUIREMENTS

### 4.1 `synthetic/http.js`

**Cambio requerido:** el bloque `catch` debe incluir el error de red en el objeto de retorno en lugar de descartarlo.

**Código actual:**
```js
} catch (err) {
  const durationMs = Date.now() - startMs
  return { status: 0, ok: false, body: null, durationMs }
}
```

**Código requerido:**
```js
} catch (err) {
  const durationMs = Date.now() - startMs
  return { status: 0, ok: false, body: null, durationMs, errorCode: err.code ?? 'NETWORK_ERROR', errorMessage: err.message }
}
```

En el path de éxito HTTP (response recibida), el objeto de retorno debe incluir `errorCode: null, errorMessage: null`:

**Código actual (return de éxito):**
```js
return { status: response.status, ok: response.ok, body: parsedBody, durationMs }
```

**Código requerido:**
```js
return { status: response.status, ok: response.ok, body: parsedBody, durationMs, errorCode: null, errorMessage: null }
```

El contrato de retorno resultante en todos los casos es:
```
{ status, ok, body, durationMs, errorCode, errorMessage }
```

---

### 4.2 `synthetic/runner-experiment.js`

Añadir o modificar logs diagnósticos en los siguientes puntos exactos. No alterar ninguna otra lógica.

#### A. Log de URL base — antes del loop de login

Añadir inmediatamente antes de `console.error('[EXPERIMENT] Logging in...')`:

```js
console.error(`[EXPERIMENT] Base URL: ${process.env.SYNTHETIC_BASE_URL || 'http://localhost:3000'}`)
```

No importar CONFIG — usar directamente `process.env.SYNTHETIC_BASE_URL` con el mismo fallback que usa `config.js`.

---

#### B. Log de login fallido en `loginAll` — cuando `!result.ok`

**Código actual:**
```js
console.error(`[EXPERIMENT] Login failed for ${email}: status=${result.status}`)
```

**Código requerido:**

Si `result.status === 0` (error de red, nunca llegó al servidor):
```
[EXPERIMENT] Login failed for <email>: NETWORK_ERROR errorCode=<result.errorCode> errorMessage=<result.errorMessage>
```

Si `result.status !== 0` (respuesta HTTP recibida, servidor rechazó):
```
[EXPERIMENT] Login failed for <email>: status=<result.status> body=<JSON.stringify(result.body)>
```

Implementación exacta:
```js
if (result.status === 0) {
  console.error(`[EXPERIMENT] Login failed for ${email}: NETWORK_ERROR errorCode=${result.errorCode} errorMessage=${result.errorMessage}`)
} else {
  console.error(`[EXPERIMENT] Login failed for ${email}: status=${result.status} body=${JSON.stringify(result.body)}`)
}
```

---

#### C. Log de warm-up fallido — cuando `!warmup.ok`

**Código actual:**
```js
console.error(`ERROR: Warm-up failed. status=${warmup.status} body=${JSON.stringify(warmup.body)}`)
```

**Código requerido:**

Si `warmup.status === 0`:
```
ERROR: Warm-up failed. NETWORK_ERROR errorCode=<warmup.errorCode> errorMessage=<warmup.errorMessage>
```

Si `warmup.status !== 0`:
```
ERROR: Warm-up failed. status=<warmup.status> body=<JSON.stringify(warmup.body)>
```

Implementación exacta:
```js
if (warmup.status === 0) {
  console.error(`ERROR: Warm-up failed. NETWORK_ERROR errorCode=${warmup.errorCode} errorMessage=${warmup.errorMessage}`)
} else {
  console.error(`ERROR: Warm-up failed. status=${warmup.status} body=${JSON.stringify(warmup.body)}`)
}
```

El `process.exit(1)` que sigue permanece sin cambios.

---

#### D. Campo `error_code` en `emit` dentro de `executeRequest`

**Código actual:**
```js
error_code: result.ok ? null : (result.body?.error ?? `HTTP_${result.status}`)
```

**Código requerido:**
```js
error_code: result.ok ? null : (result.status === 0 ? result.errorCode : (result.body?.error ?? `HTTP_${result.status}`))
```

Este cambio hace que cuando una request de serie falla por error de red, el evento emitido al ndjson contenga el `errorCode` real (ej. `ECONNREFUSED`, `ETIMEDOUT`) en lugar de `HTTP_0`.

---

## 5. NON-GOALS

- NO cambiar la secuencia de ejecución del runner
- NO añadir reintentos de login ni de requests
- NO añadir health check previo al login
- NO cambiar el mecanismo de timeout en `executeRequest`
- NO cambiar el formato general de los eventos `emit()` más allá del campo `error_code` especificado en el punto D
- NO añadir comentarios al código
- NO añadir tests

---

## 6. DELIVERABLES

1. `synthetic/http.js` modificado — contrato de retorno incluye `errorCode` y `errorMessage` en todos los casos
2. `synthetic/runner-experiment.js` modificado — logs diagnósticos en puntos A, B, C y campo `error_code` corregido en punto D

**Verificación:**

- Con `SYNTHETIC_BASE_URL` incorrecto (servidor inexistente), stderr debe mostrar:
  ```
  [EXPERIMENT] Base URL: <url>
  [EXPERIMENT] Login failed for user@X: NETWORK_ERROR errorCode=ECONNREFUSED errorMessage=...
  ...
  ERROR: Only 0/20 users authenticated. Aborting.
  ```

- Con credenciales incorrectas (servidor activo pero 401), stderr debe mostrar:
  ```
  [EXPERIMENT] Login failed for user@X: status=401 body={"error":"..."}
  ```

- Con ejecución completa exitosa, el campo `error_code` en eventos de fallo del ndjson contiene códigos reales en lugar de `HTTP_0`.
