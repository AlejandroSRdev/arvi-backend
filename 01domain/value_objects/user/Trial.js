/**
 * Layer: Domain
 * File: Trial.js
 * Responsibility:
 * Represents a user's trial time window; activity is always derived from time comparisons, never stored as state.
 */
class Trial {
    constructor(durationDays, startedAt) {
        this.durationDays = durationDays;
        this.startedAt = startedAt;
    }

    // Epoch start + 1 day satisfies the durationDays > 0 invariant while guaranteeing expiry.
    static inactive() {
        return new Trial(1, new Date(0));
    }
}

export { Trial };
export default Trial;