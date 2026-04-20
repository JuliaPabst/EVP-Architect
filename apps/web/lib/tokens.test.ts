import generateSecureToken, {hashToken} from './tokens';

describe('generateSecureToken', () => {
  it('should generate a token with default byte length', () => {
    const token = generateSecureToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate unique tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).not.toBe(token2);
  });

  it('should generate URL-safe tokens', () => {
    const token = generateSecureToken();

    // URL-safe base64 should not contain +, /, or =
    expect(token).not.toMatch(/[+/=]/);
  });

  it('should generate tokens with custom byte length', () => {
    const shortToken = generateSecureToken(16);
    const longToken = generateSecureToken(64);

    expect(shortToken.length).toBeLessThan(longToken.length);
  });

  it('should generate tokens of sufficient length', () => {
    const token = generateSecureToken(32);

    // 32 bytes = 43 base64url characters (approximately)
    expect(token.length).toBeGreaterThanOrEqual(40);
  });
});

describe('hashToken', () => {
  it('should return a 64-character lowercase hex string', () => {
    const hash = hashToken('my-secret-token');

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return a consistent hash for the same input', () => {
    const hash1 = hashToken('test-token');
    const hash2 = hashToken('test-token');

    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = hashToken('token-a');
    const hash2 = hashToken('token-b');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle an empty string without throwing', () => {
    const hash = hashToken('');

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
