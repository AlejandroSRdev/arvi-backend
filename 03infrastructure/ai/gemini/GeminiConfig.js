/**
 * Layer: Infrastructure
 * File: GeminiConfig.js
 * Responsibility:
 * Initializes and exports the Google Generative AI client configured from environment credentials.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY no está definida');
  process.exit(1);
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export function getModel(modelName = DEFAULT_MODEL) {
  return genAI.getGenerativeModel({ model: modelName });
}

console.log('✅ Google Gemini AI inicializado correctamente');
console.log(`🤖 Modelo por defecto: ${DEFAULT_MODEL}`);

export default genAI;
