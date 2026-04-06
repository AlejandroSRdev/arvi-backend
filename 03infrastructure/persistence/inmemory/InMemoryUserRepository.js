/**
 * Layer: Infrastructure
 * File: InMemoryUserRepository.js
 * Responsibility:
 * In-memory implementation of IUserRepository used when ARVI_TEST_MODE=true so that
 * acceptance tests exercise the real HTTP surface without requiring Firestore.
 * NOT for production use.
 */

import { IUserRepository } from '../../../01domain/ports/IUserRepository.js';

export class InMemoryUserRepository extends IUserRepository {
  constructor() {
    super();
    this.users = new Map(); // id -> user
    this.nextId = 1;
  }

  _nextId() {
    return `user-${this.nextId++}`;
  }

  async getUser(userId) {
    return this.users.get(userId) ?? null;
  }

  async getUserByEmail(email) {
    for (const u of this.users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }

  async getUserByCustomerId(customerId) {
    for (const u of this.users.values()) {
      if (u.stripeCustomerId === customerId) return u;
    }
    return null;
  }

  async save(user, planDates = {}) {
    const id = user.id ?? this._nextId();
    const stored = {
      id,
      email: user.email,
      password: user.password,
      plan: user.plan,
      planStartedAt: planDates.planStartedAt ?? null,
      planExpiresAt: planDates.planExpiresAt ?? null,
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      subscribedAt: user.subscribedAt ?? null,
      canceledAt: user.canceledAt ?? null,
      trial: user.trial
        ? { durationDays: user.trial.durationDays, startedAt: user.trial.startedAt }
        : null,
      limits: user.limits
        ? {
            maxActiveSeries: user.limits.maxActiveSeries,
            activeSeriesCount: user.limits.activeSeriesCount ?? 0,
            monthlyActionsMax: user.limits.monthlyActionsLimit ?? user.limits.monthlyActionsMax ?? 0,
            monthlyActionsRemaining: user.limits.monthlyActionsLimit ?? user.limits.monthlyActionsRemaining ?? 0,
          }
        : null,
    };
    this.users.set(id, stored);
    return stored;
  }

  async update(user) {
    if (!user.id) throw new Error('update requires user.id');
    this.users.set(user.id, { ...this.users.get(user.id), ...user });
  }

  async deleteUser(userId) {
    this.users.delete(userId);
  }

  async updateLastLogin(userId) {
    const u = this.users.get(userId);
    if (u) u.lastLoginAt = new Date().toISOString();
  }

  async incrementWeeklySummaries(userId) {
    const u = this.users.get(userId);
    if (u) u.weeklySummaries = (u.weeklySummaries ?? 0) + 1;
  }

  async incrementActiveSeries(userId) {
    const u = this.users.get(userId);
    if (u) u.activeSeries = (u.activeSeries ?? 0) + 1;
  }

  async decrementActiveSeries(userId) {
    const u = this.users.get(userId);
    if (u) u.activeSeries = Math.max(0, (u.activeSeries ?? 0) - 1);
  }

  /**
   * Test-only helper: directly insert a fully-formed user record.
   */
  _seed(user) {
    const id = user.id ?? this._nextId();
    const stored = { ...user, id };
    this.users.set(id, stored);
    return stored;
  }

  /**
   * Test-only helper: wipe all state.
   */
  _reset() {
    this.users.clear();
    this.nextId = 1;
  }
}

export default InMemoryUserRepository;
