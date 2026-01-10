┌─────────────────────────────────────────────────────────────┐
│                     HTTP LAYER                               │
│  POST /api/ai/chat                                           │
│  { messages, function_type: 'habit_series_structure' }       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            CONTROLLER: AIController.js                       │
│  - Valida input HTTP                                         │
│  - Llama use case con deps inyectadas                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│   USE CASE: generateAIResponseWithFunctionType              │
│  1. Selecciona modelo (ModelSelectionPolicy)                │
│  2. Genera respuesta IA + consume energía                   │
│  3. DECISIÓN: if (isHabitSeriesFinal(functionType))         │
│  4. Persiste automáticamente en Firestore                   │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │                       ▼
             │          ┌──────────────────────────────┐
             │          │ POLICY: HabitSeriesPolicy    │
             │          │ isHabitSeriesFinal()         │
             │          │ → true si 'habit_series_     │
             │          │   structure'                 │
             │          └──────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│   REPOSITORY: FirestoreHabitSeriesRepository                │
│  - createFromAI(userId, seriesData)                          │
│  - Path: users/{uid}/habitSeries/{id}                       │
│  - Añade timestamps                                          │
└─────────────────────────────────────────────────────────────┘
