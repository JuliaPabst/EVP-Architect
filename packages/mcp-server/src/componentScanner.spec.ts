import {describe, it, expect} from '@jest/globals';

/**
 * Basic smoke tests for componentScanner module
 * These tests verify the module can be imported and has the correct structure.
 */
describe('componentScanner', () => {
  describe('Module exports', () => {
    it('should export all required functions', async () => {
      const module = await import('./componentScanner.js');

      expect(module.scanComponents).toBeDefined();
      expect(module.getComponentInfo).toBeDefined();
      expect(module.searchComponents).toBeDefined();
      expect(module.getComponentSource).toBeDefined();

      expect(typeof module.scanComponents).toBe('function');
      expect(typeof module.getComponentInfo).toBe('function');
      expect(typeof module.searchComponents).toBe('function');
      expect(typeof module.getComponentSource).toBe('function');
    });
  });
});
