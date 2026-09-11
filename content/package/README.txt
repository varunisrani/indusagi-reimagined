# indusagi

> A terminal-first AI coding-agent framework — a unified multi-provider LLM gateway, an agent
> runtime with tool-calling, a built-in tool set, an MCP bridge, multi-agent crews, a SaaS-connector
> bridge, an agent-builder, and homegrown tracing. **Clean-room implementation.**

The `indusagi` npm package is the framework. The companion CLI agent ships separately as
`indusagi-coding-agent`. The framework is designed and written from scratch — its code reuses no
third-party application source. See [`PROVENANCE.md`](https://github.com/varunisrani/indusagi-ts)
for the independent-creation log.

This folder documents the public surface of `indusagi`: the capability layers, the CLI it bundles,
and every subpath export. For a hands-on walkthrough, start with [Getting Started](/docs/getting-started).

## Table of Contents

- [What it is](#what-it-is)
- [Capability layers](#capability-layers)
- [Install / build / test](#install--build--test)
- [Use the CLI](#use-the-cli)
- [Embed the framework](#embed-the-framework)
- [Documentation map](#documentation-map)

## What it is

`indusagi` is an ESM-only package (`"type": "module"`) that targets Node 20 or newer. Its public
surface is organized by capability layer; each layer is also reachable through its own subpath export
(for example `indusagi/llmgateway` or `indusagi/runtime`). The package also ships a CLI binary,
`indusagi` (`dist/cli.js`), that turns a command line into a running agent.

The root entry (`src/index.ts`) re-exports each layer as a namespace:

```ts
import { gateway, runtime, capabilities, interop, saas, swarm, smithy, tracing, shell } from "indusagi";
```

## Capability layers

Each layer is a self-contained subsystem with its own `index.ts` barrel and its own subpath export.

| Layer | Namespace | Subpath | Source dir | Responsibility |
|-------|-----------|---------|------------|----------------|
| LLM gateway | `gateway` | `indusagi/llmgateway` | `src/llmgateway` | Multi-provider dispatch (`stream`/`complete`), model catalog (`MODEL_CARDS`, `models`, `estimateCost`), connector registry, credential/PKCE plumbing |
| Agent runtime | `runtime` | `indusagi/runtime` | `src/runtime` | The host-facing `createAgent` factory, the FSM `cadence` step machine, session graph, compaction, and run-event ledger |
| Capabilities | `capabilities` | `indusagi/capabilities` | `src/capabilities` | The twelve built-in tools (read/write/edit/ls, grep/find, bash/process, todo_set/todo_read, websearch/webfetch), the `ToolRegistry` kernel, Node backends, and the `toolBox` assembler |
| Interop (MCP) | `interop` | `indusagi/interop` | `src/interop` | The Model Context Protocol bridge — client endpoints/fleets that graft remote tools, and a provider host that publishes the agent's own tools |
| SaaS connectors | `saas` | `indusagi/connectors-saas` | `src/connectors-saas` | The `SaasGateway` façade over a `SaasBackend` port, with the Composio adapter and a fluent `ScopePlanner` |
| Swarm | `swarm` | `indusagi/swarm` | `src/swarm` | Multi-agent crews — roster, dependency-aware ticket board, cursor mailbox, activity log, and git-worktree isolation |
| Smithy | `smithy` | `indusagi/smithy` | `src/smithy` | The agent-builder meta-tool: blueprints, profiles, knowledge pack, and the `Forge` build session |
| Tracing | `tracing` | `indusagi/tracing` | `src/tracing` | A homegrown, OTel-free span tracer — `Segment` values, a `Recorder`, sinks, redaction, and a runtime `RunEvent` bridge |
| Shell app | `shell` | `indusagi/shell-app` | `src/shell-app` | The CLI: `main` entry, boot-context assembler, flag parser, settings loader, and the print/wire/repl runners |

The framework also exposes a set of facade subpaths (`indusagi/ai`, `indusagi/agent`,
`indusagi/mcp`, `indusagi/memory`) and TUI subpaths (`indusagi/tui`, `indusagi/react-ink`,
`indusagi/react-host`). See [Package Exports](/docs/package-exports) for the complete map.

## Install / build / test

```bash
npm install
npm run typecheck     # tsc -p tsconfig.json --noEmit  (the type gate)
npm run test          # vitest --run
npm run build         # node build.mjs  (esbuild bundles + tsc declarations -> dist/)
npm run lineage-scan  # node scripts/lineage-scan.mjs  (source-hygiene gate)
```

`npm run prepublishOnly` chains the type gate, the test suite, and the build. The published tarball
ships `dist/`, `CHANGELOG.md`, `CREDITS.md`, `NOTICE`, and `README.md` (the `files` whitelist).

## Use the CLI

The package installs an `indusagi` binary that maps to `dist/cli.js`. Every flag is described once in
the shell app's flag table (`src/shell-app/invocation/flags.ts`); the parser selects one of the
`print`, `wire`, or `repl` runners.

```bash
node dist/cli.js --help                          # show usage and exit
node dist/cli.js -m <model> -p "explain this repo"  # one-shot print mode (-p / --print)
node dist/cli.js -m <model> --json               # JSON line protocol (wire/RPC mode)
node dist/cli.js -m <model>                       # interactive REPL (default)
```

Selected flags (see `--help` for the full table):

| Flag | Alias | Meaning |
|------|-------|---------|
| `--model` | `-m` | Choose the model by catalog id or alias |
| `--print` | `-p` | Emit a single answer to stdout and exit |
| `--json` | `--rpc`, `--wire` | Speak the JSON line protocol over stdio |
| `--interactive` | `-i` | Force the REPL even with a prompt present |
| `--mcp` | — | Attach an external MCP server (repeatable) |
| `--no-tools` | — | Disable every tool; the model may only produce text |
| `--system` | — | Override the system prompt |
| `--cwd` | — | Run as if started from this directory |
| `--help` | `-h` | Show usage and exit |
| `--version` | `-v` | Print the version and exit |

Set the provider key for your model (e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`).
Attach one or more MCP servers by repeating `--mcp`.

## Embed the framework

The root namespaces compose a runnable agent in a few lines. The runtime's `createAgent` takes an
`AgentConfig` (`model`, optional `tools`, `system`, `compaction`, …) and the capabilities layer's
`toolBox` assembles a runnable tool set backed by the real Node filesystem and shell.

```ts
import { runtime, capabilities } from "indusagi";

const agent = runtime.createAgent({
  model: "claude-sonnet-4",
  tools: capabilities.toolBox("coding"),
});

const snapshot = await agent.submit("list the TODOs in this repo");
console.log(snapshot.phase);
```

`agent.submit(...)` drives one prompt to settlement and resolves a `RunSnapshot`; `agent.subscribe`
taps the live `RunEvent` stream. See [Getting Started](/docs/getting-started) for a fuller example.

## Documentation map

- [Getting Started](/docs/getting-started) — install, build, CLI quickstart, and a tiny embedding example
- [Architecture](/docs/architecture) — how the capability layers fit together
- [Package Exports](/docs/package-exports) — the complete exports map and source mapping

### Subsystems

- [LLM Gateway](/docs/subsystems/llm-gateway)
- [Runtime](/docs/subsystems/runtime)
- [Capabilities](/docs/subsystems/capabilities)
- [Interop / MCP](/docs/subsystems/interop-mcp)
- [SaaS Connectors](/docs/subsystems/connectors-saas)
- [Swarm](/docs/subsystems/swarm)
- [Smithy](/docs/subsystems/smithy)
- [Tracing](/docs/subsystems/tracing)
- [Shell App](/docs/subsystems/shell-app)
- [React-Ink](/docs/subsystems/react-ink)

### Facades

- [AI](/docs/ai/README) — the `indusagi/ai` model facade
- [Agent](/docs/agent/README) — the `indusagi/agent` bot loop facade
- [MCP](/docs/mcp/README) — the `indusagi/mcp` client/server facade
- [Memory](/docs/memory/README) — the `indusagi/memory` facade
- [TUI](/docs/tui/README) — terminal-UI primitives

### Use cases

- [Security Testing](/docs/use-cases/security-testing) — authorized, defensive security workflows with the built-in tools

## License

MIT — see [`NOTICE`](https://github.com/varunisrani/indusagi-ts) and `CREDITS.md`.
