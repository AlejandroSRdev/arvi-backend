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
export type Trial = {
    readonly durationDays: number;
    readonly startedAt: Date;
}