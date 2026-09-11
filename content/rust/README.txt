# IndusAGI (Rust) Overview

> The Rust edition of the **indusagi** terminal-first AI coding-agent framework: a 100% Rust,
> zero-SDK rebuild of the TypeScript ground truth, compiled to a single static binary at full
> feature parity. The whole stack — LLM gateway, pure-FSM agent runtime, tool kernel, MCP
> interop, ratatui UI, SaaS connectors, multi-agent swarm, and the CLI shell — lives inside
> one published `indusagi` crate (npm-style "one package, many modules") that exposes both the
> library and the `indusagi` binary, with `indusagi-testkit` providing the shared dev fixtures.

## Table of Contents

- [What it is](#what-it-is)
- [The crates](#the-crates)
- [Install](#install)
- [Build and use](#build-and-use)
- [The module map](#the-module-map)
- [Subsystems](#subsystems)
- [The umbrella barrel](#the-umbrella-barrel)
- [Facades and the compat layer](#facades-and-the-compat-layer)
- [Feature gates](#feature-gates)
- [Relationship to the TypeScript and Python editions](#relationship-to-the-typescript-and-python-editions)
- [Where to next](#where-to-next)

## What it is

`indusagi` (Rust) is a brand-new, **100% Rust** rebuild of the `indusagi` framework — ported
module-for-module from the TypeScript ground truth (`indus-rebuild/src/`) into a Cargo
workspace that compiles to one static binary. It is not a binding layer over a runtime in
another language: every wire shape is re-derived from public HTTP docs and parsed by hand
(**zero provider SDKs**), every subsystem is native Rust, and the whole tree builds, tests,
fmt-checks, and clippy-clean as a single workspace.

It is a toolkit, not a single product. The same crate gives you a runnable coding agent on the
command line (the `indusagi` binary) and the embeddable building blocks to host an agent in
your own Rust program: a multi-provider LLM gateway, a pure agent runtime, a built-in tool
kernel, an MCP bridge (both directions), Composio SaaS connectors, multi-agent swarm
coordination, an agent-builder (IndusForge), an OTel-free tracer, and a ratatui terminal UI.

Everything is `async` over Tokio, fully typed, and `snake_case` modules / `CamelCase` types as
idiomatic Rust. It targets **edition 2024** with an **MSRV of 1.96**. The single workspace
version is single-sourced from `Cargo.toml` and surfaced at runtime as
`indusagi::VERSION = env!("CARGO_PKG_VERSION")` — code never hardcodes it.

The headline reason to reach for the Rust edition is footprint and latency. Measured against
the Node build, cold start is ~86× faster, peak RSS is ~30× smaller, and the install footprint
is ~27× smaller — see [Performance](/rust/performance) for the methodology and numbers.

## The crates

Unlike the original plan's per-subsystem crate split, the thirteen former `indusagi-*` library
crates have been **merged into the single `indusagi` crate as modules** (npm-style one
package). The same `indusagi` crate also carries the CLI binary, so it ships **both** a library
target and a binary target. The workspace therefore has two crates plus the `xtask` build tool:

| Crate | Kind | Publishes | Holds |
|-------|------|-----------|-------|
| `indusagi` | library **and** binary (`[lib] name = "indusagi"`, `src/lib.rs`; `[[bin]] name = "indusagi"`, `src/main.rs`) | yes (crates.io) | The whole framework (every subsystem is a `mod` here, re-exported through the umbrella barrel) **and** the `indusagi` CLI binary. `cargo add indusagi` pulls in the library; `cargo install indusagi` installs the binary. |
| `indusagi-testkit` | dev library | no (`publish = false`) | The four shared test seams: `ScriptedModel`, the `TranscriptServer` wiremock helper, the ratatui `TestBackend` render harness, and the golden-corpus `fixture` loader. |

The `Cargo.toml` workspace members are `crates/indusagi`,
`crates/indusagi-testkit`, and `xtask`, with `default-members = ["crates/indusagi"]`. The
absorbed subsystem source directories remain on disk but are no longer workspace members, so
they are not re-discovered.

### The binary is a thin shim

The `indusagi` crate's `src/main.rs` does exactly three things, per the entry-point rule: collect the OS
argv (dropping `argv[0]`, lossy-converted so non-UTF-8 args become U+FFFD rather than aborting
the launch), drive the async entry point, and return its `ExitCode` to the OS. `main` returns
`ExitCode` and never calls `process::exit`, so every destructor runs on the way out — the TUI
restores the terminal, the MCP fleet closes, buffered writers flush.

```rust
fn main() -> std::process::ExitCode {
    let argv: Vec<String> = std::env::args_os()
        .skip(1)
        .map(|arg| arg.to_string_lossy().into_owned())
        .collect();
    let runtime = match tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
    {
        Ok(runtime) => runtime,
        Err(error) => {
            eprintln!("failed to start the async runtime: {error}");
            return std::process::ExitCode::from(1);
        }
    };
    runtime.block_on(indusagi::shell_app::run(argv))
}
```

The real CLI work — the hand-rolled 10-flag grammar, the help/version/print/wire/repl mode
derivation, the boot pipeline, the runners, and the OAuth `auth` subcommand — all lives in the
merged crate's `shell_app` module, reachable through `pub async fn run(argv: Vec<String>) -> ExitCode`.

### The testkit

`indusagi-testkit` carries the dev seams so each test suite does not re-hand-roll them:

| Item | Path | What it does |
|------|------|--------------|
| `ScriptedModel` | `script::ScriptedModel` | A `ModelInvoker` that replays one recorded emission-turn per call and **panics past the script**, so a runaway drive loop surfaces as a test failure rather than a hang. |
| `TranscriptServer` | `wire::TranscriptServer` | A `wiremock` localhost server that serves a recorded provider SSE/NDJSON body for a route; point a connector's base URL at it. |
| `render_frame` / `buffer_to_string` | `render` | A ratatui `TestBackend` harness: draw a view into a fixed-size in-memory buffer and return the cell grid as snapshot text (no PTY; CI-safe on all OSes). |
| `load_json` / `load_text` / `fixture_path` | `fixture` | The cross-language golden-corpus loader resolving `tests/fixtures/<name>` at the workspace root. |

`indusagi` depends on `indusagi-testkit` only as a `dev-dependency`, and `indusagi-testkit`
depends back on `indusagi`, so the resulting cycle is dev-only (cargo permits it).

## Install

`indusagi` is one published crate carrying both a `[lib]` and a `[[bin]] name = "indusagi"`, so
the same crate name installs the CLI and adds the library:

```bash
cargo install indusagi    # the CLI — puts the `indusagi` binary on your PATH
cargo add indusagi        # the library — depend on the framework from your own crate
```

## Build and use

From a checkout of the workspace:

```bash
export PATH="$HOME/.cargo/bin:$PATH"   # rustc/cargo 1.96.0, edition 2024
cargo build --workspace
cargo test  --workspace
cargo run              # the `indusagi` binary
```

Set the provider key for the model you intend to run, then invoke the binary. The runner is
chosen from your flags by the `shell_app` flag grammar: `-p` for one-shot print mode, `--json`
for the NDJSON wire protocol, the bare invocation for the interactive ratatui REPL, and
`auth login` for the OAuth + PKCE login subcommand.

```bash
export ANTHROPIC_API_KEY="sk-..."

indusagi --version              # prints: indusagi 0.1.0
indusagi -p "summarize this repo"   # one-shot print mode, then exit
indusagi --json                 # NDJSON wire protocol over stdio
indusagi                        # interactive ratatui TUI
indusagi auth login             # OAuth + PKCE login
```

Embedding from your own crate goes through the single `indusagi` dependency. Two layers cover
most uses: the `runtime` (which owns `create_agent`) and the `capabilities` layer (which
assembles a runnable `ToolBox`):

```rust
use indusagi::runtime::conductor::create_agent;       // create_agent(config, deps) -> Agent
use indusagi::capabilities::registry::{tool_box, ToolCollection};

// tool_box(collection: ToolCollection, cwd: Option<String>) -> ToolBox
let tools = tool_box(ToolCollection::Coding, None);   // ReadOnly | Coding | All
```

Resolving a model and estimating cost is pure and offline — no network call:

```rust
use indusagi::gateway::catalog::{get_card, estimate_cost, models}; // gateway == llmgateway alias
use indusagi::gateway::contract::{ProviderId, Usage};

let card = get_card("claude-sonnet-4");               // -> Option<ModelCard>
let anthropic = models().by_provider(ProviderId::Anthropic).all();
```

State, auth, and sessions live under the framework home directory; the `shell_app` boot
pipeline owns their resolution. See [Getting Started](/rust/getting-started) for the full
embedding and CLI walkthrough.

## The module map

Every former `indusagi-*` library crate is now a module inside the one `indusagi` crate. The
`src/lib.rs` barrel declares them as `pub mod`, with the optional subsystems behind cargo
features:

| Former crate | Module (`src/lib.rs`) | Feature gate |
|--------------|-----------------------|--------------|
| `indusagi-core` | `core` | — |
| `indusagi-tracing` | `tracing` | — |
| `indusagi-llmgateway` | `llmgateway` | — |
| `indusagi-capabilities` | `capabilities` | — |
| `indusagi-tui` | `tui` | `tui` (default-on) |
| `indusagi-interop` | `interop` | `mcp` (default-on) |
| `indusagi-connectors-saas` | `connectors_saas` | — |
| `indusagi-runtime` | `runtime` | — |
| `indusagi-swarm` | `swarm` | `swarm` |
| `indusagi-smithy` | `smithy` | — |
| `indusagi-tui-render` | `tui_render` | `tui` (default-on) |
| `indusagi-facade` | `facade` | — |
| `indusagi-shell-app` | `shell_app` | — |

## Subsystems

Each subsystem has its own deep-dive page under `/rust/subsystems`. The catalog:

| Subsystem | Module | Doc | Holds |
|-----------|--------|-----|-------|
| Core | `core` | [/rust/subsystems/core](/rust/subsystems/core) | Cross-cutting primitives: cancellation, env, brand, locator, canonical-JSON + content hash, version, ids, errors, re-iterable channel. |
| Tracing | `tracing` | [/rust/subsystems/tracing](/rust/subsystems/tracing) | OTel-free tracer: segments, signal channel, FNV-1a sampling, scrubbing/redaction, sinks, recorder, registry, adapter. |
| LLM Gateway | `llmgateway` | [/rust/subsystems/llm-gateway](/rust/subsystems/llm-gateway) | Zero-SDK multi-provider gateway: the frozen `Emission`/`Block`/`Turn`/`Conversation` contract, `Channel` streaming, framers, the model catalog, connectors, and credentials. |
| Capabilities | `capabilities` | [/rust/subsystems/capabilities](/rust/subsystems/capabilities) | The built-in tool suite over a frozen kernel and abstract Fs/Shell seams, plus `tool_box(collection, cwd)`. |
| Runtime | `runtime` | [/rust/subsystems/runtime](/rust/subsystems/runtime) | Pure-FSM agent loop: the `RunPhase`/`Signal`/`Effect`/`RunEvent` vocabulary, the `cadence` reducer, the conductor (`create_agent`/`Agent`), tool scheduler, compaction, and the content-addressed session DAG. |
| Interop (MCP) | `interop` | [/rust/subsystems/interop](/rust/subsystems/interop) | MCP in both directions — client fleets plus a provider host — over the official `rmcp` SDK. Behind the `mcp` feature. |
| Connectors (SaaS) | `connectors_saas` | [/rust/subsystems/connectors-saas](/rust/subsystems/connectors-saas) | The hexagonal `SaasBackend` port, the Composio adapter, control tools, the gateway façade, and the OAuth-polling FSM. |
| Swarm | `swarm` | [/rust/subsystems/swarm](/rust/subsystems/swarm) | File-backed multi-agent crews: coordination, ticket board, mailbox, git-worktree isolation, telemetry. Behind the `swarm` feature. |
| Smithy | `smithy` | [/rust/subsystems/smithy](/rust/subsystems/smithy) | The IndusForge agent-builder meta-tool: the flag FSM, blueprint validation, a compile-time-embedded knowledge pack, and the redacting forge session. |
| Shell App | `shell_app` | [/rust/subsystems/shell-app](/rust/subsystems/shell-app) | The CLI library: the 10-flag grammar, the boot pipeline, the print/NDJSON/REPL runners, and the OAuth login subcommand. `pub async fn run(argv) -> ExitCode`. |
| TUI | `tui` | [/rust/ui/tui](/rust/ui/tui) | Host-agnostic terminal primitives: keys, keybindings, fuzzy matcher, editor, theme. Behind the `tui` feature. |
| TUI Render | `tui_render` | [/rust/ui/tui-render](/rust/ui/tui-render) | The ratatui render layer: immediate-mode app, dialogs, markdown/diff/syntax-highlight, the ui-bridge adapter. Behind the `tui` feature. |
| Facade | `facade` | [/rust/subsystems/facade](/rust/subsystems/facade) | Thin compatibility shims projecting the legacy `ai`/`agent`/`mcp` vocabulary onto the core modules; `memory` is intentionally empty. |

## The umbrella barrel

The TS `src/index.ts` is a tiny re-export barrel — nine `export * as <ns> from "./<subsystem>"`
lines plus one `VERSION` constant. `src/lib.rs` mirrors it: each subsystem is surfaced as a
value namespace via `pub use crate::<module> as <ns>;`, so a downstream consumer reaches every
layer through the single `indusagi` dependency exactly as the TS package exposed
`indusagi.gateway`, `indusagi.runtime`, … off one import. Namespaces whose name already matches
the module name (`runtime`, `capabilities`, `interop`, `swarm`, `smithy`, `tracing`) are
satisfied by the `pub mod` directly; only the differing names get an explicit alias:

| `src/index.ts` | Namespace in Rust | Backing module |
|----------------|-------------------|----------------|
| `export * as gateway from "./llmgateway"` | `indusagi::gateway` | `llmgateway` |
| `export * as saas from "./connectors-saas"` | `indusagi::saas` | `connectors_saas` |
| `export * as shell from "./shell-app"` | `indusagi::shell` | `shell_app` |
| (Python-umbrella alias) | `indusagi::connectors` | `connectors_saas` |
| `export const VERSION` | `indusagi::VERSION` | this crate (`env!("CARGO_PKG_VERSION")`) |

```rust
pub use crate::llmgateway as gateway;
pub use crate::connectors_saas as saas;
pub use crate::shell_app as shell;
pub use crate::connectors_saas as connectors; // Python-umbrella name

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
```

## Facades and the compat layer

Four legacy subpath exports from the TS package — `indusagi/ai`, `indusagi/agent`,
`indusagi/mcp`, `indusagi/memory` — are preserved as a **thin translation layer** that keeps
the old `type`/`role` vocabulary public names exactly and **projects everything else onto the
already-green core modules**. The ~28.7k-LOC hand-written second engine the TS barrels fronted
(`ml`/`bot`/`mcp-core`) is deliberately **not** re-ported (decision W-4).

| TS subpath | Rust path | Projects onto |
|------------|-----------|---------------|
| `indusagi/ai` | `indusagi::ai` (`facade::ai`) | `llmgateway` |
| `indusagi/agent` | `indusagi::agent` (`facade::agent`) | `runtime` + `capabilities` |
| `indusagi/mcp` | `indusagi::mcp` (`facade::mcp`, behind `mcp`) | `interop` |
| `indusagi/memory` | `indusagi::memory` (`facade::memory`) | — (intentionally **empty**, W-4) |

Three cross-cutting concerns own their own facade modules: `facade::catalog` re-exports the
**single shared** model catalog (`get_card`, `estimate_cost`, `models`, `model_cards`,
`CardSelection`, `ModelCard`) so the `ai` registry and the core agree by construction — a drift
gate asserts exactly one catalog backs both surfaces — `facade::session_v3` is the append-only
**v3 JSONL** `SessionManager` vocabulary, read-compatible byte-for-byte with real TS-written
session files, and `facade::event_stream` is the hand-rolled multi-cursor producer/consumer
`EventStreamCursor` (a shared FIFO buffer plus a per-cursor read offset, `Condvar`-parked, no
tokio) reproducing the TS `ml/kit/event-stream.ts` replay contract synchronously. `memory` is a
phantom: it exports nothing, and an acceptance test pins that it stays empty.

## Feature gates

The `default` set keeps the full historical surface (`rustls` + `mcp` + `tui`), so the default
build is byte-identical to the prior unconditional dependency set:

| Feature | Default | Gates |
|---------|---------|-------|
| `rustls` | on | The merged `reqwest` transport's TLS backend (forwarded to reqwest's own `rustls` flag). No `native-tls` feature exists (an upstream pin conflict). |
| `mcp` | on | The `interop` module (its `rmcp` + `http` deps) and the legacy `indusagi/mcp` facade vocabulary. |
| `tui` | on | The `tui` + `tui_render` modules and their render substrate (`ratatui`, `crossterm`, `pulldown-cmark`, `syntect`, `two-face`, `similar`, `lru`, unicode width/segmentation). |
| `composio` | off | The Composio SaaS adapter code gate in `connectors_saas`. |
| `swarm` | off | The `swarm` multi-agent coordination module. |
| `full` | off | `mcp` + `tui` + `composio` + `swarm` — everything at once. |

The binary crate also has an off-by-default `mimalloc` feature that swaps in the mimalloc global
allocator, kept off so the default build and the criterion bench baseline run on the system
allocator.

## Relationship to the TypeScript and Python editions

There are three first-class editions of the same framework, ported from one TypeScript ground
truth:

| Edition | Docs | Distribution | Public surface |
|---------|------|--------------|----------------|
| TypeScript (original / ground truth) | [/docs](/docs) | npm `indusagi` v0.13.1 | The `src/index.ts` barrel; subpath exports `indusagi/{ai,agent,mcp,memory}`. |
| Python | [/python](/python) | `pip install indusagi` | Lazy per-layer subpackages (`indusagi.runtime`, `indusagi.llmgateway`, …); `snake_case`, `async`/`await`. |
| **Rust (this edition)** | [/rust](/rust) | crates.io `indusagi` v0.1.0 — `cargo install indusagi` (binary) / `cargo add indusagi` (library) | The `src/lib.rs` umbrella barrel; one crate, many modules; `async` over Tokio. |

The Rust edition tracks the TypeScript ground truth module-for-module and is declared at **full
parity (26/26)** — the same subsystems, the same model catalog, the same v3 JSONL session
format (byte-compatible with TS-written files), the same CLI flag grammar and runners, the same
OAuth + PKCE login. Where the Python edition uses lazy per-layer imports and a `snake_case`
async surface, the Rust edition collapses the same layers into one crate's modules reached
through the umbrella barrel, trading the wire-up for native-binary footprint and start-up
latency. Eight deliberate deviations from a naive 1:1 port (the "waivers", including the
not-re-ported facade engine, W-4) are documented in the workspace `WAIVERS.md`. See
[Parity](/rust/reference/parity) for the per-item verdict.

## Where to next

- [Getting Started](/rust/getting-started) — build, embed, and run the CLI.
- [Architecture](/rust/architecture) — how the modules fit together inside the one crate.
- [LLM Gateway](/rust/subsystems/llm-gateway) — the model core, catalog, and streaming contract.
- [Runtime](/rust/subsystems/runtime) — `create_agent`, the cadence reducer, and the session DAG.
- [Capabilities](/rust/subsystems/capabilities) — the built-in tool kernel and `tool_box`.
- [Interop](/rust/subsystems/interop) and [Connectors (SaaS)](/rust/subsystems/connectors-saas) — MCP and Composio bridges.
- [Swarm](/rust/subsystems/swarm) and [Smithy](/rust/subsystems/smithy) — multi-agent crews and the IndusForge builder.
- [Tracing](/rust/subsystems/tracing) and [Shell App](/rust/subsystems/shell-app) — the tracer and the CLI library.
- Facades: [facade](/rust/subsystems/facade) — the `ai`/`agent`/`mcp`/`memory` compat layer.
- UI: [TUI primitives](/rust/ui/tui) and [TUI render](/rust/ui/tui-render).
- Reference: [CLI](/rust/reference/cli), [Package Exports](/rust/reference/package-exports), [Parity](/rust/reference/parity), [Performance](/rust/performance).
