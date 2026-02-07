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
export class Energy {
    constructor(
        public currentAmount: number,
        public maxAmount: number,
        public lastRechargedAt: Date | null
    ) {}

    /**
     * Creates initial energy state with full charge and no recharge history.
     */
    static initial(amount: number): Energy {
        return new Energy(amount, amount, null);
    }
}