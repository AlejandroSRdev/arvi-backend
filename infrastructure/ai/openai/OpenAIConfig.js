/**
 * OpenAI Configuration (Infrastructure Layer)
 *
 * MIGRADO DESDE: src/config/openai.js (líneas 1-31)
 * FECHA MIGRACIÓN: 2025-12-29
 *
 * RESPONSABILIDADES:
 * - Inicialización del SDK de OpenAI
 * - Validación de API key desde variables de entorno
 * - Exportar cliente configurado para uso en OpenAIAdapter
 *
 * COMPORTAMIENTO ORIGINAL PRESERVADO:
 * - Exit code 1 si falta OPENAI_API_KEY (src/config/openai.js:20)
 * - Logs de inicialización (líneas 27-28)
 * - Cliente configurado con apiKey
 */

import OpenAI from 'openai';

// EXTRACCIÓN EXACTA: src/config/openai.js:18-21
// Validación de API key con exit si no existe
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no está definida');
  process.exit(1);
}

// EXTRACCIÓN EXACTA: src/config/openai.js:23-25
// Inicialización del cliente OpenAI con API key
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// EXTRACCIÓN EXACTA: src/config/openai.js:27-28
// Logs de confirmación de inicialización
console.log('✅ OpenAI client inicializado correctamente');

// EXTRACCIÓN EXACTA: src/config/openai.js:30
// Export default para compatibilidad
export default openai;
