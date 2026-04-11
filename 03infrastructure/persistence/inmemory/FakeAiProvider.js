/**
 * Layer: Infrastructure
 * File: FakeAiProvider.js
 * Responsibility:
 * Deterministic stub AI provider used when ARVI_TEST_MODE=true.
 * Currently minimal — expanded as acceptance scenarios exercise AI flows.
 */

export class FakeAiProvider {
  constructor() {
    this.calls = [];
  }

  async generate(prompt, options) {
    this.calls.push({ prompt, options });
    return { content: 'fake-ai-response' };
  }

  _reset() {
    this.calls = [];
  }
}

export default FakeAiProvider;
