/**
 * Layer: Domain
 * File: IAIProvider.js
 * Responsibility:
 * Defines the contract for executing individual AI calls, decoupled from prompt construction and multi-pass flow decisions.
 */

export class IAIProvider {
  async callAI(userId, messages, options) {
    throw new Error('Not implemented');
  }

  // Resolves the model configuration via ModelSelectionPolicy before delegating to callAI.
  async callAIWithFunctionType(userId, messages, functionType) {
    throw new Error('Not implemented');
  }
}

export default IAIProvider;
