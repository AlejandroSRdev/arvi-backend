/**
 * Layer: Domain
 * File: Limits.js
 * Responsibility:
 * Defines canonical plan limit values and represents a user's usage boundaries as an immutable snapshot.
 */

export const PLAN_LIMITS = {
  TRIAL: { activeSeries: 5, monthlyActions: 25 },
  BASE:  { activeSeries: 10, monthlyActions: 50 },
  PRO:   { activeSeries: 20, monthlyActions: 100 },
};

class Limits {
  constructor(maxActiveSeries, activeSeriesCount, monthlyActionsLimit) {
    this.maxActiveSeries = maxActiveSeries;
    this.activeSeriesCount = activeSeriesCount;
    this.monthlyActionsLimit = monthlyActionsLimit;
  }

  static pro() {
    return new Limits(PLAN_LIMITS.PRO.activeSeries, 0, PLAN_LIMITS.PRO.monthlyActions);
  }
}

export { Limits };
export default Limits;