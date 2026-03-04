import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure random token.
 *
 * @param byteLength - Number of random bytes to generate (default: 32)
 * @returns A URL-safe base64 encoded string
 *
 * Purpose:
 *   Used to generate admin_token and survey_token for EVP projects.
 *   Tokens function as lightweight authentication without a login system.
 */
export default function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}
