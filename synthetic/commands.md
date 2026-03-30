# 1. Crear usuarios PRO en Firestore
  node synthetic/seed.js

  # 2. Phase 1 — 2 usuarios concurrentes
  node synthetic/runner-concurrent.js 1

  # 3. Phase 2 — 5 usuarios concurrentes
  node synthetic/runner-concurrent.js 2

  # 4. Phase 3 — 10 usuarios concurrentes
  node synthetic/runner-concurrent.js 3