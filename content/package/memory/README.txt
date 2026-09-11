# Memory Module Overview

> `indusagi/memory` is a phantom facade. It carries no runtime exports — the real
> memory machinery (context condensation, the run event ledger, and the session
> store) lives under `indusagi`'s runtime and is reached through `indusagi/runtime`.

The "memory" concern in the clean-room rebuild is the management of a run's
*context*: deciding when an agent's accumulated history is too large for the
model window and condensing it, fanning run progress out to hosts, and durably
storing branchable session history on disk. None of this is exposed as a
standalone `Memory` class. It is wired into the agent runtime and driven
automatically by `createAgent`.

The `indusagi/memory` subpath resolves but ships nothing — its module is
literally `export {}`, with no value or type exports. The machinery that does
the work is internal to `indusagi/runtime` and is driven through `createAgent`.

## What `indusagi/memory` actually exports

The module at `src/facade/memory.ts` is:

```typescript
// indusagi/memory phantom facade (consumer imports a JSDoc-only type)
export {};
```

It is a deliberate placeholder. It exists so the `indusagi/memory` subpath
resolves, but it re-exports nothing at runtime. Importing values from it will
fail — there are no `Memory`, `InMemoryStorage`, `VectorStore`, `Embedder`,
processor classes, or embedding functions in this codebase. See `gaps` notes in
the build log: those symbols described by older drafts do not exist.

## Where the real machinery lives

The work the word "memory" implies is split across three internal runtime
directories. They are consumed by the conductor (`createAgent`), not exported as
their own package subpath.

| Concern | Source directory | Role |
|---------|------------------|------|
| Context condensation | `src/runtime/memory/` | Estimate token footprint; condense old history into one summary turn while keeping a recent tail verbatim |
| Run event ledger | `src/runtime/ledger/` | Fan published run events out to subscribers; accumulate the latest snapshot |
| Session store | `src/runtime/store/` | Content-addressed, branchable session DAG persisted as JSONL on disk |

## Conceptual flow

1. A host builds an agent with `createAgent(config, deps)` from `indusagi/runtime`.
2. As the conversation grows, before each model call the conductor estimates the
   history's token footprint (`estimateContextTokens`) and, if it crosses
   `config.compaction.triggerRatio` of the model window (`shouldCompact`),
   condenses the oldest prefix into a single distilled turn (`compact`),
   preserving the most recent `keepRecent` turns verbatim.
3. Each step of the run publishes a `RunEvent` through a `RunLedger`; a
   `SnapshotAccumulator` can fold those into "where is the run right now".
4. If a `SessionStore` is injected, settled turns are appended to an on-disk
   JSONL session file as content-addressed nodes, so a later agent can `resume`
   the session by id.

## What this module does (accurately)

- Reserves the `indusagi/memory` subpath without shipping any runtime symbols.
- Documents the relationship between context condensation, the event ledger, and
  the session store — all internal to the runtime.

## What it does NOT do

- No semantic search, embeddings, or vector store.
- No `Memory` orchestrator class, no message/thread CRUD, no working-memory
  processors, no observational memory.
- No `MEMORY_*` environment variables and no pluggable storage backends keyed by
  env. The only knobs are the `CompactionPolicy` fields on `AgentConfig`.

## Core internal components

- **Token estimator** (`estimateContextTokens`) — a cheap character-count
  heuristic (~4 chars/token plus a small per-turn surcharge), no real tokenizer.
- **Compactor** (`shouldCompact`, `findCutPoint`, `summarize`, `compact`) — the
  four-part condensation flow: decide, locate a tool-safe cut, distill, stitch.
- **RunLedger** — synchronous fan-out of `RunEvent`s to subscribers.
- **SnapshotAccumulator** — remembers only the most recent `RunSnapshot`.
- **SessionGraph** / **SessionStore** / **hashNode** — the in-memory DAG, its
  JSONL persistence, and content addressing.

## Documentation

- [API Reference](/docs/memory/api-reference) — the exact public symbol
  surface of `indusagi/memory` and the internal symbols of the runtime memory
  directories.
- [Developer Guide](/docs/memory/developer-guide) — how condensation,
  the ledger, and the store are configured and driven through `createAgent`.

## Quick example

`indusagi/memory` exports no values, so there is nothing to import from it
directly. The memory behaviour is configured through the runtime:

```typescript
import { createAgent } from "indusagi/runtime";
import type { AgentConfig } from "indusagi/runtime";

const config: AgentConfig = {
  model: "claude-sonnet-4",
  // Condense history once it reaches 80% of the window; keep the last 8 turns.
  compaction: { triggerRatio: 0.8, keepRecent: 8 },
};

const agent = createAgent(config);
const snapshot = await agent.submit("Summarize the repository layout.");
console.log(snapshot.phase, snapshot.messages.length);
```
