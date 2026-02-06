// Input sanitation and normalization pipeline
// Responsible for validating, cleaning and normalizing raw user input strings
// before any token counting, energy calculation or LLM invocation occurs.

import { ValidationError } from '../application_errors/index.js';

/**
 * Sanitizes and normalizes raw user input.
 *
 * This function is:
 * - synchronous
 * - pure (no side effects)
 * - deterministic (same input always produces same output)
 * - reusable by any adapter (OpenAI, Gemini, future ones)
 *
 * @param {string} rawInput - The raw user input string to sanitize
 * @returns {string} The sanitized and normalized string
 * @throws {ValidationError} If rawInput is not a string
 */
export function sanitizeUserInput(rawInput) {
  // Step 1 — Type validation
  // Reject any input that is not a string
  if (typeof rawInput !== 'string') {
    throw new ValidationError(
      `Invalid input type: expected string, received ${typeof rawInput}`
    );
  }

  // Step 2 — Cleaning
  // Remove leading and trailing whitespace
  let cleaned = rawInput.trim();

  // Collapse excessive internal whitespace into a single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Step 3 — Normalization
  // Convert the entire string to lowercase
  const normalized = cleaned.toLowerCase();

  // Step 4 — Observability
  // Log whether normalization modified the input
  if (rawInput === normalized) {
    console.log('[SanitizeUserInput] Input already normalized – no changes applied');
  } else {
    console.log('[SanitizeUserInput] Input normalized');
  }

  return normalized;
}
