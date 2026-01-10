# AI Agent-Driven Backend System

Technical documentation for a production-grade backend system implementing LLM-based agent orchestration with hexagonal architecture.

## System Overview

Node.js backend service (Express) implementing a request-driven AI orchestration layer. The system coordinates multiple LLM providers (OpenAI GPT-4o-mini, Google Gemini 2.0/2.5) with resource management, function-type based model selection, and token-cost optimization.

**Core characteristics:**
- Backend-driven architecture (API-first)
- Hexagonal/Ports & Adapters pattern
- Synchronous request-response flow
- Multi-provider LLM abstraction
- Dynamic model selection via policy layer
- Usage-based resource metering (energy system)

## Architecture Layers

### Domain Layer (`domain/`)

Pure business logic with zero external dependencies.

**Entities:** `Energy.js`, `User.js`, `Plan.js`, `Subscription.js`, `Trial.js`
- Immutable state validation functions
- Pure predicates (e.g., `canConsumeEnergy(actual, required)`)

**Policies:** `ModelSelectionPolicy.js`, `EnergyPolicy.js`, `PlanPolicy.js`
- Function-type to model mapping (`MODEL_MAPPING`)
- Deterministic model selection based on task characteristics
- Configuration includes: model ID, temperature, max_tokens, forceJson flag

**Use Cases:** `GenerateAIResponse.js`, `ConsumeEnergy.js`, `ValidatePlanAccess.js`
- Orchestration logic for AI call lifecycle:
  1. Pre-call energy validation
  2. Model selection via policy
  3. Provider invocation
  4. Post-call energy deduction
  5. Response normalization

**Ports (Interfaces):** `IAIProvider.js`, `IEnergyRepository.js`, `IUserRepository.js`
- Abstract contracts for infrastructure adapters
- Dependency inversion boundary

### Application Layer (`domain/use-cases/`)

Coordinates domain entities and policies with infrastructure adapters. Implements transactional boundaries and error propagation.

### Infrastructure Layer (`infrastructure/`)

#### AI Adapters (`infrastructure/ai/`)

Concrete implementations of `IAIProvider`:

**GeminiAdapter** (`gemini/GeminiAdapter.js`):
- Google Generative AI SDK integration
- Token estimation: `text.length / 3.7`
- Energy calculation: `ceil((response_tokens + prompt_tokens × 0.30) / 100)`
- Message format conversion (system/user/assistant → Gemini parts)
- Supports `responseMimeType: 'application/json'` for structured output

**OpenAIAdapter** (`openai/OpenAIAdapter.js`):
- OpenAI SDK integration
- Accurate token counting via `completion.usage.total_tokens`
- Energy consumption: **always 0** (GPT used only for JSON conversion tasks, not user-facing content generation)
- Native `response_format: { type: 'json_object' }` support

#### Persistence (`infrastructure/persistence/firestore/`)

Firestore adapters implementing repository interfaces:
- `FirestoreUserRepository`: User CRUD + subscription state
- `FirestoreEnergyRepository`: Energy balance + consumption log
- Firebase Admin SDK for server-side auth validation

#### HTTP Layer (`infrastructure/http/`)

**Controllers** (`controllers/AIController.js`):
- HTTP adapter: `(req, res) → use case → (json response)`
- Input validation (message format, function_type existence)
- Error translation to HTTP status codes
- No business logic

**Routes** (`routes/ai.routes.js`):
- Endpoint registration
- Middleware chaining (auth → rate limit → validation → controller)

**Middleware**:
- `authenticate.js`: Firebase token validation
- `rateLimiter.js`: Express-rate-limit (60 req/min for AI endpoints)
- `errorHandler.js`: Global error mapper
- `validateInputSize.js`: Request body size limits

## AI Agent Flow

### Request Entry Point

```
POST /api/ai/chat
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "function_type": "execution_summary_creative"
}
```

### Orchestration Logic

**AIController → GenerateAIResponseWithFunctionType Use Case:**

1. **Function Type Validation**
   - Verify `function_type` exists in `MODEL_MAPPING`
   - Fail fast with 400 if invalid

