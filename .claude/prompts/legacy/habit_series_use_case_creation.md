You are acting as a Senior Backend Engineer implementing a missing application use case.

Context:
- This backend follows a layered architecture (Domain / Application / Infrastructure).
- All required components already exist EXCEPT the orchestration use case.
- AIExecutionService is an application service, NOT an endpoint.
- Do NOT refactor existing services, policies, or repositories.

Objective:
Implement the application use case `CreateHabitSeriesUseCase` to orchestrate the full flow of habit series creat
ion via AI.

Scope:
- Only add or complete logic inside the existing use case file: CreateHabitSeriesUseCase.
- You may import and call existing services, policies, and repositories.
- Do NOT modify controllers, repositories, or AIExecutionService internals.

Required flow (must be implemented exactly in this order):

1. Input:
   - userId
   - request data already provided by the controller

2. Pre-AI validation (mandatory):
   - Validate plan and feature access using existing PlanPolicy
   - Validate active habit series limit using existing HabitSeriesPolicy
   - Validate available energy using existing EnergyPolicy
   - If any validation fails, abort immediately and propagate the error

3. AI execution:
   - Call AIExecutionService with the following prompts (in order):
     - CreativeHabitSeriesPrompt
     - JsonSchemaHabitSeriesPrompt
     - StructureHabitSeriesPrompt
   - Receive structured JSON output

4. Post-AI validation:
   - Validate that the AI output matches the expected schema:
     {
       titulo: string,
       descripcion: string,
       acciones: [
         { nombre: string, descripcion: string, dificultad: string }
       ]
     }
   - If validation fails, throw an application-level error
   - Do NOT persist invalid data

5. Persistence:
   - Persist the validated series using IHabitSeriesRepository.createFromAI(userId, seriesData)
   - This must be executed exactly once

6. Side effects:
   - Increment the user's active series counter using the existing user repository
   - Do NOT duplicate energy consumption (AIExecutionService already handles it)

7. Output:
   - Return an explicit success result including:
     - seriesId
     - series title
     - confirmation that the series was created

Constraints:
- Do NOT introduce new endpoints
- Do NOT refactor existing files
- Do NOT add cosmetic changes
- Preserve all existing public APIs
- Do NOT add new business rules beyond what is described

This task fills a missing orchestration layer only.