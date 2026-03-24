# technical-debt.md  
## Conscious Technical Debt

This file documents **explicitly acknowledged technical debt** in the Arvi Backend Service.

Conscious technical debt refers to known architectural or implementation limitations that are intentionally accepted under current constraints and will be addressed when justified by operational pressure.

Only deliberate and documented compromises belong here.

---

## 1️⃣ Domain Errors Returned as Generic HTTP 500

**Current Behavior**

- `User.create` throws plain `Error`.
- Errors do not extend `BaseError`.
- `errorMiddleware` maps them to:

```json
HTTP 500
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Unexpected error occurred"
}
```

### Impact

- **Indistinguishable Errors**: Domain validation failures are treated the same as real server crashes.
- **Lack of Semantic Distinction**: No differentiation between client errors (e.g., 400 / 422) and server errors (e.g., 500).
- **Reduced Observability**: Limited visibility into the nature of errors at the HTTP layer.

### Reason for Acceptance

- **Phase**: Early operational phase.
- **Focus**: Priority is on gaining real usage exposure rather than immediate semantic refinement.

### Planned Improvement

Introduce `DomainError` extending `BaseError`.  
Map domain violations to proper HTTP status codes.


## 2026-03-03 — Stripe Checkout Session Technical Debt

### 1. Potential Race Condition — Stripe Customer Creation
If two concurrent checkout requests are executed for the same user without a persisted `stripeCustomerId`, multiple Stripe customers could be created.
- Needs transactional protection or repository-level locking.
- Consider atomic "create-if-null" pattern.

### 2. Idempotency Key Scope
Current idempotency key: `checkout:{userId}:{planKey}`
- Prevents duplicate concurrent sessions.
- May be too rigid for long-term retries (e.g., user retries days later).
- Consider scoping idempotency to short-lived attempts (timestamp or UUID).

### 3. Missing Domain Policy on Active Subscriptions
No explicit domain rule prevents:
- Creating checkout for already active subscription.
- Re-purchasing same plan unintentionally.

A domain-level validation policy should define allowed transitions (e.g., BASE → PRO, PRO → PRO, etc.).

### Out-of-Order Event Processing

Current webhook logic assumes event arrival order reflects real subscription state progression.

Scenario risk:
1. `invoice.paid` (activation)
2. `customer.subscription.deleted` (cancellation)
3. Delayed `invoice.paid` arrives afterward

Because state transitions are applied based on processing order (not event creation timestamp),
a delayed event could incorrectly re-activate a canceled subscription.

Stripe usually delivers events in order, but this is not strictly guaranteed.

Future hardening:
- Compare event `created` timestamp before applying state change.
- Or persist and validate subscription status transitions explicitly.
- Or enforce monotonic state transitions in domain policy.


## 2026-03-24 — Synthetic Monitoring Runners Technical Debt

### 1. Duplicación total de boilerplate entre runners

`runner-limits.js` y `runner-typical.js` duplican completamente: HTTP client, assertions (`assertStatus`, `assertString`, `assertArray`, `assertEnum`, `assertNotEqual`), `sleep`, `SERIES_BODY` y la estructura del `main`.
- Cualquier cambio en la firma de una assertion o en el cliente HTTP requiere modificar dos archivos.
- Escalar a un tercer runner multiplica el problema.

### 2. Sleep embebido en funciones de escenario (`runner-typical`)

Los waits de 5 minutos entre ciclos viven dentro del cuerpo de `runScenario1` y `runScenario2`.
- Un escenario no debería conocer el timing del siguiente.
- Dificulta hacer las esperas configurables o saltarlas en desarrollo.

### 3. Duración total incompatible con cadencias cortas de monitoreo (`runner-typical`)

El runner tarda mínimo 10 minutos en completarse (dos waits de 5 min).
- Si el orquestador dispara cada 5 minutos, se generan ejecuciones solapadas.
- Usuarios únicos por `Date.now()` evitan colisiones de datos, pero no duplican costos de AI provider y Firestore.
- No existe ningún guard contra ejecuciones concurrentes.

### 4. Aserción laxa en S3.1 de `runner-limits`

La verificación del rechazo de la 6ª serie acepta cualquier 4xx:
```js
if (res.status < 400 || res.status >= 500)
```
Si el sistema devuelve 401 o 404 por cualquier razón ajena al límite, el check pasa igualmente.
- Debería verificarse el código de error semántico del body, no solo el HTTP status.

### 5. Cleanup no afecta el `exitCode` en ninguno de los runners

Si `runCleanup()` lanza una excepción, el proceso termina con `exitCode = 0` si los escenarios pasaron.
- Un cleanup fallido significa datos huérfanos en Firestore acumulándose por cada ejecución.
- El orquestador no tiene forma de distinguir un run limpio de uno con datos residuales.