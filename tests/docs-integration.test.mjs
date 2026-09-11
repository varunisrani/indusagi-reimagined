import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';
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

test('LLM discovery file is bundled', async () => {
  await access(resolve(root, 'public/llms.txt'));
});
