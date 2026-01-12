# Backend HTTP Contracts Inventory

## Executive Summary

This document is the authoritative inventory of all HTTP contracts exposed by the backend.

Its purpose is to provide a precise, implementation-faithful view of every existing endpoint,
including routes, inputs, outputs, authentication requirements, and explicitly defined errors.

This inventory is generated through static code analysis only.
No behavior is inferred, no contracts are assumed, and no frontend knowledge is required.

The document is used to:
- Verify backend behavior in isolation
- Detect contract mismatches between frontend and backend
- Support production debugging and regression analysis
- Serve as technical evidence in architectural reviews and interviews

---

## Table of Contents

1. [System Health & Metadata](#system-health--metadata)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Energy Management](#energy-management)
5. [Habit Series](#habit-series)
6. [AI Services](#ai-services)
7. [Payments & Stripe Integration](#payments--stripe-integration)
8. [Webhooks](#webhooks)
9. [Execution Summaries](#execution-summaries)

---

## System Health & Metadata

This section contains endpoints for system health checks and API metadata discovery. These endpoints are unauthenticated and provide basic operational status and route inventory.

### [GET] /health    STATUS: OK

Controller:

File: server.js
Method: Anonymous inline function (line 151)
Use case:

Name: Not applicable
File: Not applicable
Authentication:

Not required
Input:

Expected fields: None
Output (200):

Returned fields:
status: string
timestamp: string
service: string
version: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: Not evident
Observations:

Visible validations: None
Persistence: Not applicable
Detectable couplings: None (standalone endpoint with no dependencies)
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

### [GET] /   STATUS: OK

Controller:

File: server.js
Method: Anonymous inline function (line 160)
Use case:

Name: Not applicable
File: Not applicable
Authentication:

Not required
Input:

Expected fields: None
Output (200):

Returned fields:
message: string
version: string
endpoints: object
endpoints.health: string
endpoints.ai: string
endpoints.auth: string
endpoints.energy: string
endpoints.user: string
endpoints.habits: string
endpoints.executionSummaries: string
endpoints.payments: string
endpoints.stripe: string
endpoints.webhook: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: Not evident
Observations:

Visible validations: None
Persistence behavior: None
Detectable coupling: None (standalone endpoint with no dependencies)
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## Authentication

This section contains endpoints responsible for user registration and login flows. Registration does not require authentication, while login requires the authenticate middleware to validate the user and update their last login timestamp.

### [POST] /api/auth/register    STATUS: OK

Controller:

File: infrastructure/http/controllers/AuthController.js
Method: register
Use case:

Name: createUser
File: application/use-cases/CreateUser.js
Authentication:

Not required
Input:

Expected fields:
email: string
userId: string
Output (201):

Returned fields:
success: boolean
message: string
user: object
user.id: string
user.email: string
user.plan: string
Explicitly defined errors:

400: VALIDATION_ERROR (missing email/userId or invalid email format)
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: Email and userId required (line 42-46), email format validation via validateEmail (line 48-52)
Persistence behavior: Creates user via userRepository.createUser with plan='freemium', energiaInicial=0, energiaMaxima=0
Detectable coupling: Depends on userRepository (injected), validateEmail from domain/validators/InputValidator.js, createUser use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

### [POST] /api/auth/login    STATUS: 

Controller:

File: infrastructure/http/controllers/AuthController.js
Method: login
Use case:

Name: updateLastLogin
File: application/use-cases/ManageUser.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
message: string
userId: string
Explicitly defined errors:

400: Not evident
401: AUTHENTICATION_ERROR (if req.user.uid is missing)
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: Checks req.user.uid exists (line 81-87)
Persistence behavior: Updates user lastLogin field via userRepository.updateUser
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), updateLastLogin use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## User Management

This section covers user profile operations, subscription status retrieval, and account deletion. All endpoints require authentication and operate on the authenticated user's data via `req.user.uid`.

### [GET] /api/user/profile

Controller:

File: infrastructure/http/controllers/UserController.js
Method: getProfile
Use case:

Name: getUserProfile
File: application/use-cases/ManageUser.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
user: object
user.id: string
user.email: string
user.plan: string
user.energia: Not evident
user.trial: Not evident
user.limits: Not evident
user.assistant: Not evident
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: NOT_FOUND (if user does not exist)
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userRepository dependency and user existence)
Persistence behavior: Reads user via userRepository.getUser
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), getUserProfile use case, mapErrorToHttp error mapper, logger
Incomplete contract: Output field types not explicitly defined in controller (inferred from use case ManageUser.js:45-55)

---------------------------------------------------------------------------------------------------------------------------------

### [PUT] /api/user/profile

Controller:

File: infrastructure/http/controllers/UserController.js
Method: updateProfile
Use case:

Name: updateUserProfile
File: application/use-cases/ManageUser.js
Authentication:

Required
Input:

Expected fields:
assistant: Not evident
Output (200):

Returned fields:
success: boolean
message: string
user: object
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case filters allowed fields to 'assistant' only per ManageUser.js:77-82)
Persistence behavior: Updates user via userRepository.updateUser with safeUpdates filtered in use case
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), updateUserProfile use case, mapErrorToHttp error mapper, logger
Incomplete contract: Input field type not explicitly validated in controller, output user object structure not evident

---------------------------------------------------------------------------------------------------------------------------------

### [GET] /api/user/subscription

Controller:

File: infrastructure/http/controllers/UserController.js
Method: getSubscription
Use case:

Name: getSubscriptionStatus
File: application/use-cases/GetSubscriptionStatus.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
subscription: object
subscription.subscriptionId: string or null
subscription.subscriptionStatus: string
subscription.stripeCustomerId: string or null
subscription.cancelAtPeriodEnd: boolean
subscription.currentPeriodEnd: Not evident or null
subscription.canceledAt: Not evident or null
subscription.plan: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: NOT_FOUND (if user does not exist)
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userRepository dependency and user existence)
Persistence behavior: Reads user via userRepository.getUser
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), getSubscriptionStatus use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

