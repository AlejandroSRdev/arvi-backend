src/
 └── errors/
      ├── base/
      │     BaseError.js
      │
      ├── domain/
      │     InsufficientEnergyError.js
      │     TrialAlreadyUsedError.js
      │     MaxActiveSeriesReachedError.js
      │     index.js
      │
      ├── application/
      │     ValidationError.js
      │     AuthenticationError.js
      │     AuthorizationError.js
      │     NotFoundError.js
      │     index.js
      │
      ├── infrastructure/
      │     InfrastructureError.js
      │     AITemporaryUnavailableError.js
      │     AIProviderFailureError.js
      │     DataAccessFailureError.js
      │     TransactionFailureError.js
      │     UnknownInfrastructureError.js
      │     index.js
      │
      └── index.js