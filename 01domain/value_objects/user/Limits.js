/**
 * Layer: Domain
 * File: Limits.js
 * Responsibility:
 * Represents a user's usage boundaries as an immutable snapshot; enforcement of these limits is delegated to the User entity.
 */
class Limits {
    constructor(maxActiveSeries, activeSeriesCount) {
        this.maxActiveSeries = maxActiveSeries;
        this.activeSeriesCount = activeSeriesCount;
    }

    // High ceiling used for plans with no practical series restriction.
    static pro() {
        return new Limits(100, 0);
    }
}

export { Limits };
export default Limits;