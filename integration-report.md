# Canonical IndusAGI documentation integration report

## Provenance

- Canonical repository: `https://github.com/varunisrani/indusagi-docs.git`
- Canonical commit: `a24f7e9823d0149e27bf05af912fba8dd959866c`
- Verified source checkout: a clean local checkout of the canonical repository at the commit above (machine-local path intentionally omitted).
- Destination: this release source tree (machine-local path intentionally omitted).
- Integration approach: retain the uploaded Vinext/Next.js design and homepage, import the exact canonical six-area corpus, and regenerate sanitized per-route JSON from that corpus before development and production builds.

## Coverage

| Documentation area | Base route | Canonical source files |
|---|---:|---:|
| TypeScript framework/package | `/docs` | 38 |
| TypeScript coding-agent CLI | `/cli` | 30 |
| Python framework | `/python` | 24 |
| Python coding-agent CLI | `/python-cli` | 27 |
| Rust framework | `/rust` | 20 |
| Rust coding-agent CLI | `/rust-cli` | 27 |
| **Total canonical documents** |  | **166** |

The generated route catalog contains 179 routes: 166 canonical document URLs, six compatibility area roots, and seven preserved editorial/use-case pages. Each area root permanently redirects to one preferred canonical document. The XML sitemap contains 174 unique URLs including `/`; the six redirect-only area roots are excluded.

`diff -qr` was run independently for all six source/destination content directories and reported no differences: the imported canonical corpus is byte-for-byte identical to the pinned checkout.

## Changed categories

- `content/**`: complete canonical `.txt` documentation corpus plus `content/source.json` provenance.
- `scripts/docs-core.mjs`, `scripts/build-docs.mjs`: deterministic manifest ordering, GitHub-compatible Markdown heading IDs, unambiguous legacy-fragment rewriting, unsafe raw-HTML escaping, unsafe URL rejection, canonical local-link normalization, route generation, and exhaustive path-plus-fragment validation.
- `app/data/**`: regenerated per-route server imports and document payloads.
- `app/[...slug]/page.tsx`: per-document description and canonical metadata plus permanent redirects from the six duplicate area-root identities to preferred documents.
- `app/docs-navigation.tsx`, `app/document-types.ts`, `app/globals.css`: canonical sidebar section grouping within the uploaded design shell.
- `app/robots.txt/route.ts`, `app/sitemap.xml/route.ts`, `public/llms.txt`: crawler, deduplicated sitemap, and source-qualified LLM discovery support with only a registry-verified TypeScript installation command.
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`: Next.js 16.3.3, matching ESLint configuration, compatible dependency refreshes, and security-patched transitive resolutions. `fast-uri@3.1.6` and `browserslist@4.28.7` are constrained to patched versions within every parent's declared semver range in both package-manager lock paths.
- `scripts/*.sh`: required release/install entrypoints are Git mode 100755 and preserve executable bits in archives.
- `tests/docs-integration.test.mjs`: source pin, per-area counts, representative routes, exhaustive local path/fragment integrity, area-root canonical identity, release entrypoint modes, and source-qualified LLM discovery coverage.
- Stale scrape/import scripts from the uploaded baseline remain removed; no machine-local source location is shipped.

## Verification

Dependency lock generation and audit used the project-pinned pnpm 11.19.0. The official npm registry tarball was checked against registry SHA-1 `e5b5f706ee18e8eb91ac5b083ae2b28f6a07c04a` before use. pnpm's supply-chain policy check passed for all 828 pre-remediation lockfile entries and for the remediated lockfile. The documented clean install uses the committed npm lock through `npm run install:ci` and its integrity-pinned Vinext preflight.

Commands and final results:

- `npm run install:ci` from a dependency-free source tree — PASS; integrity preflight passed and 639 packages were installed through exactly one bounded `npm ci`.
- `pnpm audit --prod --json` — PASS; 0 critical, 0 high, 0 moderate, 0 low across 240 production/optional dependencies.
- `npm audit --omit=dev --json` — PASS; 0 critical, 0 high, 0 moderate, 0 low across 874 total dependency records (160 production).
- `npm run docs:build` — PASS; generated 166 canonical documents across 179 routes with zero unresolved paths or fragments.
- `npm test` — PASS; 8/8 tests.
- `npm run typecheck` — PASS; `tsc --noEmit` exited 0.
- `NODE_OPTIONS=--max-old-space-size=8192 npm run lint` — PASS; ESLint exited 0 with no findings (the larger heap avoids this host's Node 26 prerelease default-heap limit).
- `npm run build` — PASS; all five Vinext production-build stages completed with Next.js 16.3.3.
- `git diff --check` — PASS.
- Six explicit `diff -qr <canonical-area> <destination-area>` comparisons — PASS with no differences.
- Production runtime (`wrangler` on loopback) — PASS with HTTP 200 for `/`, preferred and nested pages in all six documentation families, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`; unknown and encoded traversal paths returned 404.
- All six family roots returned HTTP 308 to their preferred documents. The sitemap contained 174 unique URLs and omitted all six redirect-only aliases.
- Representative nested routes exercised: `/docs/ai/providers`, `/cli/extensions`, `/python/facades/agent`, `/python-cli/console/slash-commands`, `/rust/subsystems/runtime`, `/rust-cli/configuration/models`.

## Residual gaps and notes

- The Vinext build emits an upstream Node deprecation warning for `module.register()`; it does not fail the build.
- Chromium visual automation could not start on this host because the cached browser binary lacks the host library `libnspr4.so`. Production HTML/runtime route checks and the existing build/typecheck/test gates passed, but no new screenshot artifact was produced.
- The imported documentation contains clearly fictional example filesystem paths and redacted API-key shapes from the canonical public corpus. Release scans distinguish those examples from real machine-local paths and credentials.
- `public/llms.txt` intentionally makes no benchmark ranking or comparative-performance claim. Its package identity and install command are sourced to current npm registry metadata; its corpus claim is sourced to the pinned public documentation commit.
