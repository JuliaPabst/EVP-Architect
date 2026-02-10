# UI MCP Server

Model Context Protocol (MCP) server for the kununu UI component library. This server exposes the Storybook components through MCP tools, allowing AI assistants to discover, query, and understand the available UI components.

## Features

- **List Components**: Browse all available UI components organized by category (atoms, molecules, organisms, compositions, hooks)
- **Component Details**: Get detailed information about specific components including props, types, and usage
- **Search**: Find components by name or keyword
- **Source Code**: Access component source code (TypeScript, SCSS, tests)

## Installation

```bash
cd ui-mcp-server
npm install
npm run build
```

## Usage

### Configure in Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ui-components": {
      "command": "node",
      "args": ["/Users/julia.pabst/Desktop/Bachelor thesis/ui-mcp-server/build/index.js"]
    }
  }
}
```

### Configure in VS Code with Copilot

Add to your VS Code settings (`.vscode/settings.json` or user settings):

```json
{
  "github.copilot.chat.mcp.servers": {
    "ui-components": {
      "command": "node",
      "args": ["/Users/julia.pabst/Desktop/Bachelor thesis/ui-mcp-server/build/index.js"]
    }
  }
}
```

## Available Tools

### `list_components`
List all available UI components, optionally filtered by category.

**Parameters:**
- `category` (optional): Filter by category - "atoms", "molecules", "organisms", "compositions", or "all" (default)

**Example:**
```
List all button-related components
```

### `get_component_info`
Get detailed information about a specific component.

**Parameters:**
- `componentName` (required): Name of the component (e.g., "Button", "Avatar")

**Example:**
```
Show me details about the Button component
```

### `search_components`
Search for components by name or keyword.

**Parameters:**
- `query` (required): Search term

**Example:**
```
Search for components related to "input"
```

### `get_component_source`
Retrieve the source code of a component.

**Parameters:**
- `componentName` (required): Name of the component
- `fileType` (optional): "tsx" (default), "scss", or "spec"

**Example:**
```
Show me the TypeScript source code for the Modal component
```

## Development

```bash
# Watch mode for development
npm run watch

# Run without building
npm run dev
```

## Project Structure

```
ui-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   └── componentScanner.ts   # Component discovery and parsing logic
├── build/                     # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

The server scans the `../ui/src` directory structure to discover components organized in:
- `atoms/` - Atomic design components (Button, Input, etc.)
- `molecules/` - Composite components (Autocomplete, Modal, etc.)
- `organisms/` - Complex UI sections (Header, Footer, etc.)
- `compositions/` - Complete UI compositions
- `hooks/` - Reusable React hooks

Each component directory typically contains:
- `index.tsx` - Component implementation
- `index.scss` - Component styles
- `index.spec.tsx` - Component tests

The server extracts prop types, JSDoc comments, and source code to provide comprehensive information about each component.
