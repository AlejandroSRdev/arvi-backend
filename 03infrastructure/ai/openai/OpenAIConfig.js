/**
 * Layer: Infrastructure
 * File: OpenAIConfig.js
 * Responsibility:
 * Initializes and exports the OpenAI SDK client configured from environment credentials.
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no está definida');
  process.exit(1);
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('✅ OpenAI client inicializado correctamente');

export default openai;
