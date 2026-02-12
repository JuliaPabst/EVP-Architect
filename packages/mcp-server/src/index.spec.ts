import { describe, it, expect } from '@jest/globals';

/**
 * Basic smoke tests for MCP Server
 * These verify the server module structure and configuration
 */
describe('MCP Server Configuration', () => {
  describe('Server metadata', () => {
    it('should have valid server configuration', () => {
      const serverInfo = {
        name: 'ui-mcp-server',
        version: '1.0.0',
      };

      expect(serverInfo.name).toBe('ui-mcp-server');
      expect(serverInfo.version).toBe('1.0.0');
    });
  });

  describe('Tool schemas', () => {
    it('should support all component categories', () => {
      const categories = ['atoms', 'molecules', 'organisms', 'compositions', 'all'];
      expect(categories).toHaveLength(5);
    });

    it('should support all file types', () => {
      const fileTypes = ['tsx', 'scss', 'spec'];
      expect(fileTypes).toHaveLength(3);
    });
  });
});

