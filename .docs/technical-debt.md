# Technical Debt Register

This document tracks consciously accepted technical debt.
Its purpose is to:
- prevent architectural drift
- avoid silent compromises
- enable future refactors with clear rationale

---

## TD-001 — Missing Typed Infrastructure Errors

**Status:** Accepted  
**Date:** 2026-01-19  
**Area:** Infrastructure / Error Handling  
**Severity:** Medium  
**Category:** Architecture / Observability  

### Description
The infrastructure layer does not currently define explicit, typed technical errors.
Controllers throw generic `Error` instances with a string-based `code` property,
and the `errorMapper` relies on convention rather than semantic typing.

### Current Impact
- Reduced semantic clarity for technical failures
- No explicit distinction between:
  - transient infrastructure failures
  - external service errors
  - internal bugs
- Limited observability and error classification

### Justification
- The system is currently under architectural analysis and stabilization
- Introducing typed infrastructure errors would require touching multiple adapters
- Priority is given to understanding core flows and validating architectural direction

### Future Resolution Criteria
Introduce explicit infrastructure-level error types, such as:
- `HttpValidationError`
- `ExternalServiceError`
- `DatabaseError`

Refactor `errorMapper` to map based on error types rather than string codes.

### Activation Condition
This debt should be addressed when one or more of the following occurs:
- Introduction of RAG or retry mechanisms
- Increased reliance on external services
- Addition of advanced observability or monitoring
