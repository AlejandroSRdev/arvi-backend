/**
 * Limits Value Object (Domain)
 *
 * Represents usage limits associated with a user.
 * It defines maximum allowed values and current usage counters,
 * but does NOT contain logic to enforce or modify those limits.
 *
 * All mutations and rule enforcement are handled by the owning
 * entity (User), ensuring consistency and centralized control.
 */
export class Limits {
    readonly maxActiveSeries: number;
    readonly activeSeriesCount: number;

    constructor(maxActiveSeries: number, activeSeriesCount: number) {
        this.maxActiveSeries = maxActiveSeries;
        this.activeSeriesCount = activeSeriesCount;
    }

    /**
     * PRO plan limits: high ceiling, no practical restrictions.
     */
    static pro(): Limits {
        return new Limits(100, 0);
    }
}