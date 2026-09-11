# TUI Module

The TUI surface of `indusagi` is two cooperating layers: a small terminal-text
toolkit (`indusagi/tui`) of pure string helpers, key parsing, keybindings, and
autocomplete; and a React + Ink component set (`indusagi/react-ink`) that renders
the agent conversation, dialogs, diffs, and markdown. Both are wired to a host
React/Ink instance through `indusagi/react-host`.

Entry points: `indusagi/tui`, `indusagi/react-ink`, `indusagi/react-host`.

## Source Map

- `indusagi/tui` resolves to `src/ui/index.ts` — the toolkit barrel. It re-exports
  from `src/ui/autocomplete.ts`, `src/ui/editor-component.ts`, `src/ui/contracts.ts`,
  `src/ui/theme-types.ts`, `src/ui/fuzzy.ts`, `src/ui/keybindings.ts`, `src/ui/keys.ts`,
  and `src/ui/utils.ts`.
- `indusagi/react-ink` resolves to `src/react-ink/index.ts` — the component barrel.
  It re-exports `src/react-ink/types.ts`, `src/react-ink/theme-adapter.ts`, the
  components under `src/react-ink/components/**`, the markdown renderer under
  `src/react-ink/markdown/**`, the diff renderer under `src/react-ink/diff/**`, and
  the helpers under `src/react-ink/utils/**`.
- `indusagi/react-host` resolves to `src/react-host/index.ts` — the React adapter;
  `indusagi/react-host/ink` (`src/react-host/ink.ts`) re-exports Ink's `Box`, `Text`,
  `render`, `useInput`; `indusagi/react-host/jsx-runtime` (`src/react-host/jsx-runtime.ts`)
  re-exports the JSX runtime. The resolver lives in `src/react-host/loader.ts`.

## What lives where

- **Toolkit (`indusagi/tui`)** — no React. Exports `parseKey`/`matchesKey`/`Key`,
  `EditorKeybindingsManager` + `DEFAULT_EDITOR_KEYBINDINGS`, `CombinedAutocompleteProvider`,
  `fuzzyMatch`/`fuzzyFilter`, the `Component`/`TUI`/`OverlayOptions` contracts, the
  `EditorComponent` interface, the theme-type interfaces (`MarkdownTheme`,
  `EditorTheme`, `SelectListTheme`, `SettingsListTheme`), and ANSI-aware text
  helpers `visibleWidth`, `truncateToWidth`, `wrapTextWithAnsi`.
- **Components (`indusagi/react-ink`)** — the Ink JSX surface: message views, tool
  cards, dialogs, a colored diff block, and a markdown renderer. Every component
  takes its colours through an `InkThemeAdapter` prop — there is no `useTheme()`
  hook in the rebuild.
- **Host (`indusagi/react-host`)** — resolves the consumer's React/Ink at load
  time so the bundled components run against one React instance.

## Core Concepts

- `Component` (`src/ui/contracts.ts`) defines `render(width)`, optional
  `handleInput(data)`, lifecycle hooks (`onMount`/`onUnmount`/`onFocus`/`onBlur`),
  and `invalidate()`.
- `InkThemeAdapter` (`src/react-ink/theme-adapter.ts`) maps colour keys and named
  markdown/diff/syntax `ThemeRole`s to chalk-painted strings; it is threaded
  explicitly into every renderer.
- Images are rendered as text placeholders (`[image: <mimeType>]`) gated by a
  `showImages` flag — there is no pixel/Kitty/iTerm2 image protocol in this
  rebuild. See [TUI Images](/docs/tui/images).

## Next Docs

- [TUI Architecture](/docs/tui/architecture)
- [TUI Components Reference](/docs/tui/components)
- [Input, Keys, and Autocomplete](/docs/tui/input-and-keys)
- [TUI Images](/docs/tui/images)
