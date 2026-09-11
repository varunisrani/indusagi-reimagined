# MCP (Model Context Protocol) Module Overview

> The `indusagi/mcp` subpath ships a self-contained MCP implementation (no external transport SDK). The newer clean-room `indusagi/interop` bridge wraps the official `@modelcontextprotocol/sdk` instead — see "The interop bridge" below.

The MCP module gives indusagi Model Context Protocol support: it connects to external MCP servers, lists their tools, and adapts those tools into `AgentTool` instances. It can also stand up an MCP server that exposes indusagi's own tools to outside clients.

Primary entrypoint: `indusagi/mcp`.

## Source Map

The `indusagi/mcp` subpath resolves to `src/facade/mcp.ts`, which re-exports everything from `src/facade/mcp-core/`:

- `src/facade/mcp.ts` - Facade; `export * from "./mcp-core/index"`
- `src/facade/mcp-core/index.ts` - Public exports + `initializeMCP` convenience function
- `src/facade/mcp-core/client.ts` - `MCPClient` for single-server connections (stdio + HTTP)
- `src/facade/mcp-core/client-pool.ts` - `MCPClientPool` for managing multiple servers
- `src/facade/mcp-core/server.ts` - `MCPServer` / `createMCPServer` to publish tools over stdio
- `src/facade/mcp-core/tool-factory.ts` - Convert MCP tools into `AgentTool`s
- `src/facade/mcp-core/config.ts` - Load/save server configuration files
- `src/facade/mcp-core/schema-converter.ts` - JSON Schema → TypeBox conversion
- `src/facade/mcp-core/types.ts` - Protocol and configuration type definitions
- `src/facade/mcp-core/errors.ts` - `MCPError`, `MCPErrorCode`, error factories

## Conceptual Flow

1. Configure MCP servers in a JSON config file (see "Configuration" below)
2. `loadMCPConfig(cwd)` reads and merges the config files into `MCPConnectionOptions[]`
3. Construct an `MCPClientPool({ servers })` and call `pool.connectAll()`
4. List tools per client with `client.listTools()`
5. Adapt MCP tools into `AgentTool`s with `registerMCPToolsInRegistry` (or `createMCPToolsMap` / `createMCPToolsRecord`)
6. Execute tools through the generated `AgentTool` or directly via `client.callTool(name, args)`
7. Tear down with `pool.disconnectAll()`

`initializeMCP(registry, cwd)` performs steps 2-5 in one call.

## What This Module Does

- Manages stdio (subprocess) and HTTP (Streamable HTTP / SSE-aware) connections to MCP servers
- Sends JSON-RPC 2.0 `initialize`, `tools/list`, `tools/call`, `resources/*`, and `prompts/*` requests
- Converts MCP tool `inputSchema` (JSON Schema) into TypeBox with passthrough so extra fields never fail validation
- Namespaces remote tools as `${serverName}_${toolName}` to avoid cross-server collisions
- Surfaces structured failures through `MCPError` + `MCPErrorCode`
- Exposes indusagi's own tools as an MCP server via `MCPServer`

## Core Exports

- **MCPClient** - one connection to one MCP server (stdio or HTTP)
- **MCPClientPool** - lifecycle and status for many servers
- **MCPServer** / **createMCPServer** - publish `AgentTool`s over stdio
- **registerMCPToolsInRegistry** / **createMCPToolsMap** / **createMCPToolsRecord** / **createMCPAgentToolFactory** - tool adaptation
- **loadMCPConfig** / **saveConfig** / **saveUserConfig** / **saveProjectConfig** - configuration
- **jsonSchemaToTypeBox** / **convertMCPInputSchema** / **convertMCPOutputSchema** / **applyPassthrough** - schema conversion
- **MCPError** / **MCPErrorCode** / **isMCPError** / **isSessionError** - error handling
- **initializeMCP** - one-call setup that connects servers and registers their tools

## The interop bridge (`indusagi/interop`)

The clean-room rebuild adds a separate, parallel MCP layer at `indusagi/interop` (source: `src/interop/`). It is built on the official `@modelcontextprotocol/sdk` rather than the hand-rolled JSON-RPC of `mcp-core`. It exposes:

- A *client* side: `ServerEndpoint` (one connection), `ServerFleet` (many endpoints with failure isolation), and `mountProtocolBridge` to graft remote tools into a kernel `ToolRegistry`.
- A *provider host* side: `createProviderHost(box)` stands up an SDK `Server` that publishes a runtime `ToolBox`'s tools to external clients.

The two layers are independent. `indusagi/mcp` integrates with the `AgentTool` / `ToolRegistry` facade; `indusagi/interop` integrates with the kernel's `capabilities` and `runtime` contracts. See the [API Reference](/docs/mcp/api-reference) for the full surface and the [Developer Guide](/docs/mcp/developer-guide) for usage.

## Quick Example

```typescript
import { initializeMCP } from "indusagi/mcp";
import { ToolRegistry } from "indusagi/agent";

const registry = new ToolRegistry();
const { pool, toolCount } = await initializeMCP(registry, process.cwd());

console.log(`Connected to ${pool.getAllClients().length} servers with ${toolCount} tools`);
```

For the full export list see the [API Reference](/docs/mcp/api-reference). For connecting clients and servers see the [Developer Guide](/docs/mcp/developer-guide).
