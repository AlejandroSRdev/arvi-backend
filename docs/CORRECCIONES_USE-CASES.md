# Correcciones Arquitectónicas Pendientes — Use-Cases (Hexagonal)

**Proyecto**: Backend
**Fecha**: 2025-12-28
**Estado**: Migración a arquitectura hexagonal en progreso

---

## Objetivo del documento

Este documento recoge **ajustes estructurales recomendados** tras la revisión de los use-cases actuales.
No implica refactorización funcional ni cambios de comportamiento, únicamente **reubicación conceptual** para reforzar la pureza de la arquitectura hexagonal.

El sistema es **funcional y correcto** en su estado actual. Las correcciones aquí descritas son de **clasificación arquitectónica**, no de diseño ni de lógica.

---

## Diagnóstico global

* Los use-cases están bien definidos y cumplen su rol principal.
* No existen dependencias directas a infraestructura.
* La inyección de dependencias es correcta.

El único patrón repetido a corregir es el siguiente:

> **Existen políticas de negocio reutilizables implementadas dentro de archivos ubicados en `domain/use-cases`.**

Esto provoca:

* Dependencias entre use-cases
* Ambigüedad semántica (use-case vs policy)

---

## Corrección estructural principal

### ❌ Situación actual

Archivo:

```
domain/use-cases/ValidatePlanAccess.js
```

Contenido real:

* Determinación de plan efectivo (freemium / trial / suscripción)
* Validación de acceso a features
* Validación de límites de uso
* Reset lazy de contadores

Aunque el archivo se denomina *use-case*, su contenido corresponde a **reglas de negocio reutilizables**, no a una acción del sistema.

Como consecuencia:

* Otros use-cases lo importan
* Se generan dependencias laterales entre use-cases

---

### ✅ Corrección recomendada (sin cambiar lógica)

Reclasificar el contenido como **policies de dominio**.

Nueva ubicación sugerida:

```
domain/policies/PlanAccessPolicy.js
domain/policies/PlanLimitPolicy.js   (opcional, si se separa)
```

Funciones a mover:

* `determineEffectivePlan`
* `validateFeatureAccess`
* `validateWeeklySummariesLimit`
* `validateActiveSeriesLimit`

---

## Ajuste de imports

Una vez movidas las policies:

### Antes

```js
import { determineEffectivePlan } from './ValidatePlanAccess.js';
```

### Después

```js
import { determineEffectivePlan } from '../policies/PlanAccessPolicy.js';
```

Resultado:

* Ningún use-case importa otro use-case
* Los use-cases solo dependen de:

  * entities
  * policies
  * ports

---

## Casos revisados

### ConsumeEnergy

* Correcto en responsabilidades
* Solo afectado por la dependencia a `determineEffectivePlan`
* Se corrige automáticamente al mover la policy

### ActivateTrial

* Funcionalmente correcto
* Contiene reglas de negocio válidas en el use-case
* Refinamiento futuro opcional (no requerido ahora): mover reglas a `TrialPolicy`

### GenerateAIResponse

* Arquitectura correcta
* Separación clara dominio / infraestructura
* No requiere cambios

### ProcessSubscription

* Muy buen aislamiento de lógica de negocio
* No conoce Stripe ni HTTP
* Cambios de estado aceptables en esta fase

---

## Estado tras aplicar correcciones

* Arquitectura hexagonal coherente
* Sin dependencias entre use-cases
* Dominio con jerarquía clara:

  * Use-cases → orquestación
  * Policies → reglas
  * Entities → invariantes

No se recomienda realizar más refactorizaciones hasta completar:

* cableado en `server.js`
* validación end-to-end

---

## Nota final

Estas correcciones **no son bloqueantes**.
El sistema actual es estable y válido.

Se aplican para:

* mayor claridad mental
* mantenibilidad a largo plazo
* defensa arquitectónica en revisiones técnicas

---

**Documento de control arquitectónico**
