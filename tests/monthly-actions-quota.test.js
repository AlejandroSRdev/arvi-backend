/**
 * Tests: Monthly Actions Quota
 *
 * (a) User created with freemium plan has correct limits (all zero).
 * (b) createAction throws MonthlyActionsQuotaExceededError when remaining is 0.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createUser } from '../02application/use-cases/CreateUser.js';
import { createAction } from '../02application/use-cases/CreateActionUseCase.js';
import { MonthlyActionsQuotaExceededError } from '../errors/Index.js';

// (a) Freemium user creation initializes monthly action limits to 0
test('freemium user creation initializes monthlyActionsLimit to 0', async () => {
  let savedUser = null;

  const mockUserRepository = {
    save: async (user) => { savedUser = user; },
  };

  const mockPasswordHasher = {
    hash: async (pw) => `hashed_${pw}`,
  };

  await createUser('test@example.com', 'password123', {
    userRepository: mockUserRepository,
    passwordHasher: mockPasswordHasher,
  });

  assert.ok(savedUser !== null, 'user should have been saved');
  assert.equal(savedUser.limits.maxActiveSeries, 0);
  assert.equal(savedUser.limits.monthlyActionsLimit, 0);
});

// (b) createAction blocks immediately when monthlyActionsRemaining is 0
test('createAction throws MonthlyActionsQuotaExceededError when monthly remaining is 0', async () => {
  const mockUserRepository = {
    getUser: async () => ({
      id: 'user-1',
      plan: 'pro',
      trial: { activo: false },
      limits: {
        maxActiveSeries: 6,
        monthlyActionsMax: 50,
        monthlyActionsRemaining: 0,
      },
    }),
  };

  await assert.rejects(
    () => createAction('user-1', 'series-1', { language: 'en' }, {
      userRepository: mockUserRepository,
      habitSeriesRepository: {},
      aiProvider: {},
    }),
    (err) => {
      assert.ok(
        err instanceof MonthlyActionsQuotaExceededError,
        `expected MonthlyActionsQuotaExceededError, got ${err.constructor.name}: ${err.message}`
      );
      return true;
    }
  );
});
