/**
 * User Entity (Domain)
 *
 * Represents a system user as a domain entity.
 * The constructor acts as the single gatekeeper of all invariants:
 * if a User instance exists, it is guaranteed to be valid.
 *
 * This entity is completely agnostic of infrastructure concerns
 * (databases, payment providers, external services).
 */

import { Trial } from "../value_objects/user_objects/Trial.ts";
import { Energy } from "../value_objects/user_objects/Energy.ts";
import { Limits } from "../value_objects/user_objects/Limits.ts";

export class User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  plan: string;
  readonly trial: Trial;
  energy: Energy;
  limits: Limits;

  private constructor(
    id: string,
    email: string,
    password: string,
    plan: string,
    trial: Trial,
    energy: Energy,
    limits: Limits,
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
    // Energy invariants
    // ─────────────────────────────

    if (typeof energy.currentAmount !== "number") {
      throw new Error("Invalid energy current amount type");
    }

    if (energy.currentAmount < 0) {
      throw new Error("Energy current amount cannot be negative");
    }

    if (typeof energy.maxAmount !== "number") {
      throw new Error("Invalid energy max amount type");
    }

    if (energy.maxAmount < 0) {
      throw new Error("Energy max amount cannot be negative");
    }

    if (energy.currentAmount > energy.maxAmount) {
      throw new Error("Energy current amount cannot exceed max amount");
    }

    if (
      energy.lastRechargedAt !== null &&
      !(energy.lastRechargedAt instanceof Date)
    ) {
      throw new Error("Invalid energy last recharged date");
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

    // ─────────────────────────────
    // State assignment (atomic)
    // ─────────────────────────────

    this.id = id;
    this.email = normalizedEmail;
    this.password = password;
    this.plan = plan;
    this.trial = trial;
    this.energy = energy;
    this.limits = limits;
  }

 /**
   * Factory method
   *
   * This is the ONLY valid entry point to create a User.
   * All invariants are enforced here.
   */
  public static create(params: {
    id: string;
    email: string;
    password: string;
    plan: string;
    trial: Trial;
    energy: Energy;
    limits: Limits;
  }): User {
    return new User(
      params.id,
      params.email,
      params.password,
      params.plan,
      params.trial,
      params.energy,
      params.limits
    );
  }
}

