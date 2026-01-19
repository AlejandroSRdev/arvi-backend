// Custom error class for insufficient energy scenarios

export class InsufficientEnergyError extends Error {
  constructor(required, available) {
    super('Insufficient energy');
    this.name = 'InsufficientEnergyError';
    this.code = 'INSUFFICIENT_ENERGY';

    this.required = required;
    this.available = available;
  }
}