2. **Model Selection** (ModelSelectionPolicy)
   - Map `function_type` → `{model, temperature, maxTokens, forceJson}`
   - Examples:
     - `home_phrase` → `gemini-2.0-flash`, temp=0.8, 100 tokens
     - `execution_summary_creative` → `gemini-2.5-pro`, temp=0.7, 2000 tokens
     - `json_conversion` → `gpt-4o-mini`, temp=0.0, forceJson=true

3. **Pre-Call Energy Validation**
   - `EnergyRepository.getEnergy(userId)`
   - Assert `energy.actual > 0`
   - Fail with `INSUFFICIENT_ENERGY` error if depleted

4. **Provider Invocation**
   - Select adapter based on model prefix (`gemini-*` → GeminiAdapter, `gpt-*` → OpenAIAdapter)
   - Provider transforms messages to native SDK format
   - Execute blocking API call (no streaming)
   - Parse response + extract token count

5. **Post-Call Energy Deduction**
   - Calculate consumption based on provider formula
   - Validate sufficient balance: `canConsumeEnergy(actual, required)`
   - Atomic update: `updateEnergy(userId, {actual: new_value, consumoTotal: total})`

6. **Response Normalization**
   - Standardized output: `{content, model, tokensUsed, energyConsumed}`
   - Log consumption metrics
   - Return to controller

### Prompt Structure

**Client responsibility:** Frontend constructs full prompt including:
- System instructions
- Context (user history, preferences)
- Task-specific guidance
- Output format requirements

**Backend responsibility:** Executes single-turn inference without prompt manipulation.

### Function Calling / Tool Use

Not currently implemented. System operates in completion-only mode. Potential extension points:
- Define tools in domain policies
- Parse structured function calls from model output
- Execute tool logic in dedicated use cases
- Feed results back to model in multi-turn flow

### Output Validation & Normalization

**Gemini:**
- Text extraction: `result.response.text()`
- JSON mode: Parse and validate schema externally (frontend responsibility)

**OpenAI:**
- Content: `completion.choices[0].message.content`
- JSON mode: Built-in validation via `response_format`

**Post-processing:**
- No content filtering or transformation in backend
- Token counts logged for cost analysis
- Energy metrics persisted in `Energy.consumoTotal` field

## External LLM Integration

### Provider Abstraction

`IAIProvider` interface decouples domain logic from vendor SDKs:

```javascript
async callAI(userId, messages, {model, temperature, maxTokens, forceJson})
  → {content, model, tokensUsed, energyConsumed}
```

### Configuration Management

**Secrets:** `.env` file (not committed)
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON path)

**Model Registry:** Centralized in `ModelSelectionPolicy.js`
- Adding new models: Extend `MODEL_MAPPING` object
- Changing defaults: Update policy without touching adapters

### Error Handling

**Provider failures:**
- Network errors: Propagate as 503 Service Unavailable
- Rate limit (429): Caught and logged, return 429 to client
- Invalid API key: Fatal error, crash on startup (fail-fast)

**Retry logic:** Not implemented (clients responsible for idempotent retries)

## Token Management & Cost Control

### Token Accounting

**Gemini:**
- Estimation-based: `tokens ≈ text.length / 3.7`
- Logged for monitoring but not billed

**OpenAI:**
- Exact count from API: `completion.usage.{prompt_tokens, completion_tokens, total_tokens}`

### Energy System (Internal Metering)

**Rationale:** Abstract away actual LLM costs into user-facing "energy" units.

**Calculation:**
- Gemini: `ceil((response_tokens + prompt_tokens × 0.30) / 100)`
- OpenAI: 0 (reserved for non-content tasks like JSON conversion)

**Replenishment:**
- Daily recharge to plan-defined maximum
- Subscription tier determines `maxEnergy` value

**Enforcement:**
- Pre-call validation prevents overages
- Atomic decrements prevent race conditions

### Latency Considerations

**Blocking calls:** All LLM requests are synchronous (async/await)
- Typical p50 latency: 800ms - 2s
- Timeout: Express default (2 min)

**Optimization strategies:**
- Model selection prioritizes `flash` variants for low-latency tasks
- `maxTokens` limits prevent runaway generation
- Rate limiting prevents cascade failures under load

**Streaming:** Not implemented (would require SSE or WebSocket infrastructure)

## Error Handling & Observability

### Error Propagation

