/**
 * Google Gemini Configuration (Infrastructure Layer)
 *
 * MIGRADO DESDE: src/config/gemini.js (líneas 1-38)
 * FECHA MIGRACIÓN: 2025-12-29
 *
 * RESPONSABILIDADES:
 * - Inicialización del SDK de Google Generative AI
 * - Validación de API key desde variables de entorno
 * - Exportar cliente configurado y helpers para uso en GeminiAdapter
 * - Definir modelo por defecto (gemini-2.5-flash)
 *
 * COMPORTAMIENTO ORIGINAL PRESERVADO:
 * - Exit code 1 si falta GEMINI_API_KEY (src/config/gemini.js:18-21)
 * - Modelo por defecto: gemini-2.5-flash (línea 26)
 * - Función getModel para obtener modelos preconfigurados (líneas 29-31)
 * - Logs de inicialización (líneas 33-35)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// EXTRACCIÓN EXACTA: src/config/gemini.js:18-21
// Validación de API key con exit si no existe
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY no está definida');
  process.exit(1);
}

// EXTRACCIÓN EXACTA: src/config/gemini.js:23
// Inicialización del cliente Google Generative AI
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// EXTRACCIÓN EXACTA: src/config/gemini.js:25-26
// Modelo por defecto (migrado desde ai_service.dart)
export const DEFAULT_MODEL = 'gemini-2.5-flash';

// EXTRACCIÓN EXACTA: src/config/gemini.js:28-31
// Obtener modelo preconfigurado
export function getModel(modelName = DEFAULT_MODEL) {
  return genAI.getGenerativeModel({ model: modelName });
}

// EXTRACCIÓN EXACTA: src/config/gemini.js:33-35
// Logs de confirmación de inicialización
console.log('✅ Google Gemini AI inicializado correctamente');
console.log(`🤖 Modelo por defecto: ${DEFAULT_MODEL}`);

// EXTRACCIÓN EXACTA: src/config/gemini.js:37
// Export default para compatibilidad
export default genAI;