### [DELETE] /api/user/account

Controller:

File: infrastructure/http/controllers/UserController.js
Method: deleteAccount
Use case:

Name: deleteUserAccount
File: application/use-cases/ManageUser.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
message: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userRepository dependency)
Persistence behavior: Deletes user via userRepository.deleteUser
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), deleteUserAccount use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## Energy Management

This section includes endpoints for retrieving energy status and managing trial activation. Energy is a core resource in the application that controls feature usage. Trial functionality is restricted to freemium users and can only be activated once per user.

### [GET] /api/energy

Controller:

File: infrastructure/http/controllers/EnergyController.js
Method: getEnergy
Use case:

Name: getUserEnergy
File: application/use-cases/ConsumeEnergy.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
energy: object
energy.actual: Not evident
energy.maxima: Not evident
energy.consumoTotal: Not evident
energy.plan: string
energy.planId: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates dependencies)
Persistence behavior: Reads energy via energyRepository.getEnergy, conditionally updates via energyRepository.updateEnergy if needsDailyRecharge returns true, reads user via userRepository.getUser
Detectable coupling: Depends on authenticate middleware (sets req.user), energyRepository (injected), userRepository (injected), getUserEnergy use case, mapErrorToHttp error mapper, logger
Incomplete contract: Output field types not explicitly defined in controller (inferred from use case ConsumeEnergy.js:64-70)

---------------------------------------------------------------------------------------------------------------------------------

### [POST] /api/energy/trial/activate

Controller:

File: infrastructure/http/controllers/EnergyController.js
Method: activateTrialEndpoint
Use case:

Name: activateTrial
File: application/use-cases/ActivateTrial.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
message: string
trial: object
trial.activo: boolean
trial.startTimestamp: Date
trial.expiresAt: Date
trial.energiaInicial: Not evident
Explicitly defined errors:

400: TRIAL_ALREADY_USED (if user.trial.startTimestamp exists)
401: Not evident
403: AUTHORIZATION_ERROR (if user.plan is not 'freemium')
404: NOT_FOUND (if user does not exist)
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates user existence, plan='freemium', and trial.startTimestamp absence per ActivateTrial.js:39-51)
Persistence behavior: Updates user via userRepository.updateUser with trial activation fields and energy values from PLANS.TRIAL
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), activateTrial use case, mapErrorToHttp error mapper, logger, PLANS.TRIAL configuration
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