1. **Domain errors:** Throw typed errors (`ValidationError`, `InsufficientEnergyError`)
2. **Use case layer:** Catch domain errors, add context, rethrow
3. **Controller layer:** Catch all, map to HTTP status:
   - `ValidationError` → 400
   - `InsufficientEnergyError` → 402 (Payment Required)
   - `ProviderError` → 503
   - Unknown → 500
4. **Global middleware:** `errorHandler.js` logs stack, sanitizes response

### Logging

**Console-based logging** (`shared/logger.js`):
- Energy transactions: `[Gemini Energy] Prompt: 120t, Respuesta: 450t → Energía: 6`
- Model invocations: `[Gemini] Llamando modelo: gemini-2.5-pro`
- Errors: Full stack traces in development mode

**Production logging:**
- Integrate structured logger (Winston, Pino) at infrastructure boundary
- Log correlation IDs (e.g., `userId`, `requestId`)
- Metrics export to monitoring system (Datadog, CloudWatch)

### AI Behavior Monitoring

**Metrics to track:**
- Tokens/request distribution by `function_type`
- Energy consumption trends (detect runaway generation)
- Error rates by provider
- Latency percentiles by model

**Anomaly detection:**
- Alert on sudden energy consumption spikes
- Monitor token/energy ratio for drift (indicates estimation error)
- Track provider error rates (API stability)

**Content quality:**
- Not measured backend-side (requires human eval or LLM-as-judge)
- Frontend can log user feedback (thumbs up/down) for offline analysis

## Testing Strategy

### Unit Tests

**Domain layer:**
- Pure function tests: `canConsumeEnergy(10, 5) === true`
- Policy validation: `getModelConfig('invalid_type')` throws error
- Entity state transitions

**Mocking:**
- Use cases: Mock repository interfaces
- Controllers: Mock use cases
- No mocking of domain logic (pure functions need no mocks)

### Integration Tests

**AI provider adapters:**
- Use real API keys in CI with small requests
- Verify response structure contract
- Test error handling (invalid keys, malformed requests)

**Energy flow:**
- Seed test user with known energy balance
- Execute AI call
- Assert energy decreased by expected amount
- Verify Firestore state matches

**End-to-end:**
- Spin up server in test mode
- Send `POST /api/ai/chat` with known input
- Assert 200 response with valid structure
- Verify side effects (energy deduction, logs)

### Test Doubles

**Provider mocking:**
```javascript
class MockAIProvider extends IAIProvider {
  async callAI(userId, messages, options) {
    return {
      content: 'mocked response',
      model: options.model,
      tokensUsed: 100,
      energyConsumed: 1
    };
  }
}
```

**Repository stubs:**
- In-memory implementations of `IEnergyRepository`, `IUserRepository`
- Avoid Firestore emulator for faster unit tests

## Deployment Context

**Target environment:** Cloud container (Docker) or serverless (Cloud Run, Lambda)

**Configuration:**
- Environment variables for secrets
- Firebase Admin SDK initialized via service account JSON
- No local state (stateless for horizontal scaling)

**Health checks:** `GET /health` returns service status + version

**Scaling considerations:**
- Stateless design enables horizontal scaling
- Firebase handles concurrent read/write locking
- LLM API rate limits may require request queuing under high load

**Cloud-agnostic:**
- No vendor lock-in (Express + Firebase Admin SDK portable)
- Can deploy to AWS, GCP, Azure with minimal changes
- Database swap: Replace Firestore adapters with MongoDB/PostgreSQL implementations

## Key Design Decisions

1. **Hexagonal architecture:** Enables testing without external dependencies, clean domain logic
2. **Backend as thin orchestrator:** Frontend owns prompt engineering, multi-turn logic
3. **Energy abstraction:** Decouples LLM costs from billing model
4. **Synchronous flow:** Simpler reasoning, acceptable latency for current scale
5. **Policy-based model selection:** Centralized control, easy A/B testing
6. **Provider parity:** Both adapters implement same interface (swap without code changes)
7. **No streaming:** Reduces complexity, sufficient for current use cases

## Dependencies

- Runtime: Node.js 18+
- Framework: Express 4.19
- LLM SDKs: OpenAI 4.20, @google/generative-ai 0.1
- Database: Firebase Admin SDK 13.6
- Security: Helmet, express-rate-limit
- Payment processing: Stripe 16.6 (separate webhook flow)
