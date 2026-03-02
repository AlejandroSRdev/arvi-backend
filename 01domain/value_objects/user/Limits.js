/**
 * Layer: Domain
 * File: Limits.js
 * Responsibility:
 * Defines canonical plan limit values and represents a user's usage boundaries as an immutable snapshot.
 */

export const PLAN_LIMITS = {
  TRIAL: { activeSeries: 2, monthlyActions: 10 },
  BASE:  { activeSeries: 3, monthlyActions: 20 },
  PRO:   { activeSeries: 6, monthlyActions: 50 },
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