### [GET] /api/energy/trial/status

Controller:

File: infrastructure/http/controllers/EnergyController.js
Method: getTrialStatusEndpoint
Use case:

Name: getTrialStatus
File: application/use-cases/GetTrialStatus.js
Authentication:

Required
Input:

Expected fields: None (userId extracted from req.user.uid set by authenticate middleware)
Output (200):

Returned fields:
success: boolean
trial: object
trial.activo: boolean
trial.startTimestamp: Date or null
trial.expiresAt: Date or null
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: NOT_FOUND (if user does not exist)
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userRepository dependency and user existence)
Persistence behavior: Reads user via userRepository.getUser
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), getTrialStatus use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## Habit Series

This section covers habit series management operations. These endpoints validate plan-based access and enforce usage limits according to the user's subscription tier. Habit series creation is validation-only and does not persist data at the contract level.

### [POST] /api/habits/series

Controller:

File: infrastructure/http/controllers/HabitSeriesController.js
Method: createHabitSeriesEndpoint
Use case:

Name: createHabitSeries
File: application/use-cases/createHabitSeries.js
Authentication:

Required
Input:

Expected fields: None (payload from req.body is passed but not used per createHabitSeries.js:32-37)
Output (200):

Returned fields:
allowed: boolean
Explicitly defined errors:

400: Not evident
401: Not evident
403: Returned when result.allowed is false and result.reason is not 'LIMIT_REACHED' (line 44)
404: Not evident
409: Not evident
429: Returned when result.allowed is false and result.reason is 'LIMIT_REACHED' (line 44)
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates feature access and active series limit per createHabitSeries.js:44-54)
Persistence behavior: None (validation-only endpoint, no persistence per use case comments line 11-12)
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), createHabitSeries use case, mapErrorToHttp error mapper, logger, validateFeatureAccess and validateActiveSeriesLimit from ValidatePlanAccess.js
Incomplete contract: Output structure when allowed=false not evident in controller (result object returned directly from use case at line 48)

---------------------------------------------------------------------------------------------------------------------------------

### [DELETE] /api/habits/series/:seriesId

Controller:

File: infrastructure/http/controllers/HabitSeriesController.js
Method: deleteHabitSeriesEndpoint
Use case:

Name: deleteHabitSeries
File: application/use-cases/deleteHabitSeries.js
Authentication:

Required
Input:

Expected fields:
seriesId: string (URL parameter)
Output (200):

Returned fields:
success: boolean
message: string
deletedSeriesId: string
Explicitly defined errors:

400: Not evident
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userId, seriesId, and dependencies per deleteHabitSeries.js:37-47)
Persistence behavior: Deletes series via habitSeriesRepository.delete (validates ownership and existence), decrements active series counter via userRepository.decrementActiveSeries
Detectable coupling: Depends on authenticate middleware (sets req.user), habitSeriesRepository (injected), userRepository (injected), deleteHabitSeries use case, mapErrorToHttp error mapper, logger
Incomplete contract: Use case returns {ok, deletedSeriesId} or {ok: false, reason} (deleteHabitSeries.js:56-66) but controller always returns success structure at line 75-79, error handling for SERIES_NOT_FOUND not evident in controller

---------------------------------------------------------------------------------------------------------------------------------

## AI Services

This section contains endpoints for AI-powered features. The chat endpoint supports multiple function types and enforces energy consumption, rate limiting, and input size validation. AI operations may conditionally trigger habit series persistence based on function type.

### [POST] /api/ai/chat

Controller:

File: infrastructure/http/controllers/AIController.js
Method: chatEndpoint
Use case:

Name: generateAIResponseWithFunctionType
File: application/use-cases/GenerateAIResponse.js
Authentication:

Required
Input:

Expected fields:
messages: array (required, maxLength: 20, each element content maxLength: 2000)
function_type: string (required)
Output (200):

