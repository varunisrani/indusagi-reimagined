# Agent Module

The agent module provides a turn-based loop that streams assistant messages, executes tool calls, and emits structured events.
It builds on the AI module (`indusagi/ai`) and keeps all conversation context in `AgentMessage` format.

Entry point: `indusagi/agent`.

## Source Map

The public entry `indusagi/agent` resolves to `src/facade/agent.ts`, which re-exports `src/facade/bot/index.ts`. The pieces live in `src/facade/bot/`:

- `src/facade/bot/agent.ts` — the `Agent` class and `AgentOptions`.
- `src/facade/bot/agent-loop.ts` — the core loop: `agentLoop` and `agentLoopContinue`.
- `src/facade/bot/types.ts` — types and the `AgentEvent` model.
- `src/facade/bot/state-manager.ts` — `AgentStateManager`.
- `src/facade/bot/event-bus.ts` — `AgentEventBus`.
- `src/facade/bot/proxy.ts` — `streamProxy`, a remote streaming `StreamFn`.
- `src/facade/bot/messages.ts` — the default `convertToLlm` and custom-message helpers.
- `src/facade/bot/session-manager.ts` — `SessionManager` for on-disk session persistence.
- `src/facade/bot/actions/` — the built-in tools/actions (read, write, edit, bash, grep, find, ls, process, todo, websearch, webfetch, composio).

## Highlights

- Manages state, tool calls, and streaming in one place via the `Agent` class.
- Supports steering and follow-up messages while a run is in progress.
- Emits `AgentEvent` values through a subscribe/unsubscribe `AgentEventBus`.
- Accepts a custom `streamFn` (e.g. `streamProxy`) in place of the default `streamSimple`.

## Default Model

The default model is `getModel("google", "gemini-2.5-flash")`. Swap it with `agent.setModel(...)` or by passing `initialState.model`.

## Clean-room Equivalents

`src/facade/bot` is the established facade surface. The clean-room rebuild also ships two newer layers with their own subpath exports:

- `indusagi/runtime` (`src/runtime/index.ts`) — `createAgent`, the `Agent` handle, and the `RunSnapshot`/`RunEvent`/`AgentConfig` vocabulary, plus the pure `step`/`cadence` state machine.
- `indusagi/capabilities` (`src/capabilities/index.ts`) — `defineTool`, `ToolRegistry`, the eleven built-in tools, and the assembled `builtinRegistry`/`toolBox`.

## Next Docs

- [Agent API Reference](/docs/agent/api-reference) — exact public symbols of `indusagi/agent`.
- [Agent Loop and Tools](/docs/agent/loop-and-tools) — the agent loop and tool-calling pipeline.
- [Tools Reference](/docs/agent/tools-reference) — the built-in tool/action reference.
- [Background Process Tool](/docs/agent/bg-process) — the background `process` tool.
