#!/usr/bin/env node

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import {
  scanComponents,
  getComponentInfo,
  searchComponents,
  getComponentSource,
} from './componentScanner.js';

const UI_PATH = '../ui/src';

// Initialize the MCP server
const server = new Server(
  {
    name: 'ui-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'list_components',
    description:
      'List all available UI components from the kununu UI library, organized by category (atoms, molecules, organisms, compositions, hooks)',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by component category',
          enum: [
            'atoms',
            'molecules',
            'organisms',
            'compositions',
            'hooks',
            'all',
          ],
        },
      },
      required: [],
    },
  },
  {
    name: 'get_component_info',
    description:
      'Get detailed information about a specific component including its props, usage, and examples',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description:
            'The name of the component (e.g., "Button", "Avatar", "Modal")',
        },
      },
      required: ['componentName'],
    },
  },
  {
    name: 'search_components',
    description: 'Search for components by name or keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to find components',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_component_source',
    description: 'Get the source code of a specific component',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: 'The name of the component',
        },
        fileType: {
          type: 'string',
          description: 'Type of file to retrieve',
          enum: ['tsx', 'scss', 'spec'],
        },
      },
      required: ['componentName'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async request => {
  const {arguments: args, name} = request.params;

  try {
    switch (name) {
      case 'list_components': {
        const category = (args?.category as string) || 'all';
        const components = await scanComponents(UI_PATH, category);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(components, null, 2),
            },
          ],
        };
      }

      case 'get_component_info': {
        const componentName = args?.componentName as string;

        if (!componentName) {
          throw new Error('componentName is required');
        }
        const info = await getComponentInfo(UI_PATH, componentName);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case 'search_components': {
        const query = args?.query as string;

        if (!query) {
          throw new Error('query is required');
        }
        const results = await searchComponents(UI_PATH, query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_component_source': {
        const componentName = args?.componentName as string;
        const fileType = (args?.fileType as string) || 'tsx';

        if (!componentName) {
          throw new Error('componentName is required');
        }
        const source = await getComponentSource(
          UI_PATH,
          componentName,
          fileType,
        );

        return {
          content: [
            {
              type: 'text',
              text: source,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('UI MCP Server running on stdio');
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
