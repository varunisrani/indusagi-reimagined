# AI Module Overview

The AI module provides a unified streaming interface across multiple LLM providers.
It exposes model definitions, provider adapters, message types, and utility helpers.

Primary entrypoint: `indusagi/ai`.

> The `indusagi/ai` subpath resolves to `src/facade/ai.ts`, which simply
> re-exports `src/facade/ml/index.ts`. Everything documented here lives under
> `src/facade/ml/`.

## Directory Map

- `src/facade/ai.ts` is the published subpath; it does `export * from "./ml/index"`.
- `src/facade/ml/index.ts` is the barrel that re-exports every public symbol.
- `src/facade/ml/stream.ts` provides `stream`, `complete`, `streamSimple`, `completeSimple`, and `streamByApi`.
- `src/facade/ml/models.ts` holds the in-memory `ModelRegistry` and cost helpers.
- `src/facade/ml/models.generated.ts` is the generated model catalog (the registry seed).
- `src/facade/ml/types.ts` defines message, tool, model, and event types plus runtime validators.
- `src/facade/ml/api-registry.ts` is the backend (provider) registry keyed by API tag.
- `src/facade/ml/env-api-keys.ts` resolves provider credentials from the environment.
- `src/facade/ml/adapters/*` contains provider adapters (Anthropic, OpenAI, Google, Bedrock, etc.).
- `src/facade/ml/kit/*` includes parsing, validation, overflow, event-stream, and TypeBox helpers.
- `src/facade/ml/kit/auth/*` contains the OAuth provider implementations.

The underlying clean-room implementation lives in `src/llmgateway/`, which the
facade layer surfaces under stable, public names.

## Conceptual Flow

1. Build a `Context` with a system prompt, messages, and optional tool definitions.
2. Select a `Model` from the registry (`getModel`) or register a custom one.
3. Call `stream` or `streamSimple` to get an async iterable of events.
4. Consume events to render incremental text, thinking, and tool calls.
5. Optionally call `complete` or `completeSimple` to await the final `AssistantMessage`.

The same `Context` and `Message` structure is used across all providers.
Provider adapters handle conversion to each vendor API format.

## What This Module Does

- Normalizes message formats across providers.
- Handles tool calls and tool results.
- Supports text and image inputs where the model allows them.
- Emits a unified stream of incremental `AssistantMessageEvent` values.
- Calculates token usage cost per model.
- Supports reasoning / thinking controls when the provider allows it (via `streamSimple`).

## Quick Start

```ts
import { getModel, streamSimple } from "indusagi/ai";

const model = getModel("anthropic", "claude-sonnet-4-5");

const stream = streamSimple(model, {
  systemPrompt: "You are concise.",
  messages: [{ role: "user", content: "Hello", timestamp: Date.now() }],
}, { reasoning: "low" });

for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}

const final = await stream.result();
console.log(final.usage.totalTokens);
```

For details, see:

- [AI API Reference](/docs/ai/api-reference)
- [Streaming Model](/docs/ai/streaming)
- [Models and Registry](/docs/ai/models)
- [AI Providers](/docs/ai/providers)
- [OAuth Providers](/docs/ai/oauth)
- [AI Utilities](/docs/ai/utils)
