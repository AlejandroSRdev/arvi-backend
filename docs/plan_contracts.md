Dominio de flujos críticos (profundo, estratégico)

Aquí es donde usted se diferencia.

Flujos que DEBE dominar (coincido al 100 % con su intuición)
1️⃣ IA — El núcleo

Endpoint:
POST /api/ai/chat

Debe poder explicar:

cómo entra la request

cómo se valida (energía, trial, límites)

cómo se enruta el prompt

cómo se decide persistir o no

cómo se controla coste / tokens

qué ocurre si falla el proveedor IA

📌 Este es su endpoint estrella.

2️⃣ Escritura en Firestore — Persistencia real

Endpoints típicos:

/api/habits/series

/api/execution-summaries

/api/user/profile

Debe poder explicar:

qué se escribe

desde qué use case

por qué el controlador NO toca la base de datos

cómo se protege la consistencia

qué ocurre ante error de escritura

📌 Esto demuestra arquitectura hexagonal real, no teoría.

3️⃣ Webhooks — Producción de verdad

Endpoint:
POST /api/webhooks

Debe poder explicar:

por qué no usa auth estándar

cómo se valida la firma

qué eventos procesa

cómo evita duplicados

qué ocurre si llega un evento inesperado

📌 Quien domina webhooks, ha estado en producción.