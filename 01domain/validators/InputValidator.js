/**
 * Layer: Domain
 * File: InputValidator.js
 * Responsibility:
 * Validates the structural integrity of domain inputs required for AI interactions.
 */

export function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    return false;
  }

  return messages.every(msg =>
    msg.role && msg.content &&
    typeof msg.role === 'string' &&
    typeof msg.content === 'string'
  );
}

export default {
  validateMessages,
};
