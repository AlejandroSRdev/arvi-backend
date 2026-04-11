/**
 * Layer: Infrastructure
 * File: OpenAIConfig.js
 * Responsibility:
 * Initializes and exports the OpenAI SDK client configured from environment credentials.
 *
 * No side effects on import. Call initializeOpenAI() once before use.
 */

import OpenAI from 'openai';

let openaiInstance = null;

/**
 * Initialize the OpenAI client. Must be called once before any AI operation.
 */
export function initializeOpenAI() {
  if (openaiInstance) return;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  openaiInstance = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('✅ OpenAI client inicializado correctamente');
}

/**
 * Returns the initialized OpenAI client.
 * @returns {OpenAI}
 */
export function getOpenAI() {
  if (!openaiInstance) {
    throw new Error('OpenAI not initialized. Call initializeOpenAI() first.');
  }
  return openaiInstance;
}

/** @deprecated Use getOpenAI() instead. Kept for backward compatibility. */
export const openai = new Proxy({}, {
  get(_, prop) {
    return getOpenAI()[prop];
  },
});

export default openai;
