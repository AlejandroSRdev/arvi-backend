Contexto:
Tenemos un backend con dominio fuerte. La dificultad de las acciones es una invariante del dominio y está definida así:

export const Difficulty = Object.freeze({
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
});

El controller ya NO acepta `difficultyLabels` desde la request.
El error actual es que el LLM devuelve dificultades inválidas o `undefined` porque el prompt usaba labels humanos externos.

Objetivo del refactor:
Refactorizar ÚNICAMENTE el archivo `CreativeHabitSeriesPrompt` (primera pasada creativa) para que:
1. Importe el enum `Difficulty` desde el dominio.
2. Enumere explícitamente en el prompt SOLO los valores válidos de dificultad (`baja`, `media`, `alta`).
3. El LLM elija una de esas opciones según la acción creada.
4. NO usar labels enviados por el cliente.
5. Mantener el resto del prompt lo más intacto posible (mínimos cambios).
6. El output del LLM debe contener dificultades ya alineadas con el dominio.

Restricciones:
- No modificar controllers.
- No modificar use-cases.
- No modificar schema ni persistencia.
- No introducir nuevos parámetros de entrada.
- No cambiar el formato general del prompt salvo lo necesario para la dificultad.

Opcional:
Puedes añadir una breve aclaración semántica en el prompt (por idioma) para ayudar al LLM, pero SIN cambiar los valores permitidos.

Entrega:
Devuelve el archivo `CreativeHabitSeriesPrompt` refactorizado completo.
Explica brevemente (2–3 bullets) qué se ha cambiado y por qué.