Returned fields:
success: boolean
message: string
model: string
tokensUsed: Not evident
energyConsumed: Not evident
Explicitly defined errors:

400: VALIDATION_ERROR (invalid messages, missing/invalid function_type, or invalid function_type value)
401: Not evident
403: INSUFFICIENT_ENERGY (if energy validation fails per GenerateAIResponse.js:61-63 or 76-78)
404: Not evident
409: Not evident
429: Applied via aiRateLimiter middleware (ai.routes.js:59)
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: messages validated via validateMessages function (line 46), function_type required and must be string (line 52-56), function_type must be valid per isValidFunctionType (line 58-62), input size validated via validateInputSize middleware (maxBodySize: 50KB, ai.routes.js:61-67)
Persistence behavior: Consumes energy via energyRepository.updateEnergy if energyConsumed > 0 (GenerateAIResponse.js:84-88), conditionally persists habit series via habitSeriesRepository.createFromAI if isHabitSeriesFinal returns true (GenerateAIResponse.js:117-123)
Detectable coupling: Depends on authenticate middleware (sets req.user), aiRateLimiter middleware, authorizeFeature middleware ('ai.chat'), validateInputSize middleware, aiProvider (injected), energyRepository (injected), habitSeriesRepository (injected), validateMessages from domain/validators/InputValidator.js, isValidFunctionType from domain/policies/ModelSelectionPolicy.js, generateAIResponseWithFunctionType use case, mapErrorToHttp error mapper, logger
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## Payments & Stripe Integration

This section covers payment initialization and Stripe-specific operations including checkout session creation and billing portal access. Payment endpoints validate plan configuration and create Stripe sessions but do not directly update subscriptions—subscription updates are handled asynchronously via webhooks.

### [POST] /api/stripe/create-checkout

Controller:

File: infrastructure/http/routes/stripe.routes.js
Method: Anonymous async function (line 30)
Use case:

Name: Not applicable
File: Not applicable
Authentication:

Required
Input:

Expected fields:
plan: string
Output (200):

Returned fields:
success: boolean
url: string
sessionId: string
Explicitly defined errors:

400: ValidationError (if plan is missing, plan does not exist, or plan has no stripePriceId)
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: Not evident
Observations:

Visible validations: plan required (line 36-38), plan must exist in PLANS configuration (line 41-45), plan must have stripePriceId configured (line 48-51)
Persistence behavior: None (creates Stripe session only, actual subscription update happens via webhook)
Detectable coupling: Depends on authenticate middleware (sets req.user), stripe client from StripeConfig.js, PLANS from domain/policies/PlanPolicy.js, success and logError functions (not evident where defined), next error handler
Incomplete contract: ValidationError is thrown but not imported, success and logError functions referenced but not imported

---------------------------------------------------------------------------------------------------------------------------------

### [POST] /api/stripe/portal-session

Controller:

File: infrastructure/http/routes/stripe.routes.js
Method: Anonymous async function (line 95)
Use case:

Name: Not applicable
File: Not applicable
Authentication:

Required
Input:

Expected fields:
customerId: string
Output (200):

Returned fields:
success: boolean
url: string
Explicitly defined errors:

400: ValidationError (if customerId is missing)
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: Not evident
Observations:

Visible validations: customerId required (line 99-101)
Persistence behavior: None (creates Stripe billing portal session only)
Detectable coupling: Depends on authenticate middleware (sets req.user), stripe client from StripeConfig.js, logError function (not evident where defined), next error handler
Incomplete contract: ValidationError is thrown but not imported, logError function referenced but not imported

---------------------------------------------------------------------------------------------------------------------------------

### [POST] /api/payments/start

Controller:

File: infrastructure/http/controllers/PaymentController.js
Method: start
Use case:

Name: startPayment
File: application/use-cases/StartPayment.js
Authentication:

Required
Input:

Expected fields:
planId: string
Output (200):

Returned fields:
success: boolean
message: string
checkoutUrl: string
Explicitly defined errors:

