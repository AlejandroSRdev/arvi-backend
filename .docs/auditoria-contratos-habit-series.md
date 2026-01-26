# Auditoría Arquitectónica — Contratos de Habit Series

**Fecha:** 2026-01-26
**Rol:** Arquitecto Senior Hexagonal (Solo Auditoría)
**Alcance:** Contratos, modelos de aplicación, controlador y servicios de aplicación

---

## 1. Diagnóstico Arquitectónico (resumen)

El sistema presenta **incoherencia estructural** entre capas:

1. **El controlador está desconectado del caso de uso.** `HabitSeriesController.createHabitSeriesEndpoint` solo valida permisos (`assertCanCreateHabitSeries`) pero **nunca invoca** `createHabitSeries`. El endpoint retorna después de la validación, omitiendo todo el flujo de creación.

2. **El contrato de aplicación está desalineado con la firma del caso de uso.** El contrato define `testAnswers: UserTestAnswer[]` pero el caso de uso espera `testData: Record<string,string>`, `difficultyLabels` y `assistantContext`. Son tipos incompatibles.

3. **Los modelos de aplicación existen pero no se usan.** `SerieTematica`, `Accion`, `Dificultad`, `HabitosUsuario` nunca se instancian en el flujo actual. Están huérfanos.

4. **El servicio de parsing produce una forma que no coincide ni con los modelos ni con el contrato.** Retorna `{title, description, actions}` (claves en inglés) mientras los modelos usan propiedades en español (`titulo`, `listaAcciones`).

---

## 2. Respuesta a Pregunta 1 — Clases de Aplicación

### ¿Cuál es su rol arquitectónico correcto?

Las clases en `application/models/habit_classes/` son **entidades de dominio**, no modelos de aplicación ni DTOs.

Evidencia:
- `SerieTematica` contiene lógica de negocio (`calcularRango`)
- `Accion` mantiene invariantes (`dificultad: Dificultad` enum tipado)
- Modelan conceptos de negocio core con estado y comportamiento

### ¿Dónde DEBERÍAN usarse?

- En la **capa de dominio** (deberían moverse a `domain/entities/`)
- Instanciadas **después** de parsear y validar la salida de AI
- Usadas por el caso de uso para representar el objeto de negocio antes de persistir

### ¿Dónde NO DEBEN usarse?

- **Nunca en controladores.** Los controladores no deben construir ni depender de entidades de dominio.
- **Nunca como DTOs.** Contienen comportamiento; los DTOs son datos puros.
- **Nunca pasadas a repositorios tal cual.** Los repositorios reciben datos listos para persistir, no objetos ricos.

### Veredicto

Estas clases **pertenecen a `domain/`**, no a `application/models/`. Su ubicación actual viola la arquitectura hexagonal. La capa de Aplicación debe definir **contratos** (interfaces, DTOs), no entidades.

---

## 3. Respuesta a Pregunta 2 — Contrato de Aplicación

### ¿Qué DEBERÍA representar este contrato arquitectónicamente?

`CreateHabitSeriesContract.ts` define **límites de entrada/salida** para el caso de uso. Esto es correcto.

- `CreateHabitSeriesInput`: los datos explícitos y mínimos que el caso de uso requiere
- `CreateHabitSeriesOutput`: los datos que el caso de uso retorna en éxito

### Desalineación actual

| Contrato define | Caso de uso espera |
|-----------------|-------------------|
| `testAnswers: UserTestAnswer[]` | `testData: Record<string,string>` |
| (nada) | `difficultyLabels: object` |
| (nada) | `assistantContext: string` |

Esto significa:
- El contrato **no puede usarse** para invocar el caso de uso hoy
- El controlador no puede transformar el input HTTP al contrato y usarlo

### ¿Qué datos pertenecen a este contrato?

Solo datos que son:
- requeridos por el caso de uso para ejecutar su intención
- derivables del input del usuario o contexto de sesión
- no específicos de infraestructura (sin `req`, sin IDs de Firebase, sin config de AI)

Campos legítimos:
- `userId` — identidad del actor
- `language` — preferencia del usuario
- `testData` o `testAnswers` — respuestas del usuario (decidir un formato)
- `difficultyLabels` — si se requiere para construcción de prompts (cuestionable — puede pertenecer a infraestructura o config)
- `assistantContext` — si se envía desde el cliente (de otro modo, se construye internamente)

### ¿Qué datos NO DEBEN pertenecer?

- Datos específicos de HTTP (headers, cookies)
- Configuración de AI (modelo, temperatura)
- Referencias a repositorios
- Tokens de infraestructura

### ¿Cómo debe relacionarse con el DTO de request HTTP?

**Contrato ≠ DTO HTTP.**

El controlador recibe un **DTO HTTP** (JSON crudo del body). El controlador lo transforma al **Contrato de Aplicación**. El caso de uso recibe solo el contrato — nunca HTTP crudo.

```
HTTP Request → Controller → transforma → CreateHabitSeriesInput → Use-Case
```

### ¿Debe referenciar modelos o primitivos?

El contrato debe usar:
- Primitivos (`string`, `number`)
- Interfaces simples (`UserTestAnswer`)

**NO** debe referenciar entidades de dominio (`SerieTematica`, `Accion`). Los contratos son límites; no deben filtrar internos del dominio.

---

