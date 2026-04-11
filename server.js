/**
 * Arvi Backend Server - Composition Root
 *
 * This file is the ONLY place where infrastructure adapters are instantiated.
 * Two boot modes:
 *   - production (default): real Firestore, real AI providers, real Stripe.
 *   - test (ARVI_TEST_MODE=true): in-memory fakes, test-support endpoints mounted.
 *
 * Both modes call buildApp() — same wiring, different dependencies.
 * No infrastructure module has side effects on import — each exposes an initialize()
 * function called explicitly here so that test mode never touches external services.
 */

import 'dotenv/config';

import { buildApp } from './03infrastructure/http/app.js';
import PasswordHasher from './03infrastructure/security/PasswordHasher.js';

// Production adapters
import { initializeFirebase } from './03infrastructure/persistence/firestore/FirebaseConfig.js';
import FirestoreUserRepository from './03infrastructure/persistence/firestore/FirestoreUserRepository.js';
import FirestoreHabitSeriesRepository from './03infrastructure/persistence/firestore/FirestoreHabitSeriesRepository.js';
import AIProviderRouter from './03infrastructure/ai/AIProviderRouter.js';
import { initializeGemini } from './03infrastructure/ai/gemini/GeminiConfig.js';
import { initializeOpenAI } from './03infrastructure/ai/openai/OpenAIConfig.js';
import { initializeStripeConfig } from './03infrastructure/billing/stripe/stripeConfig.js';
import { initializeStripeService } from './03infrastructure/billing/stripe/StripeService.js';
import * as stripeService from './03infrastructure/billing/stripe/StripeService.js';

// Test adapters
import { InMemoryUserRepository } from './03infrastructure/persistence/inmemory/InMemoryUserRepository.js';
import { InMemoryHabitSeriesRepository } from './03infrastructure/persistence/inmemory/InMemoryHabitSeriesRepository.js';
import { FakeAiProvider } from './03infrastructure/persistence/inmemory/FakeAiProvider.js';
import { fakeStripeService } from './03infrastructure/persistence/inmemory/FakeStripeService.js';

const isTestMode = process.env.ARVI_TEST_MODE === 'true';

function createAdapters() {
  if (isTestMode) {
    return {
      userRepository: new InMemoryUserRepository(),
      habitSeriesRepository: new InMemoryHabitSeriesRepository(),
      aiProvider: new FakeAiProvider(),
      passwordHasher: new PasswordHasher(),
      stripeService: fakeStripeService,
    };
  }

  initializeFirebase();
  initializeGemini();
  initializeOpenAI();
  initializeStripeConfig();
  initializeStripeService();

  return {
    userRepository: new FirestoreUserRepository(),
    habitSeriesRepository: new FirestoreHabitSeriesRepository(),
    aiProvider: new AIProviderRouter(),
    passwordHasher: new PasswordHasher(),
    stripeService,
  };
}

const deps = createAdapters();
const app = buildApp(deps);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  const mode = isTestMode ? 'TEST (in-memory)' : 'production';
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  🚀 ARVI Backend Server v1.0.0  [${mode}]`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Port: ${PORT}`);
  console.log(`  🔗 URL:  http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