400: VALIDATION_ERROR (if userId/planId invalid, plan does not exist, plan has no stripePriceId, or Stripe error occurs per StartPayment.js:47-101)
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates userId type, planId type, plan existence, and stripePriceId presence per StartPayment.js:47-70)
Persistence behavior: None (creates Stripe session only, actual subscription update happens via webhook)
Detectable coupling: Depends on authenticate middleware (sets req.user), stripe client from StripeConfig.js (injected), startPayment use case, mapErrorToHttp error mapper, logger, HTTP_STATUS constants
Incomplete contract: Not applicable

---------------------------------------------------------------------------------------------------------------------------------

## Webhooks

This section documents webhook endpoints that receive asynchronous event notifications from external services. The Stripe webhook handles subscription lifecycle events and updates user subscription status accordingly. Webhook processing includes signature verification and duplicate event prevention.

### [POST] /api/webhooks

Controller:

File: infrastructure/http/controllers/WebhookController.js
Method: stripeWebhook
Use case:

Name: Multiple: processCheckoutCompleted, processSubscriptionUpdated, processSubscriptionDeleted
File: application/use-cases/ProcessSubscription.js
Authentication:

Not required
Input:

Expected fields: Raw request body (verified via Stripe signature in stripe-signature header)
Output (200):

Returned fields:
received: boolean
duplicate: boolean (only when event already processed)
error: string (only when processing error occurs)
Explicitly defined errors:

400: Returned if Stripe signature verification fails (line 55)
401: Not evident
403: Not evident
404: Not evident
409: Not evident
500: Not evident (errors during processing return 200 with error field per line 95)
Observations:

Visible validations: Stripe signature verification via stripe.webhooks.constructEvent (line 52), duplicate event check via processedEvents Set (line 59-62)
Persistence behavior: Updates user subscription data via userRepository.updateUser for checkout.session.completed (ProcessSubscription.js:45-53), customer.subscription.updated (ProcessSubscription.js:80-90), and customer.subscription.deleted (ProcessSubscription.js:117-123), reads user via userRepository.getUserByCustomerId for subscription events
Detectable coupling: Depends on stripe client and webhookSecret from StripeConfig.js, userRepository (injected), processCheckoutCompleted/processSubscriptionUpdated/processSubscriptionDeleted use cases, logger, HTTP_STATUS constants, in-memory processedEvents Set for idempotency
Incomplete contract: Always returns 200 status even on processing errors (line 94-95), webhook event types handled: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

---------------------------------------------------------------------------------------------------------------------------------

## Execution Summaries

This section contains endpoints for generating execution summaries. These endpoints validate plan-based feature access and enforce usage limits specific to the user's subscription tier. Execution summary generation is validation-only and does not persist data at the contract level.

### [POST] /api/execution-summaries

Controller:

File: infrastructure/http/controllers/ExecutionSummaryController.js
Method: generateExecutionSummaryEndpoint
Use case:

Name: generateExecutionSummary
File: application/use-cases/GenerateExecutionSummary.js
Authentication:

Required
Input:

Expected fields: None (payload from req.body is passed but not used per GenerateExecutionSummary.js:35)
Output (200):

Returned fields:
allowed: boolean
Explicitly defined errors:

400: Not evident
401: Not evident
403: Returned when result.allowed is false and result.reason is not 'LIMIT_REACHED' (line 40)
404: Not evident
409: Not evident
429: Returned when result.allowed is false and result.reason is 'LIMIT_REACHED' (line 40)
500: INTERNAL_SERVER_ERROR (fallback in errorMapper.js)
Observations:

Visible validations: None at controller level (use case validates feature access and weekly summaries limit per GenerateExecutionSummary.js:48-59)
Persistence behavior: None (validation-only endpoint, no persistence per use case comments line 13-14)
Detectable coupling: Depends on authenticate middleware (sets req.user), userRepository (injected), generateExecutionSummary use case, mapErrorToHttp error mapper, logger, validateFeatureAccess and validateWeeklySummariesLimit from ValidatePlanAccess.js
Incomplete contract: Output structure when allowed=false not evident in controller (result object returned directly from use case at line 44)

---

**End of Backend HTTP Contracts Inventory**
