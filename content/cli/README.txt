# Indusagi Coding Agent

A terminal-first AI coding agent. Point it at a repo and it reads, writes, runs, and reasons about your code. It runs entirely on the [`indusagi`](https://www.npmjs.com/package/indusagi) framework — one dependency for the LLM API, agent loop, terminal UI, MCP client, and tracing.

Built from scratch: every module was written from a behavioral spec and the framework's public API, never by copying third-party application source.

## Install

```bash
npm install -g indusagi-coding-agent
```

This installs two bins that point at the same entry — use whichever you prefer:

```bash
indus       # start an interactive session in the current repo
indusagi    # identical bin
```

Requires **Node >= 20**.

## Quick Start

```bash
indus                                       # interactive session in the current repo
indus "fix the failing test in src/auth"    # interactive, with an opening prompt
indus -p "summarise what changed on this branch"   # headless, prints result, exits
indus --json                                # newline-delimited JSON line protocol
```

Authenticate by exporting a provider key (e.g. `ANTHROPIC_API_KEY`) or run `indus signin`. In an interactive session you can also use `/login`. See [Providers](providers.md).

## Modes

The entry resolves the invocation and selects one of three runners.

| Invocation | Mode | What it does |
|------------|------|--------------|
| `indus` | interactive | Ink/React REPL — streaming replies, a live tool deck, slash commands |
| `indus -p "…"` / `--print` | print | One request, prints the final result, exits |
| `indus --json` / `--rpc` | line protocol | Newline-delimited JSON for a parent process to drive |
| `indus signin` / `signout` | credentials | Store / clear a credential in the local auth vault |

`indus --help` / `-h` prints the generated flag reference; `indus --version` / `-v` prints the version. `--interactive` / `-i` forces the REPL even when a prompt is supplied. See [JSON Mode](json.md) and [RPC Mode](rpc.md) for the headless protocols.

## Key Features

- **Multi-provider support** — Anthropic, OpenAI, Google, xAI, Groq, Cerebras, Mistral, OpenRouter, and more (see [Providers](providers.md)).
- **Browser sign-in** — Anthropic (Claude), OpenAI (ChatGPT), and GitHub Copilot can be authenticated through the browser via `signin` / `/login`.
- **Built-in tools** — file read/write/edit, bash, grep, find, ls, web fetch, web search, task spawning, and todo tracking.
- **Session management** — branch, resume, and continue prior sessions; automatic context-window compaction.
- **MCP** — attach external MCP servers with `--mcp` or `/mcp`.
- **Extensible** — load extensions, skills, prompt templates, and themes ([Extensions](extensions.md), [Skills](skills.md), [Themes](themes.md)).

## Configuration paths

State lives under a single brand profile directory, `~/.indusagi/agent`:

| Path | Holds |
|------|-------|
| `~/.indusagi/agent/settings.json` | Global settings (all projects) |
| `.indusagi/settings.json` | Project settings (resolved against the working directory) |
| `~/.indusagi/agent/auth.json` | Credential vault (api keys and browser-sign-in tokens) |
| `~/.indusagi/agent/sessions/` | Saved sessions |

Set `INDUSAGI_CODING_AGENT_DIR` to relocate the entire profile directory. See [Settings](settings.md).

## Documentation Map

### Getting Started
- [Architecture](architecture.md) - Module map and the entry → boot → runner flow
- [Providers](providers.md) - Configure LLM providers and sign in
- [Settings](settings.md) - Global and project settings

### Modes & API
- [JSON Mode](json.md) - Scripting output
- [RPC Mode](rpc.md) - JSON-RPC integration
- [SDK Reference](sdk.md) - Programmatic usage

### Customization
- [Built-in Tools](tools.md) - Tools the model can call
- [Extensions](extensions.md) - Extend agent behavior
- [Skills](skills.md) - On-demand capability packages
- [Hooks](hooks.md) - Lifecycle interception
- [Subagents](subagents.md) - Spawn specialized agents
- [Prompt Templates](prompt-templates.md) - Custom prompts
- [Themes](themes.md) - UI theming
- [Packages](packages.md) - Share resources

### Session Management
- [Session Format](session.md) - File format and structure
- [Tree Navigation](tree.md) - Branch and navigate history
- [Compaction](compaction.md) - Context management
- [Memory](memory.md) - Working-memory buffer

### Configuration
- [Settings](settings.md) - All configuration options
- [Custom Models](models.md) - Custom and proxy model definitions
- [Custom Providers](custom-provider.md) - Provider registration via the framework
- [Keybindings](keybindings.md) - Keyboard shortcuts

### UI
- [TUI Components](tui.md) - Terminal UI
- [Terminal Setup](terminal-setup.md) - Terminal configuration

## License

MIT
