/**
 * Energy Value Object (Domain)
 *
 * Represents the energy state of a user within the domain.
 * It describes quantities and temporal references, but does NOT contain
 * calculation logic or knowledge about external providers (e.g. LLMs).
 *
 * Validation rules (non-negative values, consistency with limits, etc.)
 * are enforced by the owning entity (User), not by this value object.
 */
export type Energy = {
    currentAmount: number;
    maxAmount: number;
    lastRechargedAt: Date | null;
};