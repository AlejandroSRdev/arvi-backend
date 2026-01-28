Contexto:
Tenemos un endpoint POST /api/habits/series ya funcional, con múltiples logs existentes en:
- AIRouter
- Adapters de IA (Gemini / OpenAI)
- Logs de consumo de energía
- Log final de éxito o error del controller

Actualmente los logs muestran bien:
- Routing de IA
- Modelos usados
- Tokens y energía
- Log final [SUCCESS] o [ERROR]

Objetivo:
Mejorar la observabilidad del endpoint AÑADIENDO logs faltantes para tener trazabilidad completa del flujo, SIN eliminar ni modificar los logs existentes.

Restricciones estrictas:
- NO eliminar ningún console.log existente.
- NO cambiar la lógica de negocio.
- NO cambiar contratos.
- NO introducir librerías de logging (seguir usando console.log / console.error).
- NO rediseñar arquitectura.
- NO añadir logs redundantes.
- Mantener el mismo estilo visual de logs (prefijos entre corchetes).

---

Logs que deben añadirse (en este orden lógico):

1) CONTROLLER — inicio del proceso
Archivo: controller del endpoint POST /api/habits/series

Añadir un log AL PRINCIPIO del handler que indique claramente el inicio del flujo.
Debe incluir:
- userId (uid)
- language
- keys presentes en testData (solo las claves, no los valores)

Formato orientativo:
[START] [Habit Series] Request received for user <uid>, language=<lang>, testKeys=[...]

---

2) USE-CASE — inicio del caso de uso
Archivo: CreateHabitSeriesUseCase

Añadir un log al inicio del método execute/run:
Formato:
[USE-CASE] [Habit Series] CreateHabitSeries started for user <uid>

---

3) SCHEMA VALIDATION — antes y después de validar output de IA
Archivo: donde se valida el output final contra el schema (Zod / validator actual)

Añadir:
- Un log ANTES de validar, indicando:
  - que comienza la validación
  - nombre del schema (si existe)
  - número de acciones recibidas (si está disponible)

Formato:
[SCHEMA] [Habit Series] Validating AI output against schema

- Un log DESPUÉS si la validación es correcta:
[SCHEMA] [Habit Series] Schema validation OK

- En caso de error:
console.error con:
[SCHEMA ERROR] [Habit Series] Schema validation failed: <mensaje>

(NO imprimir el JSON completo)

---

4) REPOSITORY — persistencia de la serie
Archivo: repositorio que guarda la serie de hábitos en Firestore

Añadir:
- Log antes de guardar:
[REPOSITORY] [Habit Series] Saving series for user <uid>

- Log después de guardar correctamente:
[REPOSITORY] [Habit Series] Series saved with id <seriesId>

- Log en caso de error:
console.error:
[REPOSITORY ERROR] [Habit Series] Error saving series: <mensaje>

---

5) CONTROLLER — mantener logs existentes
El log final de éxito y el de error YA EXISTEN.
NO deben eliminarse ni duplicarse.
Solo asegurarse de que conviven con los nuevos logs.

---

Entrega esperada:
- Implementar los logs descritos exactamente.
- Mantener todos los logs actuales intactos.
- No añadir logs fuera del flujo del endpoint de hábitos.
- No modificar ningún comportamiento funcional.
- No introducir nuevos helpers ni utilidades.

Devuelve solo el diff o resumen de cambios realizados por archivo.
