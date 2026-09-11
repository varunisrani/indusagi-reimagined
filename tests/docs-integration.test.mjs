import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  AREA_CONFIG,
  buildDocumentation,
  collectLocalHrefFailures,
} from '../scripts/docs-core.mjs';

const root = resolve(import.meta.dirname, '..');
const expectedCounts = {
  package: 38,
  cli: 30,
  python: 24,
  'python-cli': 27,
  rust: 20,
  'rust-cli': 27,
};

test('canonical corpus is present at the pinned source revision', async () => {
  const provenance = JSON.parse(await readFile(resolve(root, 'content/source.json'), 'utf8'));
  assert.equal(provenance.commit, 'a24f7e9823d0149e27bf05af912fba8dd959866c');
  assert.equal(provenance.repository, 'https://github.com/varunisrani/indusagi-docs.git');

  const result = await buildDocumentation({ root, write: false });
  assert.deepEqual(result.counts, expectedCounts);
  assert.equal(result.canonicalCount, 166);
  assert.equal(result.routeCount, 179);
  assert.deepEqual(Object.keys(AREA_CONFIG), Object.keys(expectedCounts));
});

test('all six area roots and representative nested pages are generated', async () => {
  const { documents } = await buildDocumentation({ root, write: false });
  for (const route of [
    '/docs', '/docs/ai/providers', '/cli', '/cli/extensions',
    '/python', '/python/facades/agent', '/python-cli', '/python-cli/console/slash-commands',
    '/rust', '/rust/subsystems/runtime', '/rust-cli', '/rust-cli/configuration/models',
  ]) assert.ok(documents[route], `missing ${route}`);
});

test('generated canonical documentation has no unresolved local hrefs', async () => {
  const { documents } = await buildDocumentation({ root, write: false });
  assert.deepEqual(collectLocalHrefFailures(documents), []);
});

test('local href validation rejects missing fragments', () => {
  const documents = {
    '/docs/example': { html: '<h2 id="present">Present</h2><a href="#missing">Missing</a>' },
  };
  assert.deepEqual(collectLocalHrefFailures(documents), [
    { route: '/docs/example', href: '#missing', target: '/docs/example', fragment: 'missing' },
  ]);
});

test('authored Markdown fragments resolve to generated heading IDs', async () => {
  const { documents } = await buildDocumentation({ root, write: false });
  for (const [route, fragment] of [
    ['/cli/session', 'catalog--management'],
    ['/cli/compaction', 'budget--when-to-condense'],
    ['/docs/README', 'install--build--test'],
    ['/python-cli/configuration/auth', 'pindus-signin---list'],
    ['/rust-cli/reference/crate-exports', 'window_budget'],
  ]) {
    assert.match(documents[route].html, new RegExp(`id="${fragment}"`), `${route} is missing #${fragment}`);
  }
});

test('area roots have one preferred canonical identity', async () => {
  const { documents, redirects } = await buildDocumentation({ root, write: false });
  assert.deepEqual(redirects, {
    '/cli': '/cli/README',
    '/docs': '/docs/getting-started',
    '/python': '/python/getting-started',
    '/python-cli': '/python-cli/getting-started',
    '/rust': '/rust/getting-started',
    '/rust-cli': '/rust-cli/getting-started',
  });
  for (const [source, destination] of Object.entries(redirects)) {
    assert.equal(documents[source].canonicalPath, destination);
  }
});

test('shell entrypoints survive mode-stripping ZIP extractors', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.equal(manifest.scripts['install:ci'], 'bash scripts/install-ci.sh');
  for (const file of ['build-verified.sh', 'install-ci.sh', 'install-pnpm.sh']) {
    const path = resolve(root, 'scripts', file);
    const mode = (await stat(path)).mode;
    const source = await readFile(path, 'utf8');
    assert.match(source, /exec bash "\$\{script_dir\}\/sites-env\.sh" -- bash "\$0" "\$@"/);
    if ((mode & 0o111) === 0) assert.match(source, /^#!\/usr\/bin\/env bash/m);
  }
});

test('LLM discovery uses source-qualified claims and valid install commands', async () => {
  const discovery = await readFile(resolve(root, 'public/llms.txt'), 'utf8');
  assert.match(discovery, /npm install -g indusagi-coding-agent/);
  assert.match(discovery, /Source:/);
  assert.doesNotMatch(discovery, /ranked #18|npm install -g induscode/);
});
