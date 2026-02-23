/**
 * Layer: Domain
 * File: Energy.js
 * Responsibility:
 * Represents a user's energy state as an immutable snapshot; validation and mutation rules are enforced by the User entity.
 */
export class Energy {
  constructor(currentAmount, maxAmount, lastRechargedAt) {
    this.currentAmount = currentAmount;
    this.maxAmount = maxAmount;
    this.lastRechargedAt = lastRechargedAt;
  }

  static initial(amount) {
    return new Energy(amount, amount, null);
  }
}

export default Energy;