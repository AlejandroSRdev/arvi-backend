Quiero diseñar un experimento de carga para evaluar el comportamiento real de una feature de IA en mi backend bajo distintos niveles de concurrencia.

Objetivo del experimento:
Entender cómo evolucionan la **latencia** y el **coste por request** a medida que aumenta la concurrencia, y detectar puntos de degradación del sistema.

El experimento tendrá tres niveles:

* batch_10 → 10 requests concurrentes
* batch_50 → 50 requests concurrentes
* batch_100 → 100 requests concurrentes

Cada batch:

* Se ejecuta de forma aislada (sin solapamiento)
* Tiene un identificador único (batch_id)
* Ejecuta la misma feature (create_action)
* Registra cada request de forma independiente (no agregada)

Cada request debe producir:

* latency (pipeline completo)
* cost (suma de todas las llamadas LLM del pipeline)
* status (success / failure)
* batch_id
* concurrency_level

Lo que quiero construir:

1. Un runner que permita ejecutar estos batches con concurrencia real y controlada
2. Un sistema de registro de métricas consistente por request (latencia + coste)
3. Una base de datos de ejecución que permita luego analizar:

   * distribución de latencia (no medias)
   * coste por request
   * coste por request exitosa
   * comportamiento bajo carga

Lo que quiero observar:

* Cómo cambia la distribución de latencia al pasar de 10 → 50 → 100
* Si el coste por request se mantiene estable o se ve afectado por la concurrencia
* Si aparecen efectos emergentes:

  * retries
  * outliers
  * incremento de variabilidad
  * degradación no lineal

Puntos críticos:

* Evitar métricas agregadas engañosas (medias globales)
* Cada request debe ser un punto independiente
* Separar claramente requests exitosas de fallidas
* El experimento debe ser reproducible y comparable entre batches

Tu tarea:
Ayudarme a definir con precisión:

* cómo estructurar el runner
* cómo garantizar concurrencia real
* cómo asegurar que las métricas son fiables
* qué decisiones son críticas para que el experimento tenga validez

No quiero código todavía. Quiero claridad estructural y decisiones correctas.