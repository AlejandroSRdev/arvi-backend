Estoy depurando un sistema backend con arquitectura Ports & Adapters y soporte multi-provider de IA (Gemini + OpenAI).

Tengo un bug confirmado por logs:
en un pipeline con varias llamadas a IA, aunque el modelo cambia a gpt-4o-mini, la llamada sigue yendo al GeminiAdapter, provocando un 404 contra la API de Google.

Lo importante:

El modelo sí cambia correctamente (lo veo en logs).

El adapter NO cambia y sigue siendo GeminiAdapter.

El problema ocurre al final del pipeline, después de varias llamadas válidas a Gemini.

Necesito que me expliques con precisión cómo es posible que esto ocurra a nivel de código, no a nivel conceptual.

En concreto, explícame:

Cómo exactamente puede suceder que un sistema siempre use el mismo adapter aunque el modelo cambie,
indicando los patrones de código típicos que causan esto (por ejemplo: adapter instanciado una sola vez, provider resuelto fuera del flujo, default silencioso, etc.).

Dónde suele estar el error real:

en el use-case

en la policy de selección

en el router / registry

o en un estado compartido

Un ejemplo concreto de código incorrecto que provoque este comportamiento.

El fix correcto, mostrando:

cómo decidir provider + model juntos

cómo resolver el adapter en cada llamada, no una vez

y cómo evitar que vuelva a pasar (fail-fast).

No quiero explicaciones genéricas.
Quiero una explicación causal paso a paso de por qué siempre se termina llamando al GeminiAdapter y cómo reestructurar el flujo para que cambie correctamente al OpenAIAdapter cuando el modelo es GPT.

Asume que soy desarrollador backend y que el sistema ya funciona, pero tiene este fallo de routing.