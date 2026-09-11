# indusagi (Python) Overview

> `indusagi` is a terminal-first AI coding-agent framework for Python. It ships both
> the `pindusagi` CLI and an embeddable library surface organized by capability layer,
> imported as `import indusagi` (with lazy subsystem aliases) or per-layer
> (`import indusagi.runtime`, `import indusagi.llmgateway`, ...).

## Table of Contents

- [What it is](#what-it-is)
- [Install](#install)
- [Quickstart](#quickstart)
- [What's inside](#whats-inside)
- [The import surface](#the-import-surface)
- [Models and providers](#models-and-providers)
- [Where to next](#where-to-next)

## What it is

`indusagi` is a toolkit, not a single product. The same package gives you a runnable
coding agent on the command line (`pindusagi`) and the building blocks to embed an
agent in your own code: a multi-provider LLM gateway, a pure agent runtime, a built-in
tool kernel, an MCP bridge, SaaS connectors, multi-agent swarm coordination, an
agent-builder, tracing, and a Textual-based terminal UI.

Everything is `async`/`await`, fully typed, and snake_case. It requires **Python 3.11
or newer**. The top-level `indusagi` package is a thin namespace: it eagerly binds only
`VERSION` / `__version__` and lazily re-exports the subsystems on first attribute access.

## Install

```bash
# core only (httpx, pydantic, wcwidth, python-ulid, regex)
pip install indusagi

# with the interactive Textual TUI and MCP server mounting
pip install "indusagi[mcp,tui]"
```

| Extra | Pulls in | Enables |
|-------|----------|---------|
| `tui` | `textual`, `pygments`, `markdown-it-py` | The interactive REPL and rendered terminal UI |
| `mcp` | `mcp` | Mounting and hosting Model Context Protocol servers |
| `dev` | `pytest`, `pytest-asyncio`, `respx` | Running the test suite from a checkout |

Installing the package also provides two console scripts, `indusagi` and `pindusagi`
(both map to `indusagi.shell_app.cli:run`). The version is declared once in
`pyproject.toml` and read at runtime via `importlib.metadata`; code never hardcodes it.

## Quickstart

Set the provider key for the model you intend to run, then invoke the CLI. The runner
is chosen from your flags: `-p` for one-shot print mode, `--json` for the NDJSON wire
protocol, and the bare invocation for the interactive TUI.

```bash
export ANTHROPIC_API_KEY="sk-..."

pindusagi --version                       # prints: indusagi 0.1.2
pindusagi -p "summarize this repo"        # one-shot print mode, then exit
pindusagi --json                          # NDJSON wire protocol over stdio
pindusagi                                 # interactive Textual TUI (needs [tui])
pindusagi auth login                      # OAuth + PKCE login
```

Embedding is two layers: the `runtime` (which owns `create_agent`) and the
`capabilities` layer (which assembles a runnable tool set).

```python
import asyncio
from indusagi.runtime import create_agent
from indusagi.capabilities import tool_box

async def main() -> None:
    agent = create_agent({
        "model": "claude-sonnet-4-5",
        "tools": tool_box("coding"),       # "read_only" | "coding" | "all"
    })
    snapshot = await agent.submit("list the TODO comments in this repo")
    print(snapshot.phase)

asyncio.run(main())
```

State lives under `~/.pindusagi` by default; override it with the `INDUSAGI_HOME`
environment variable. See [Getting Started](/python/getting-started) for the full
embedding and CLI walkthrough.

## What's inside

The framework is a layered stack. Each layer is a real subpackage with an explicit,
frozen public surface, and each is importable on its own:

| Layer | Module | Holds |
|-------|--------|-------|
| LLM core | `indusagi.llmgateway` | Model catalog, the frozen type contract, `stream`/`complete` dispatch, connector registry. Single source of truth for gateway types. |
| Runtime | `indusagi.runtime` | `create_agent`, the `RunSnapshot`/`RunEvent`/`AgentConfig` vocabulary, and the pure cadence/step transition machine. |
| Tools | `indusagi.capabilities` | The `define_tool` kernel, the built-in tool objects (read/write/edit/ls/grep/find/bash/process/todo/web), local backends, and `tool_box`. |
| MCP bridge | `indusagi.interop` | Server endpoints and fleets (client side) plus a provider host, contract types, and `ProtocolFault`. |
| Connectors | `indusagi.connectors` | The `SaasGateway` façade, the `SaasBackend` port, the Composio adapter, and the fluent `ScopePlanner`. |
| Swarm | `indusagi.swarm` | `create_crew`/`Crew` and roster / workboard / mailbox / git-worktree isolation / telemetry services. |
| Smithy | `indusagi.smithy` | The agent-builder meta-tool: `FlagReader`, `AgentBlueprint`/`PROFILES`, `KnowledgePack`, and the `Forge` build session. |
| Tracing | `indusagi.tracing` | A homegrown, OTel-free tracer: signal / channel / redaction / sinks / recorder / registry / adapter. |
| CLI | `indusagi.shell_app` | The application: `main`/`run`, the runner registry, invocation parser, settings, upgrades, and `auth`. |
| UI | `indusagi.tui` / `react_ink` / `ui_bridge` / `react_host` | TUI primitives (textual-free), the Textual component library, the on-screen bridge, and the backend Protocol seam. |

Three **facades** preserve the original TypeScript vocabulary as thin shims over the
core for migrating code: `indusagi.ai` (over `llmgateway`), `indusagi.agent`
(over `runtime` + `capabilities`), and `indusagi.mcp` (over `interop`, keeping
camelCase names). `indusagi.memory` is an intentional empty stub for layout parity —
real conversational memory lives in `indusagi.runtime`.

## The import surface

The root package binds only the version eagerly; every subsystem resolves lazily so
importing `indusagi` never drags in `textual` or `mcp`.

| Name | Kind | Source | Purpose |
|------|------|--------|---------|
| `VERSION` / `__version__` | const | `__init__.py` | Read from `importlib.metadata`; falls back to `"0.0.0.dev0"` in an uninstalled source tree. The only eager exports. |
| `__getattr__` | function | `__init__.py` | PEP-562 lazy alias resolution: imports the target subpackage on first access. |

The lazy aliases mirror the layered map (a few use friendlier names than the underlying
module):

```python
import indusagi

print(indusagi.VERSION)        # "0.1.2" (or "0.0.0.dev0" from a source tree)

gateway = indusagi.gateway     # -> indusagi.llmgateway
saas    = indusagi.saas        # -> indusagi.connectors
shell   = indusagi.shell       # -> indusagi.shell_app
print(gateway.__name__)        # 'indusagi.llmgateway'

# NOTE: `from indusagi import stream` FAILS — the root exports only VERSION /
# __version__. Import from the subpackage instead: from indusagi.llmgateway import stream
```

Full alias table and per-layer `__all__` lists: [Package Exports](/python/reference/package-exports).

## Models and providers

The gateway routes **841 models across 24 providers** out of a single catalog. Resolve
a model id to a card, query the catalog fluently, and estimate cost — all without a
network call:

```python
from indusagi.llmgateway import models, get_card, estimate_cost

card = get_card("claude-sonnet-4-5")          # context window / pricing / wire dialect
if card:
    cost = estimate_cost(card, {"input_tokens": 1000, "output_tokens": 500})

for c in models():                            # fluent query over the catalog
    ...
```

Dispatch (`stream` / `complete`) takes a model id, a `Conversation`, and optional
`StreamOptions`; unknown ids fail fast with an `unsupported` `GatewayError`. See the
[LLM Gateway](/python/subsystems/llm-gateway) for the contract and connector details.

## Where to next

- [Getting Started](/python/getting-started) — install, embed, and run the CLI.
- [Architecture](/python/architecture) — how the layers fit together.
- [LLM Gateway](/python/subsystems/llm-gateway) — the model core and type contract.
- [Runtime](/python/subsystems/runtime) — `create_agent` and the conversation loop.
- [Capabilities](/python/subsystems/capabilities) — the built-in tool kernel.
- [Interop](/python/subsystems/interop) and [Connectors](/python/subsystems/connectors) — MCP and SaaS bridges.
- [Swarm](/python/subsystems/swarm) and [Smithy](/python/subsystems/smithy) — multi-agent coordination and the agent builder.
- Facades: [ai](/python/facades/ai), [agent](/python/facades/agent), [mcp](/python/facades/mcp), [memory](/python/facades/memory).
- UI: [TUI primitives](/python/ui/tui), [react-ink](/python/ui/react-ink), [ui-bridge](/python/ui/ui-bridge).
- Reference: [CLI](/python/reference/cli), [Package Exports](/python/reference/package-exports), [Examples](/python/reference/examples), [Parity](/python/reference/parity).
