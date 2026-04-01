# 1. Crear usuarios PRO en Firestore
  node synthetic/seed.js

  # 2. Phase 1 — 2 usuarios concurrentes
  node synthetic/runner-concurrent.js 1

  # 3. Phase 2 — 5 usuarios concurrentes
  node synthetic/runner-concurrent.js 2

  # 4. Phase 3 — 10 usuarios concurrentes
  node synthetic/runner-concurrent.js 3

  # --- LOAD EXPERIMENT ---

  # 5. Crear 100 usuarios PRO en Firestore (si no existen)
  node synthetic/seed.js

  # 6. Ejecutar el experimento de carga (batches 10 / 50 / 100)
  node synthetic/runner-experiment.js 2>experiment.log > experiment_results.ndjson

  # 7. Instalar dependencias del análisis (solo la primera vez)
  pip install -r synthetic/analysis/requirements.txt

  # 8. Generar scatter plots
  python synthetic/analysis/analyze.py experiment_results.ndjson

  # Los gráficos se guardan en synthetic/analysis/output/
  #   latency_scatter.png
  #   cost_scatter.png
  #   cost_vs_latency.png