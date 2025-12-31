/**
 * Stripe Configuration (Infrastructure)
 *
 * MIGRADO DESDE: src/config/stripe.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * FECHA MIGRACIÓN ORIGINAL: 2025-12-26
 * MIGRACIÓN A INFRASTRUCTURE: 2025-12-30
 *
 * MEJORAS RESPECTO AL ORIGINAL:
 * 🔄 Soporte para modo test/live dinámico
 * 🔄 Validación de claves según modo
 * 🔄 Exportación limpia de instancia configurada
 *
 * Responsabilidades:
 * - Inicialización del cliente Stripe
 * - Configuración de API key
 * - Configuración de webhook secret
 */

import Stripe from 'stripe';

const stripeMode = process.env.STRIPE_MODE || 'test';

// Seleccionar clave secreta según modo
const secretKey = stripeMode === 'live'
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!secretKey) {
  console.error(`❌ No se encontró STRIPE_SECRET_KEY_${stripeMode.toUpperCase()}`);
  process.exit(1);
}

// Inicializar Stripe
export const stripe = new Stripe(secretKey, {
  apiVersion: '2024-06-20',
});

// Seleccionar webhook secret según modo
export const webhookSecret = stripeMode === 'live'
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;

console.log(`✅ Stripe inicializado en modo: ${stripeMode}`);
console.log(`🔑 Usando clave: ${secretKey.substring(0, 12)}...`);

export default stripe;
