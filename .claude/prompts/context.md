## CONTEXTO

Estoy ejecutando un experimento de concurrencia con un runner (`runner-experiment.js`).

Comportamiento observado:

- Los usuarios se crean correctamente
- Se ejecuta login para los primeros usuarios
- PERO:
  - No veo ejecución posterior en Render
  - No aparecen requests esperadas del runner (ej: creación de series, acciones, etc.)
  - El sistema parece detenerse o no avanzar tras el login

Objetivo:

- Detectar la causa raíz EXACTA del problema
- Verificar si hay inconsistencias en el pipeline completo
- Asegurar que el runner realmente ejecuta todos los pasos esperados
- Confirmar si el problema está en:
  - runner
  - cliente HTTP
  - backend
  - despliegue (Render)
  - o flujo lógico del experimento

---

## ALCANCE DE ANÁLISIS

Debes analizar TODO el flujo extremo a extremo:

### 1. Runner (cliente)
- Estructura del runner-experiment.js
- Secuencia de ejecución
- Manejo de concurrencia (loops, promises, awaits)
- Gestión de errores (try/catch, silencios)
- Logs (qué se loguea y qué no)
- Condiciones de corte o finalización
- Posibles fallos silenciosos

### 2. Flujo HTTP
- Requests que deberían ejecutarse tras login
- Headers / auth tokens
- Formato de payload
- Posibles fallos no visibles (timeouts, rechazos, etc.)

### 3. Backend (Render)
- Endpoints esperados vs realmente ejecutados
- Posibles rechazos (401, 403, 500)
- Validaciones que bloqueen ejecución
- Lógica que corte el flujo tras login
- Problemas de concurrencia o rate limiting

### 4. Observabilidad
- Qué métricas deberían aparecer y no aparecen
- Qué logs deberían verse en Render
- Si el problema es:
  - ejecución real ausente
  - o falta de visibilidad

### 5. Infraestructura / despliegue
- Problemas de networking (Render)
- Problemas de variables de entorno
- Diferencia entre entorno local y producción

---

## RESTRICCIONES

- No asumas que el problema está en un único punto
- No propongas soluciones antes de identificar la causa raíz
- No ignores posibles fallos silenciosos
- No des respuestas genéricas tipo “puede ser X o Y”
- No simplifiques el problema

Debes actuar como si fueras responsable del sistema en producción.

---

## MÉTODO (OBLIGATORIO)

Sigue estrictamente este orden:

1. Definir el problema con precisión
2. Mapear el flujo esperado completo (runner → backend → respuesta)
3. Detectar dónde se rompe el flujo
4. Identificar la causa raíz (no el síntoma)
5. Detectar inconsistencias adicionales en el pipeline
6. Proponer la resolución correcta (sin implementar aún)
7. Definir cómo verificar que el problema está realmente resuelto

---

## SALIDA ESPERADA

Estructura obligatoria:

### 1. Definición del fallo
Qué está ocurriendo realmente

### 2. Flujo esperado vs flujo real
Dónde divergen exactamente

### 3. Causa raíz
Explicación técnica precisa (no hipótesis vagas)

### 4. Problemas adicionales detectados
Cualquier inconsistencia o riesgo en el sistema

### 5. Estrategia de resolución
Qué debe cambiar y por qué

### 6. Verificación
Cómo confirmar que el sistema funciona correctamente tras el fix

---

## IMPORTANTE

Si el problema no es evidente:

- Señala explícitamente qué información falta
- Indica qué logs o puntos de observabilidad deberían añadirse
- No inventes conclusiones

---

## ACTIVACIÓN

Cargar todos los archivos referenciados.

Asumir el rol de Ingeniero Maestro.

Entrar en modo de resolución.

No escribir código.

Iniciar análisis.