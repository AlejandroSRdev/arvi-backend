/**
 * Trial Value Object (Domain)
 *
 * Represents a fixed trial time window for a user.
 * It defines when the trial starts and how long it lasts,
 * but does NOT store derived state such as "active" or "has access".
 *
 * Trial activity is always derived from time comparisons
 * (e.g. current time vs trial window), ensuring a single
 * source of truth and avoiding duplicated state.
 */
export class Trial {
    readonly durationDays: number;
    readonly startedAt: Date;

    constructor(durationDays: number, startedAt: Date) {
        this.durationDays = durationDays;
        this.startedAt = startedAt;
    }

    /**
     * Represents a trial that has already expired (no active trial).
     * Uses epoch + 1 day to satisfy domain invariants.
     */
    static inactive(): Trial {
        return new Trial(1, new Date(0));
    }
}