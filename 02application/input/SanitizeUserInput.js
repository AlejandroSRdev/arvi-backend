/**
 * Layer: Application
 * File: SanitizeUserInput.js
 * Responsibility:
 * Sanitizes and normalizes raw user input before any AI processing or energy calculation occurs.
 */

import { ValidationError } from '../../errors/Index.js';

/**
 * @param {string} rawInput - The raw user input string to sanitize
 * @returns {string} The sanitized and normalized string
 * @throws {ValidationError} If rawInput is not a string
 */
export function sanitizeUserInput(rawInput) {
  if (typeof rawInput !== 'string') {
    throw new ValidationError(
      `Invalid input type: expected string, received ${typeof rawInput}`
    );
  }

  let cleaned = rawInput.trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  const normalized = cleaned.toLowerCase();

  if (rawInput === normalized) {
    console.log('[SanitizeUserInput] Input already normalized – no changes applied');
  } else {
    console.log('[SanitizeUserInput] Input normalized');
  }

  return normalized;
}
