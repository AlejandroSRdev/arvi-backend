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