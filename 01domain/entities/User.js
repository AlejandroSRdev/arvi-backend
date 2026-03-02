/**
 * Layer: Domain
 * File: User.js
 * Responsibility:
 * Represents a system user and enforces all identity, credential, trial, and limit invariants through construction.
 */


export class User {
  constructor(
    id,
    email,
    password,
    plan,
    trial,
    limits
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

    this.id = id;
    this.email = normalizedEmail;
    this.password = password;
    this.plan = plan;
    this.trial = trial;
    this.limits = limits;
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
      params.limits
    );
  }
}

export default User;

