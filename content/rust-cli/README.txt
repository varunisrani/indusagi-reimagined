# induscode (Rust) Overview

> `induscode` is the 100%-Rust edition of the terminal-first AI coding agent, built
> entirely on the published [`indusagi`](/rust) framework crate. Install it with
> `cargo install induscode` to get two equivalent commands — `indusr` and `indusagir`
> — that launch the same agent: a ratatui REPL, a headless print/JSON channel, the
> capability deck, branchable sessions, and MCP mounting. It is built from scratch in
> Rust, never transliterated from the [TypeScript](/cli) or [Python](/python-cli) editions.

`induscode` is shipped as **one merged product crate** (`crates/induscode`): every
former `induscode-*` library crate is now a `pub mod` under `src/`, and the framework
arrives as the single published `indusagi` umbrella crate (replacing 13 former
`indusagi-*` path deps). Two `[[bin]]` targets — `indusr` and `indusagir` — share one
`async fn main() -> ExitCode` in `src/bin/main.rs`; the live brand is whichever name
the OS launched under. The library surface is `induscode::<module>` (e.g.
`induscode::boot`, `induscode::conductor`); the framework is reached as
`indusagi::<module>`.

## Table of Contents

- [Install](#install)
- [The indusr command](#the-indusr-command)
- [Feature Overview](#feature-overview)
- [CLI Flags](#cli-flags)
- [Slash Commands](#slash-commands)
- [The Binary Entry](#the-binary-entry)
- [Crate Layout](#crate-layout)
- [Build](#build)
- [Relationship to the framework](#relationship-to-the-framework)
- [Parity with the TS and Python editions](#parity-with-the-ts-and-python-editions)
- [Where to go next](#where-to-go-next)

## Install

```bash
cargo install induscode          # the CLI — installs indusr + indusagir
cargo binstall induscode         # prebuilt binary (no compile)
cargo add induscode              # the library — depend on the agent (induscode::<module>)
```

`induscode` is published to crates.io as one crate that is **both** a library and a binary.
`cargo install induscode` installs the CLI; `cargo add induscode` adds it as a library
dependency (surface `induscode::<module>`, e.g. `induscode::boot`, `induscode::conductor`).
Installing it registers **two bin targets**, both pointing at `src/bin/main.rs`:

```toml
# crates/induscode/Cargo.toml
[[bin]]
name = "indusr"
path = "src/bin/main.rs"

[[bin]]
name = "indusagir"
path = "src/bin/main.rs"
```

Both launch the identical agent — use whichever name you prefer. The toolchain floor
is **edition 2024, MSRV 1.96** (matching the framework's `rust-toolchain.toml` pin).

Authenticate by exporting a provider key (`ANTHROPIC_API_KEY`, etc.) or by storing
one in the local vault:

```bash
indusr signin anthropic          # store an API key interactively (echo muted)
indusr auth status               # show which providers are signed in
```

The version is single-sourced from `Cargo.toml` and read back at compile time
(`VERSION == env!("CARGO_PKG_VERSION")`) — never duplicated as a string literal,
a rule enforced by the `cargo run -p xtask -- version` gate.

## The indusr command

The runner is selected from your flags inside [`boot::boot_run`](/rust-cli/subsystems/boot);
a bare invocation opens the interactive ratatui console, `-p`/`--print` runs one-shot
print-and-exit, and `--json` speaks the headless NDJSON / JSON-RPC line protocol for a
driving parent process.

```bash
export ANTHROPIC_API_KEY=sk-ant-...

indusr                                  # interactive ratatui console (current repo)
indusr "fix the failing test in src/auth"
indusr -p "summarise what changed on this branch"   # one-shot print, then exit
indusr --json                           # NDJSON line protocol for a parent process
indusr -m anthropic/claude-sonnet-4-5 -p "hi"       # pick a model
indusr --list-models                    # browse the model / provider catalog
indusr --version                        # print "<app name> <version>" and exit
```

| Invocation | Mode | What it does |
|---|---|---|
| `indusr` | interactive | ratatui REPL — streaming replies, a live tool deck, slash commands |
| `indusr -p "…"` / `--print` | print | one request, prints the final result, exits |
| `indusr --json` | line protocol | newline-delimited JSON for a parent process to drive |
| `indusr auth login` / `status` | credentials | store / inspect credentials in the local auth vault |

### No-session verbs

Several leading verbs are intercepted by `route()` in `main.rs` **before** the boot
handoff — they never need a session, and boot would otherwise drop them into the REPL:

| Verb | Owner | What it does |
|---|---|---|
| `signin <provider>` | agent vault | Interactive API-key login (defaults to `--method api-key`) |
| `signout <provider>` | agent vault | Remove a stored credential for a provider |
| `auth login \| refresh \| help` | framework `indusagi::shell_app::auth_cli` | Browser (OAuth/PKCE) flows |
| `auth status [provider]` | agent vault reader | Reconciles framework + multi-account vault shapes |
| `auth logout` | agent `signout` path | The framework `auth` command has no logout verb |
| `install \| remove \| update \| list \| config` | `induscode::launch::pickers` | The extension-package surface over `PreferenceStore` |
| `--list-models [filter]` | `induscode::launch::catalog` | Prints the model catalog over the live gateway cards |

Because the shipped OAuth client ids are unconfigured sentinels in a default build,
`signin <provider>` auto-appends `--method api-key` so it lands on the working
API-key prompt; pass `--method oauth` (or `--oauth`) to opt into the browser flow.

## Feature Overview

Every subsystem is a `pub mod` of the merged crate. Each links to its own page under
`/rust-cli`.

| Feature | Module | What it gives you | Docs |
|---|---|---|---|
| **Launch front door** | `launch` | The single `FLAG_SPECS` table, the tolerant argv reader, `@file` attachments, the credential vault, OAuth flows, the model catalog, and pickers. | [Launch](/rust-cli/subsystems/launch) |
| **Boot pipeline** | `boot` | `boot_run(argv, BootIo) -> ExitCode`: short-circuit verbs, stage pipeline, runner selection, upgrade fold, always-drained closables. | [Boot](/rust-cli/subsystems/boot) |
| **Conductor** | `conductor` | The session core — wraps one `indusagi::runtime::Agent`, projects `RunEvent` into a stable `SessionSignal` stream, branchable transcript, fault/retry, fallback model, compaction. | [Conductor](/rust-cli/subsystems/conductor) |
| **Window budget** | `window_budget` | Token measurement, `is_over_budget` gating, slice planning, and `create_condenser` → the conductor's `CondenseFn`. | [Window Budget](/rust-cli/subsystems/window-budget) |
| **Capability deck** | `deck` | The tool registry over `indusagi::capabilities` (read/write/bash/edit/grep/find/websearch/webfetch/todo/process) + in-deck cards + the MCP bridge ledger. | [Capability Deck](/rust-cli/subsystems/capability-deck) |
| **Runtime bridge** | `runtime_bridge` | Per-model routing — framework gateway vs. an external child runtime — as a `ModelInvoker`, plus tracing-sink wiring. | [Runtime Bridge](/rust-cli/subsystems/runtime-bridge) |
| **Addons** | `addons` | The loadable-extension contract: hooks, tool interceptors, contributed commands/tools, tiered TOML/subprocess loader. | [Addons](/rust-cli/subsystems/addons) |
| **Console (UI)** | `console` | The interactive ratatui surface: one immutable `ConsoleState`, a pure `console_reducer`, immediate-mode `draw`, 13 overlays, `mount_console`. | [Console Overview](/rust-cli/console/overview) |
| **Channels** | `channels` | The non-interactive surfaces: the one-shot text/NDJSON channel and the long-lived JSON-RPC 2.0 link server over the NDJSON framer. | [Channels](/rust-cli/subsystems/channels) |
| **Briefing** | `briefing` | The budget-aware system-prompt assembler: section composer, `CLAUDE.md`/`AGENTS.md` context docs, `$arg` macros, `SKILL.md` cards. | [Briefing](/rust-cli/subsystems/briefing) |
| **Transcript export** | `transcript_export` | The publish-time HTML/Markdown builder: the SGR machine, WCAG `theme_bridge`, page template, `publish`. | [Transcript Export](/rust-cli/subsystems/transcript-export) |
| **Insight** | `insight` | The observability plane over `indusagi::tracing`: probe/signal vocab, NDJSON serialize/replay, an agent scrubber, a fan-out channel and collector sink. | [Insight](/rust-cli/subsystems/insight) |
| **Core** | `core` | The `BRAND` record, single-source `VERSION`, `BIN_NAMES`, `create_workspace`, `PreferenceStore`, plus the folded `kit` / `settings` / `sessions` leaves and lineage `guardrails`. | [Core](/rust-cli/reference/core) |

Models and providers come from the framework catalog — see the framework's
[LLM Gateway](/rust/subsystems/llm-gateway) and the agent's
[Models reference](/rust-cli/configuration/models).

## CLI Flags

The single source of truth is `launch::flags::flag_specs()` — a `&[FlagSpec]` walked
by **both** the parser (`launch::parser::read_invocation`) and the usage renderer
(`launch::usage::render_usage`), so `--help` can never drift from what the parser
accepts. Each entry carries a canonical `name`, `aliases`, a `FlagKind` (`Boolean`
| `String` | `Number` | `List`), a `FlagGroup` usage section, and a `describe`
string:

```rust
// crates/induscode/src/launch/flags.rs
pub struct FlagSpec {
    /// Canonical long spelling, leading dashes included (e.g. "--model").
    pub name: &'static str,
    /// Alias spellings; all alias hits normalise to `name` ("--rpc" → "--json").
    pub aliases: &'static [&'static str],
    pub kind: FlagKind,           // Boolean | String | Number | List
    pub group: FlagGroup,         // Output | Model | Context | Tools | Meta (usage section)
    pub describe: &'static str,
}
```

The full 18-flag grammar (`describe` strings copied verbatim from source, except
`--thinking`, whose text is computed at startup from the `THINKING_EFFORTS` rungs):

| Flag | Aliases | Kind | Purpose |
|---|---|---|---|
| `--print` | `-p` | Boolean | Run a single request, print only the result, and exit. |
| `--json` | `--rpc` | Boolean | Speak the headless line protocol for a driving parent process. |
| `--interactive` | `-i` | Boolean | Force the interactive session even when a prompt is supplied. |
| `--model` | `-m` | String | Select the model, provider-qualified or bare (e.g. `provider/name`). |
| `--fallback-model` | — | String | Model to switch to mid-turn when the selected model is overloaded (HTTP 529). |
| `--account` | — | String | Authenticate the run with a named stored credential account. |
| `--thinking` | — | String | Set the reasoning effort (one of: …) — the rungs are interpolated from `THINKING_EFFORTS`. |
| `--list-models` | — | String | List the available models (optionally filtered by a substring) and exit. |
| `--cwd` | — | String | Scope the run to a working directory (default: the current directory). |
| `--system` | — | String | Replace the built-in system prompt with the given text. |
| `--append-system` | — | String | Append extra text after the system prompt. |
| `--resume` | `-r` | Boolean | Pick a previous session to resume. |
| `--continue` | `-c` | Boolean | Continue the most recent session in this directory. |
| `--tools` | — | List | Allow only the named built-in tools (comma-separated or repeated). |
| `--no-tools` | — | Boolean | Disable every built-in tool for this run. |
| `--mcp` | — | List | Attach an external MCP server endpoint (comma-separated or repeated). |
| `--help` | `-h` | Boolean | Show this usage and exit. |
| `--version` | `-v` | Boolean | Show the version and exit. |

The reader is deliberately **tolerant** of unknown flags (the extension-flag escape
hatch), so the agent's exit-2 usage convention is enforced separately by
`unknown_leading_flag()` in `main.rs`: an unrecognized **leading** `-…` token reports
on stderr and exits `2`. See [Launch](/rust-cli/subsystems/launch) for the parser
internals and `@file` attachment inlining.

## Slash Commands

Inside the interactive console, `/` opens the command palette. The catalog is built
by `console::slash::build_catalog(&DynamicCommandSources)` — static rows first, then
dynamic rows discovered from local skills and macros. The static `SlashCommand` set
(by registered `name`):

| Command | What it does |
|---|---|
| `/help` | List the command catalog |
| `/clear`, `/new` | Reset the transcript / start a fresh session |
| `/resume`, `/session`, `/timeline` | Navigate persisted sessions and branches |
| `/branch`, `/name` | Branch a prior turn / rename the session |
| `/model`, `/models-for` | Switch model / show models for a capability |
| `/thinking` | Set the reasoning effort |
| `/login`, `/logout`, `/keys` | Credential management from inside the console |
| `/mcp` | Inspect and mount MCP servers |
| `/memory` | View and edit agent memory |
| `/composio` | SaaS connector actions |
| `/settings` | Browse and change preferences |
| `/summarize-context` | Compact the conversation window |
| `/cost` | Show token / cost accounting for the session |
| `/plan` | Toggle plan mode |
| `/export`, `/share`, `/copy` | Publish or copy the transcript |
| `/reload`, `/debug`, `/whats-new` | Reload addons, toggle diagnostics, changelog |
| `/exit`, `/quit` | Leave the console |

The registry is pure and typed (`SlashCommand` / `SlashContext` / `SlashOutcome`) —
see [Slash Commands](/rust-cli/console/slash-commands).

## The Binary Entry

`src/bin/main.rs` is the single OS exit point — `async fn main() -> ExitCode` is the
only place an exit code reaches the OS. Returning `ExitCode` (rather than calling
`process::exit`) lets the tokio runtime drain and destructors run, so the terminal's
raw / alt-screen mode is restored on the way out. `main` does three things in order:

1. **Brand off `argv[0]`'s basename** — `resolve_brand()` picks `indus` or `indusagi`
   from `BIN_NAMES`, falling back to `BIN_NAMES[0]` (`"indus"`) for a renamed symlink
   or a missing `argv[0]`. (A `.exe` suffix is stripped so a Windows launch still
   brands.)
2. **Install the single `[MCP]` console-noise filter** — `install_mcp_noise_filter()`
   is idempotent and a no-op when the debug env var (`indusagi::core::env_name("debug")`
   → `INDUSAGI_DEBUG`) is set, so diagnostics are never hidden.
3. **Route the remaining argv** — `route()` short-circuits `auth`, the meta flags
   (`--help`/`--version`), `signin`/`signout`, the package verbs, and `--list-models`,
   then hands every real run to `boot_run`.

```rust
// crates/induscode/src/bin/main.rs
#[tokio::main]
async fn main() -> ExitCode {
    let mut args = std::env::args();
    let argv0 = args.next();
    let brand = resolve_brand(argv0.as_deref());
    install_mcp_noise_filter();
    let rest: Vec<String> = args.collect();
    route(brand, rest).await
}
```

The boot handoff is `boot_run(rest, production_io()).await`, where `production_io()`
builds a `BootIo { output, input }` over a stdout/stderr `OutputSink` and a
blocking-stdin `InputSource`. `boot_run`'s resolved `ExitCode` is adopted unchanged.

## Crate Layout

The agent is **one virtual Cargo workspace** (`members = ["crates/induscode",
"crates/induscode-testkit", "xtask"]`). The 13 former `induscode-*` library crates
and the former `induscode-cli` are all merged into the single `induscode` crate; the
framework is the one published `indusagi` umbrella crate (`version = "0.1.0"`):

```toml
# crates/induscode/Cargo.toml
[dependencies]
indusagi = { version = "0.1.0", features = ["swarm"] }
```

The module map (former crate → `pub mod`) declared in `src/lib.rs`:

| Former crate | `pub mod` | Responsibility |
|---|---|---|
| `induscode-core` | `core` | brand, `VERSION`, `BIN_NAMES`, workspace, settings, sessions, kit, guardrails |
| `induscode-launch` | `launch` | flag grammar / usage, `@file`, credentials, OAuth, model catalog, pickers |
| `induscode-boot` | `boot` | argv → invocation, workspace prep, runner selection, upgrades |
| `induscode-conductor` | `conductor` | the conversation loop — turns, tools, fault/retry, branch/resume, compaction |
| `induscode-window-budget` | `window_budget` | token accounting + context-window compaction policy |
| `induscode-deck` | `deck` | the tool registry + in-deck cards + MCP bridge |
| `induscode-runtime-bridge` | `runtime_bridge` | framework / external-runtime model routing |
| `induscode-addons` | `addons` | loadable extensions: hooks, interceptors, commands, tools |
| `induscode-console` | `console` | the interactive ratatui surface |
| `induscode-channels` | `channels` | print + line-protocol headless surfaces |
| `induscode-briefing` | `briefing` | system-prompt / context assembly |
| `induscode-transcript-export` | `transcript_export` | session persistence + HTML/Markdown export |
| `induscode-insight` | `insight` | tracing, sinks, replay, secret redaction |

Cargo feature gates (defaults `["rustls", "mcp", "tui", "oauth"]`): `tui` pulls the
framework render layer for the console; `mcp` forwards to `indusagi/mcp`; `swarm`
gates subagent delegation; `composio` adds the SaaS adapter; `cli-bridges` gates the
external-runtime child transport; `mimalloc` is an opt-in global allocator. A headless
build drops the console entirely (see below).

## Build

```bash
cargo build --workspace
cargo build --release -p induscode          # the release/dist profile (lto)

# headless — no console / no render layer:
cargo build -p induscode --no-default-features --features "rustls,anthropic"

# repo automation (clean-room + single-source gates):
cargo run -p xtask -- lineage               # source-hygiene gate
cargo run -p xtask -- version               # literal-VERSION single-source gate
```

The clean-room posture is enforced as blocking gates: `xtask lineage` exits non-zero
if any provenance marker appears in non-test source, `xtask framework-via-deps`
asserts the framework is reached only through declared crate deps, and `xtask version`
forbids any string-literal version outside `Cargo.toml`.

## Relationship to the framework

`induscode` is built **on top of** the [`indusagi`](/rust) framework crate and reuses
it wholesale. The framework supplies the LLM gateway, the [agent loop](/rust/subsystems/runtime)
the conductor wraps (`indusagi::runtime::Agent` + the `ModelInvoker` seam), the
[TUI primitives](/rust/ui/tui) the console renders over (`indusagi::tui` /
`indusagi::tui_render`), the [MCP client](/rust/subsystems/interop), the
[capabilities](/rust/subsystems/capabilities) the deck manages, and
[tracing](/rust/subsystems/tracing) that `insight` wraps. Every framework module is
reached as `indusagi::<module>` (`core`, `runtime`, `llmgateway`, `tracing`,
`capabilities`, `tui`, `interop`, `connectors_saas`, `swarm`, `smithy`, `tui_render`,
`facade`, `shell_app`).

The boundary is sharp: the conductor projects the framework's coarse 7-event
`RunEvent` stream into its own stable `SessionSignal` stream so the product surface
evolves independently; the deck *manages* the framework's native tools rather than
re-authoring them; the `auth` subcommand delegates `login`/`refresh`/`help` to
`indusagi::shell_app::auth_cli::run_auth_command`, while `auth status` and `auth
logout` are handled by the agent's own multi-account vault (`classify_auth_verb` in
`main.rs` routes `status` → the agent reader and `logout` → the agent `signout`
path, because the framework command can neither see api-key sign-ins nor log out).
The brand reads `env_name("debug")` from the framework so the agent and framework
agree on the env prefix.

## Parity with the TS and Python editions

`induscode` is the third edition of the same coding agent, reverse-engineered to a
behavioral spec — never transliterated:

| Edition | Package | Bins | Framework | Docs |
|---|---|---|---|---|
| TypeScript | `indusagi-coding-agent` | `indus` / `indusagi` | [`indusagi`](/cli) (npm) | [TS CLI](/cli) |
| Python | `induscode` (PyPI) | `pindus` / `induscode` | [`indusagi`](/python-cli) (PyPI) | [Python CLI](/python-cli) |
| Rust | `induscode` (crates.io) | `indusr` / `indusagir` | [`indusagi`](/rust-cli) (crates.io) | this page |

The three share the same surface — the `FLAG_SPECS` flag grammar, the slash-command
catalog, the runner trio (interactive / print / line-protocol), and the boot
short-circuit verbs. The differences are idiomatic to each language: the Rust edition
is a single merged crate of `pub mod`s (vs. the Python lazy PEP-562 barrel and the TS
two-package split), it returns `ExitCode` rather than calling `process::exit`, and the
console is immediate-mode ratatui over a pure reducer rather than Ink/React or
Textual. See the TS [`/cli`](/cli) and Python [`/python-cli`](/python-cli) overviews
for the matching surface in those languages.

## Where to go next

- [Boot](/rust-cli/subsystems/boot) — the launch pipeline and runner registry
- [Launch](/rust-cli/subsystems/launch) — the flag grammar, credentials, model catalog
- [Conductor](/rust-cli/subsystems/conductor) — the session core wrapping one Agent
- [Console Overview](/rust-cli/console/overview) — the interactive ratatui shell and its overlays
- [Capability Deck](/rust-cli/subsystems/capability-deck) — the tool set and the MCP bridge
- [Channels](/rust-cli/subsystems/channels) — the print + JSON-RPC headless surfaces
- [Auth](/rust-cli/configuration/auth) and [Settings](/rust-cli/configuration/settings) — credentials and preferences
- [Parity](/rust-cli/reference/parity) — the clean-room rebuild and its TS/Python lineage

Notes:

- The crate is `induscode` on crates.io; the two `[[bin]]` targets are `indusr` and `indusagir`, both `src/bin/main.rs`. The internal **brand** (`BIN_NAMES`, the process title, the `--version` app name) is `indus` / `indusagi` — so a launch of the installed `indusr`/`indusagir` resolves through `resolve_brand`'s `BIN_NAMES[0]` fallback to the `indus` brand (`--version` prints `indusagi <version>`, since `BRAND.app_name == "indusagi"`).
- Requires **edition 2024, MSRV 1.96**; the surface is `async`/`await` and snake_case throughout.
- The version is single-sourced from `Cargo.toml` and read back via `env!("CARGO_PKG_VERSION")` — never duplicated.
- `async fn main() -> ExitCode` is the only OS exit point, so the terminal's raw/alt-screen mode is always restored.
