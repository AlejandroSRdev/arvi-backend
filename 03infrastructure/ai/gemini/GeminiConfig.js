/**
 * Layer: Infrastructure
 * File: GeminiConfig.js
 * Responsibility:
 * Initializes and exports the Google Generative AI client configured from environment credentials.
 *
 * No side effects on import. Call initializeGemini() once before use.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

export const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Initialize the Gemini client. Must be called once before any AI operation.
 */
export function initializeGemini() {
  if (genAIInstance) return;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  console.log('✅ Google Gemini AI inicializado correctamente');
  console.log(`🤖 Modelo por defecto: ${DEFAULT_MODEL}`);
}

/**
 * Returns a model instance from the initialized Gemini client.
 * @param {string} modelName
 */
export function getModel(modelName = DEFAULT_MODEL) {
  if (!genAIInstance) {
    throw new Error('Gemini not initialized. Call initializeGemini() first.');
  }
  return genAIInstance.getGenerativeModel({ model: modelName });
}

/** @deprecated Use getModel() directly. Kept for backward compatibility. */
export const genAI = new Proxy({}, {
  get(_, prop) {
    if (!genAIInstance) {
      throw new Error('Gemini not initialized. Call initializeGemini() first.');
    }
    return genAIInstance[prop];
  },
});

export default genAI;
