import generateSecureToken from './tokens';

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
