/**
 * Layer: Domain
 * File: User.js
 * Responsibility:
 * Represents a system user and enforces all identity, credential, trial, and limit invariants through construction.
 */


const VALID_SUBSCRIPTION_STATUSES = ['INACTIVE', 'ACTIVE', 'CANCELED', 'PAST_DUE'];

export class User {
  constructor(
    id,
    email,
    password,
    plan,
    trial,
    limits,
    billing = {}
  ) {
    // ─────────────────────────────
    // Identity & credentials
    // ─────────────────────────────

    if (typeof id !== "string") {
      throw new Error("Invalid user id type");
    }

    if (id.trim() === "") {
      throw new Error("User id cannot be empty");
    }

    if (typeof email !== "string") {
      throw new Error("Invalid user email type");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "") {
      throw new Error("User email cannot be empty");
    }

    if (normalizedEmail.includes(" ")) {
      throw new Error("User email cannot contain spaces");
    }

    if (!normalizedEmail.includes("@")) {
      throw new Error("User email must contain '@'");
    }

    if (typeof password !== "string") {
      throw new Error("Invalid user password type");
    }

    if (password === "") {
      throw new Error("User password cannot be empty");
    }

    if (typeof plan !== "string") {
      throw new Error("Invalid user plan type");
    }

    if (plan === "") {
      throw new Error("User plan cannot be empty");
    }

    // ─────────────────────────────
    // Trial invariants
    // ─────────────────────────────

    if (!(trial.startedAt instanceof Date)) {
      throw new Error("Invalid trial start date");
    }

    if (typeof trial.durationDays !== "number") {
      throw new Error("Invalid trial duration type");
    }

    if (trial.durationDays <= 0) {
      throw new Error("Trial duration must be greater than zero");
    }

    // ─────────────────────────────
    // Limits invariants
    // ─────────────────────────────

    if (typeof limits.maxActiveSeries !== "number") {
      throw new Error("Invalid max active series type");
    }

    if (limits.maxActiveSeries < 0) {
      throw new Error("Max active series cannot be negative");
    }

    if (typeof limits.activeSeriesCount !== "number") {
      throw new Error("Invalid active series count type");
    }

    if (limits.activeSeriesCount < 0) {
      throw new Error("Active series count cannot be negative");
    }

    if (limits.activeSeriesCount > limits.maxActiveSeries) {
      throw new Error(
        "Active series count cannot exceed max active series limit"
      );
    }

    if (typeof limits.monthlyActionsLimit !== "number") {
      throw new Error("Invalid monthly actions limit type");
    }

    if (limits.monthlyActionsLimit < 0) {
      throw new Error("Monthly actions limit cannot be negative");
    }

    // ─────────────────────────────
    // Billing invariants
    // ─────────────────────────────

    const subscriptionStatus = billing.subscriptionStatus ?? 'INACTIVE';
    const stripeCustomerId = billing.stripeCustomerId ?? null;
    const stripeSubscriptionId = billing.stripeSubscriptionId ?? null;
    const subscriptionUpdatedAt = billing.subscriptionUpdatedAt ?? null;

    if (!VALID_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
      throw new Error(`Invalid subscription status: ${subscriptionStatus}`);
    }

    // An active subscription must have a paid plan
    if (subscriptionStatus === 'ACTIVE' && plan.toUpperCase() === 'FREE') {
      throw new Error('Active subscription requires a paid plan');
    }

    // Subscription ID is only valid for non-INACTIVE states
    if (stripeSubscriptionId !== null && subscriptionStatus === 'INACTIVE') {
      throw new Error('stripeSubscriptionId is only valid for non-INACTIVE subscriptions');
    }

    this.id = id;
    this.email = normalizedEmail;
    this.password = password;
    this.plan = plan;
    this.trial = trial;
    this.limits = limits;
    this.subscriptionStatus = subscriptionStatus;
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.subscriptionUpdatedAt = subscriptionUpdatedAt;
  }

  /**
   * Transition to an active paid subscription.
   */
  activateSubscription({ plan, stripeCustomerId, stripeSubscriptionId }) {
    this.plan = plan;
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.subscriptionStatus = 'ACTIVE';
    this.subscriptionUpdatedAt = new Date();
  }

  /**
   * Mark the subscription as canceled; retains stripeCustomerId for potential reactivation.
   */
  cancelSubscription() {
    this.subscriptionStatus = 'CANCELED';
    this.stripeSubscriptionId = null;
    this.subscriptionUpdatedAt = new Date();
  }

  /**
   * Mark the subscription as past due (payment failed).
   */
  markPastDue() {
    this.subscriptionStatus = 'PAST_DUE';
    this.subscriptionUpdatedAt = new Date();
  }

  /**
   * The sole valid entry point to create a User.
   */
  static create(params) {
    return new User(
      params.id,
      params.email,
      params.password,
      params.plan,
      params.trial,
      params.limits,
      params.billing
    );
  }
}

export default User;