## 4. Respuesta a Pregunta 3 — Responsabilidad del Controlador

### ¿Cuáles son las ÚNICAS responsabilidades legítimas del controlador?

1. Extraer datos del request HTTP (`req.body`, `req.params`, `req.user`)
2. Realizar **validación sintáctica** (campos requeridos presentes, tipos correctos)
3. Transformar DTO HTTP → Contrato de Aplicación
4. Invocar el caso de uso
5. Transformar salida del caso de uso → respuesta HTTP
6. Capturar errores y **traducirlos** a códigos de estado HTTP

### ¿Qué validaciones pertenecen aquí?

- **Solo sintácticas**: ¿`language` es un string? ¿`testData` está presente?
- **Específicas del protocolo**: Autenticación (vía middleware), rate limiting

### ¿Qué lógica NUNCA debe existir aquí?

- Validación de negocio (acceso a plan, energía, límites) — esto pertenece al caso de uso
- Ejecución de AI
- Validación de schema
- Reglas de dominio
- Incremento de contadores

### Violación actual

`HabitSeriesController.createHabitSeriesEndpoint`:
- Llama a `assertCanCreateHabitSeries` (correcto — delegación)
- Retorna el resultado directamente sin invocar el caso de uso (incorrecto)
- **Nunca llama a `createHabitSeries`**

Esto significa que el endpoint valida pero **nunca crea**. El flujo está roto.

### ¿Debería el controlador saber sobre...?

| Concepto | ¿Debería el controlador saber? |
|----------|-------------------------------|
| AI | **No** |
| Validación de schema | **No** |
| Reglas de dominio | **No** |
| Modelos de aplicación | **No** |
| Contrato de aplicación | **Sí** — transforma hacia/desde él |
| Función del caso de uso | **Sí** — la invoca |

---

## 5. Respuesta a Pregunta 4 — Servicios de Aplicación

### ¿Cuál es la responsabilidad correcta de esta capa?

Los servicios de aplicación **soportan la orquestación de casos de uso** con lógica reutilizable que es:
- No específica de HTTP
- No una regla de dominio
- No una intención completa de caso de uso

### Servicios actuales

| Servicio | Rol | ¿Correcto? |
|----------|-----|-----------|
| `HabitSeriesValidationService` | Verificación de precondiciones antes del caso de uso | ✅ Sí |
| `HabitSeriesParsingService` | Transformar salida de AI → DTO | ✅ Sí (pero desalineación de forma) |

### ¿Deberían...?

| Acción | ¿Debería el servicio hacerlo? |
|--------|------------------------------|
| Parsear salida de AI | ✅ Sí — `HabitSeriesParsingService` |
| Validar schema | ✅ Sí — pero actualmente en caso de uso, podría extraerse |
| Instanciar modelos de aplicación | ❌ No — si los modelos son entidades de dominio, es trabajo del dominio |
| Acceder a repositorios | ⚠️ Solo si es delegado por el caso de uso |
| Conocer HTTP | ❌ No |

### Problema actual

`HabitSeriesParsingService.parseHabitSeriesData` retorna:
```js
{ title, description, actions: [{name, description, difficulty}] }
```

Pero los modelos de aplicación esperan:
```ts
SerieTematica { titulo, descripcion, listaAcciones: Accion[] }
```

La forma de salida no coincide con la forma del modelo. Esto crea una brecha:
- O el servicio de parsing debe producir la forma del modelo (claves en español)
- O los modelos deben usar claves en inglés
- O un **factory de dominio** debe transformar el DTO parseado en entidades

---

## 6. Reglas Arquitectónicas Finales

### Restricciones no negociables

1. **Las entidades de dominio (`SerieTematica`, `Accion`) deben moverse a `domain/entities/`.**

2. **La carpeta de modelos de aplicación debe contener solo DTOs e interfaces, nunca clases ricas en comportamiento.**

3. **`CreateHabitSeriesContract` debe coincidir exactamente con la firma del caso de uso.** La desalineación actual lo hace inutilizable.

4. **El controlador debe invocar el caso de uso después de la validación.** Actualmente se detiene en la validación y nunca crea nada.

5. **El controlador NO debe llamar servicios de validación directamente para lógica de negocio.** Si `assertCanCreateHabitSeries` es pre-validación, debería ser llamado **por el caso de uso**, no por el controlador. El trabajo del controlador es validación sintáctica y delegación.

6. **Los servicios de aplicación producen DTOs, no entidades de dominio.** La instanciación de entidades de dominio ocurre en el caso de uso o un factory de dominio.

7. **Una sola forma para parsing de salida de AI.** Elegir claves en español o inglés y alinear todo el stack (parsing → modelos → persistencia).

8. **Los contratos son límites.** Nunca referencian entidades de dominio. Usan primitivos e interfaces simples.

### Clarificaciones recomendadas antes de continuar

| Pregunta | El propietario decide |
|----------|----------------------|
| ¿Dónde deben vivir las entidades de dominio? | Mover a `domain/` |
| ¿Qué forma debe tener la salida de AI parseada? | Alinear con schema de persistencia |
| ¿`difficultyLabels` y `assistantContext` deben estar en el contrato o derivarse internamente? | Definir fuente de verdad |
| ¿Por qué el controlador no llama al caso de uso? | Corregir el flujo desconectado |

---

**Fin de auditoría.**
