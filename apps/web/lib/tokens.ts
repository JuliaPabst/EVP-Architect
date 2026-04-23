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

/**
 * Hashes a token using SHA-256.
 *
 * @param token - Plain token to hash
 * @returns 64-char lowercase hex digest
 *
 * Purpose:
 *   Used to store a hash of the admin_token in the database instead of
 *   the plain token. The plain token stays in the URL hash and sessionStorage;
 *   only its hash is persisted to the DB.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
