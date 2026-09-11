# induscode Overview

> `induscode` is a terminal-first AI coding agent for Python, built entirely on
> the [`indusagi`](/python) framework. Install it with `pip install induscode`,
> then run the `pindus` console — or `import induscode` and drive its subsystems
> from your own code.

`induscode` packages a complete coding agent: an interactive Textual console with
slash commands, branchable sessions, Model Context Protocol mounting, and a built-in
tool deck — all wrapped around the framework's LLM gateway and agent core. The CLI
binary is `pindus` (with `induscode` as an equivalent alias); the importable surface
is a lazy namespace barrel over seventeen subsystems.

## Table of Contents

- [Install](#install)
- [The pindus command](#the-pindus-command)
- [Feature Overview](#feature-overview)
- [CLI Flags](#cli-flags)
- [Slash Commands](#slash-commands)
- [Embedding induscode](#embedding-induscode)
- [Relationship to the framework](#relationship-to-the-framework)
- [Where to go next](#where-to-go-next)

## Install

```bash
pip install induscode
```

The single dependency is the framework, pinned with both extras it needs:

```toml
# from pyproject.toml
dependencies = [
  "indusagi[mcp,tui]>=0.1.2",   # framework + MCP + Textual TUI
  "markdown-it-py>=3.0",         # transcript-export markdown
  "pygments>=2.18",              # transcript-export highlighting
  "python-ulid>=2.7",            # bridge-ledger ULID keys
]
```

`induscode` requires **Python 3.11+**. Installing it registers two equivalent
console scripts, `pindus` (primary) and `induscode`, both wired to
`induscode.entry:run`. The `[mcp,tui]` extras are not optional — the framework's
`shell_app` barrel imports `mcp` and `textual` eagerly, and the agent's MCP
enrollment plus the Textual console need them anyway.

Confirm the install and read the version the way the runtime does — it is resolved
from package metadata via `importlib.metadata`, never hardcoded:

```python
import induscode

print(induscode.__version__)   # e.g. '0.1.2' when installed
print(induscode.VERSION)       # same value
```

For local development, editable-install the framework first, then the agent:

```bash
pip install -e ../indusagi-python-rebuild   # framework editable
pip install -e ".[dev]"                      # then the agent
pytest                                        # network-free test suite
```

## The pindus command

`pindus` is the command-line front door. The runner is selected from your flags
(`boot()` evaluates a `RUNNERS` tuple of `repl_runner`, `oneshot_runner`,
`link_runner` in order): a bare invocation opens the interactive Textual console;
`-p` runs one-shot print-and-exit; `--json` speaks the headless line protocol for a
driving parent process.

```bash
export ANTHROPIC_API_KEY=sk-ant-...

pindus                                  # interactive Textual console
pindus -p "explain this repo"           # one-shot print-and-exit
pindus -p --json "explain this repo"    # headless NDJSON line protocol
pindus -m claude-haiku-4-5 -p "hi"      # pick a model
pindus --list-models                    # browse the model / provider catalog
pindus --version                        # print the version and exit
```

Credentials are managed by the top-level `signin` / `signout` subcommands, which
bypass flag parsing:

```bash
pindus signin --list             # show stored accounts
pindus signin anthropic          # store an API key (API-key-first providers)
pindus signin openai             # paste-based OAuth (PKCE) for OAuth providers
pindus signout
```

Per-user state (settings, sessions, auth, logs) lives under `~/.pindusagi/` — the
flat profile root shared with the framework. Override it with
`INDUSAGI_CODING_AGENT_DIR`. The brand also reads `INDUSAGI_DEBUG` to unmute the
`[MCP]` transport-log filter `entry.run` installs.

## Feature Overview

| Feature | What it gives you | Docs |
|---------|-------------------|------|
| **Interactive console** | A Textual TUI over the framework's `react_ink` primitives: live transcript, composer, themes, dialogs. | [Console Overview](/python-cli/console/overview) |
| **Slash commands** | A pure, typed `/command` registry (transcript, workbench, integrations + dynamic skill/macro rows). | [Slash Commands](/python-cli/console/slash-commands) |
| **Sessions & branching** | Persisted, navigable transcripts — resume the last run, pick from history, branch a prior turn. | [Sessions](/python-cli/subsystems/sessions) |
| **Capability deck** | The built-in tool set (read/write/bash/edit/web/…) assembled from `CAPABILITY_CARDS`. | [Capability Deck](/python-cli/subsystems/capability-deck) |
| **MCP** | Mount external Model Context Protocol servers via `--mcp` or `/mcp`; an event-sourced bridge ledger. | [MCP](/python-cli/configuration/mcp) |
| **Headless link** | A JSON-RPC 2.0 / NDJSON protocol over stdio for a driving parent process (`--json`). | [Channels](/python-cli/subsystems/channels) |
| **Window budget** | The app's own context-window compaction engine feeding the conductor's condense seam. | [Window Budget](/python-cli/subsystems/window-budget) |
| **Transcript export** | Publish a run to standalone HTML (SGR painter + markdown-it-py + Pygments). | [Transcript Export](/python-cli/subsystems/transcript-export) |
| **Briefing** | Declarative system-prompt pipeline, `$arg` macros, and Agent-Skills `SKILL.md` cards. | [Briefing](/python-cli/subsystems/briefing) |
| **Addons** | A third-party customization contract: hook middleware, tool interceptors, contributed commands. | [Addons](/python-cli/subsystems/addons) |

Models and providers come from the framework catalog — see
[Models](/python-cli/configuration/models) and the framework's
[LLM Gateway](/python/subsystems/llm-gateway).

## CLI Flags

The single source of truth is the `FLAG_SPECS` table in `launch.invocation.flags`;
both the parser and the usage renderer walk it.

| Flag | Aliases | Kind | Purpose |
|------|---------|------|---------|
| `--print` | `-p` | boolean | Run a single request, print only the result, and exit |
| `--json` | `--rpc` | boolean | Speak the headless line protocol for a driving parent process |
| `--interactive` | `-i` | boolean | Force the interactive session even when a prompt is supplied |
| `--model` | `-m` | string | Select the model, provider-qualified or bare (e.g. `provider/name`) |
| `--account` | — | string | Authenticate the run with a named stored credential account |
| `--thinking` | — | string | Set the reasoning effort |
| `--list-models` | — | string | List the available models (optionally filtered by a substring) and exit |
| `--cwd` | — | string | Scope the run to a working directory (default: the current directory) |
| `--system` | — | string | Replace the built-in system prompt with the given text |
| `--append-system` | — | string | Append extra text after the system prompt |
| `--resume` | `-r` | boolean | Pick a previous session to resume |
| `--continue` | `-c` | boolean | Continue the most recent session in this directory |
| `--tools` | — | list | Allow only the named built-in tools (comma-separated or repeated) |
| `--no-tools` | — | boolean | Disable every built-in tool for this run |
| `--mcp` | — | list | Attach an external MCP server endpoint (comma-separated or repeated) |
| `--help` | `-h` | boolean | Show usage and exit |
| `--version` | `-v` | boolean | Show the version and exit |

See [CLI reference](/python-cli/reference/cli) for the full flag grammar and the
[Launch](/python-cli/subsystems/launch) subsystem for the parser internals.

## Slash Commands

Inside the interactive console, `/` opens the command palette. The catalog is
assembled in listing order — static transcript and workbench rows, then
integrations, then dynamic rows discovered from local skills and macros:

| Command | What it does |
|---------|--------------|
| `/help` | List the (dynamic) command catalog |
| `/clear`, `/new` | Reset the transcript / start a fresh session |
| `/resume`, `/session`, `/timeline` | Navigate persisted sessions and branches |
| `/branch`, `/name` | Branch a prior turn / rename the session |
| `/model`, `/models-for` | Switch model / show models for a capability |
| `/login`, `/logout`, `/keys` | Credential management from inside the console |
| `/mcp` | Inspect and mount MCP servers |
| `/memory` | View and edit agent memory |
| `/settings` | Browse and change preferences |
| `/summarize-context` | Compact the conversation window |
| `/export`, `/share`, `/copy` | Publish or copy the transcript |
| `/reload`, `/debug`, `/whats-new` | Reload addons, toggle diagnostics, changelog |
| `/exit`, `/quit` | Leave the console |

The registry itself is pure and typed — see [Slash Commands](/python-cli/console/slash-commands).

## Embedding induscode

`import induscode` is a lazy PEP-562 namespace barrel: each of the seventeen
subsystems is imported only on first attribute access, so the import stays cheap and
the Textual console is never pulled until you touch it. The only eager import is
`VERSION` from `workspace`.

```python
import induscode

print(induscode.VERSION)                    # eager
ws = induscode.workspace.create_workspace() # first touch imports workspace
reg = induscode.console_slash.build_registry([])  # console_slash imported lazily

>>> sorted(induscode.__all__)
['VERSION', '__version__', 'addons', 'boot', 'briefing', 'capability_deck',
 'channels', 'conductor', 'console', 'console_slash', 'insight', 'kit',
 'launch', 'runtime_bridge', 'sessions', 'settings', 'transcript_export',
 'window_budget', 'workspace']
```

The process entry, `induscode.entry`, exposes `main(argv) -> int` (returns rather
than raises, so tests can call it) and `run()` (the `[project.scripts]` shim, which
adds silent-EPIPE handling and `sys.exit`):

```python
from induscode.entry import main

exit_code = main(["--version"])   # installs the MCP-noise filter, asyncio.run(boot(...))
```

The brand record is the single source of identity truth:

```python
from induscode.workspace import BRAND, VERSION

print(BRAND.bin_names)         # ('pindus', 'induscode')
print(BRAND.profile_dir_name)  # '.pindusagi'
print(BRAND.env_prefix)        # 'INDUSAGI'
```

For the full export map and the entry shim, see
[Package Exports](/python-cli/reference/package-exports).

## Relationship to the framework

`induscode` is built **on top of** [`indusagi`](/python) and reuses it wholesale.
The framework supplies the LLM API abstraction, the [agent core](/python/facades/agent)
the conductor wraps, the [TUI primitives](/python/ui/react-ink) the console shell
renders over, the [MCP client](/python/facades/mcp), and observability. `induscode`
keeps only its own seams — the transcript tree, the auth vault, signal translation,
and the capability deck.

The brand composes `profile_dir_name` from the framework's own brand record so the
shared `~/.pindusagi` root can never drift, and `induscode.insight` is a thin wrapper
over [framework tracing](/python/subsystems/tracing) rather than a re-port. The model
and provider catalog is the framework's; see [framework runtime](/python/subsystems/runtime)
for the agent loop `induscode.conductor` drives.

## Where to go next

- [Getting Started](/python-cli/getting-started) — install, authenticate, first run
- [Architecture](/python-cli/architecture) — entry → boot → runners, and the subsystem map
- [Console Overview](/python-cli/console/overview) — the interactive shell and its dialogs
- [Conductor](/python-cli/subsystems/conductor) — the session core wrapping one Agent
- [Boot](/python-cli/subsystems/boot) — the launch pipeline and runner registry
- [Auth](/python-cli/configuration/auth) and [Settings](/python-cli/configuration/settings) — credentials and preferences
- [Parity](/python-cli/reference/parity) — the clean-room rebuild and its TS lineage
- [Testing](/python-cli/reference/testing) — the network-free suite

Notes:

- The package is `induscode` on PyPI; the console scripts are `pindus` (primary) and `induscode`.
- Requires **Python 3.11+**; the surface is `async`/`await` and snake_case throughout.
- State lives under `~/.pindusagi/` by default; relocate it with `INDUSAGI_CODING_AGENT_DIR`.
- The version is single-sourced from `pyproject.toml` and read back via `importlib.metadata` — never duplicated.
