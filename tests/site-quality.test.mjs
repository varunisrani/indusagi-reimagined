import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('global shell omits the visible skip-to-content control and keeps overflow-safe media', async () => {
  const [layout, css] = await Promise.all([source('app/layout.tsx'), source('app/globals.css')]);
  assert.doesNotMatch(layout, /Skip to main content|className="skip-link"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(css, /html,body\{[^}]*overflow-x:clip/);
  assert.match(css, /img\{[^}]*max-width:100%[^}]*height:auto/);
  assert.doesNotMatch(css, /\.skip-link(?:\{|:focus)/);
});

test('benchmark copy separates the official Terminal-Bench 2.0 rank from 2.1 campaigns', async () => {
  const [site, benchmarks] = await Promise.all([source('app/site.tsx'), source('app/benchmarks.tsx')]);
  const combined = site + benchmarks;
  assert.match(combined, /https:\/\/www\.tbench\.ai\/\?version=2\.0/);
  assert.match(combined, /#24/);
  assert.match(combined, /IndusAGI Coding Agent/);
  assert.match(combined, /GPT-5\.3-Codex/);
  assert.match(combined, /69\.1%/);
  assert.match(combined, /Terminal-Bench 2\.0/);
  assert.match(benchmarks, /Terminal-Bench 2\.1/);
  assert.match(benchmarks, /IndusAGI-reported campaigns/);
  assert.match(site, /Terminal-Bench 2\.1 · TypeScript &amp; Python/);
});

test('footer contains working legal links, no placeholder navigation, and a current year', async () => {
  const footer = await source('app/footer.tsx');
  for (const [href, label] of [['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/cookies', 'Cookies']]) {
    assert.match(footer, new RegExp(`href="${href}"[^>]*>${label}`));
  }
  assert.doesNotMatch(footer, /<span>(Changelog|Roadmap|Discord)<\/span>/);
  assert.match(footer, /new Date\(\)\.getUTCFullYear\(\)/);
  assert.match(footer, /aria-label="IndusAGI home"/);
});

test('privacy notice describes only observed site data behavior and a deletion-request path', async () => {
  const privacy = await source('app/privacy/page.tsx');
  assert.match(privacy, /export const metadata/);
  assert.match(privacy, /does not include account registration, contact forms, payments, advertising trackers, or analytics SDKs/i);
  assert.match(privacy, /localStorage/);
  assert.match(privacy, /npm registry/i);
  assert.match(privacy, /hosting and content-delivery providers/i);
  assert.match(privacy, /data deletion/i);
  assert.match(privacy, /github\.com\/varunisrani\/indusagi-reimagined\/issues\/new/);
  assert.match(privacy, /do not include secrets or sensitive personal information/i);
});

test('cookie notice explains why the current site does not show a consent banner', async () => {
  const cookies = await source('app/cookies/page.tsx');
  assert.match(cookies, /export const metadata/);
  assert.match(cookies, /does not set first-party cookies/i);
  assert.match(cookies, /localStorage is not a cookie/i);
  assert.match(cookies, /does not load advertising or analytics cookies/i);
  assert.match(cookies, /consent banner is not shown/i);
  assert.match(cookies, /update this notice and add consent controls/i);
});

test('terms state the actual open-source, no-purchase, and third-party-link boundaries', async () => {
  const terms = await source('app/terms/page.tsx');
  assert.match(terms, /export const metadata/);
  assert.match(terms, /open-source project/i);
  assert.match(terms, /MIT License/i);
  assert.match(terms, /does not sell products or services/i);
  assert.match(terms, /refund policy does not apply/i);
  assert.match(terms, /third-party/i);
  assert.match(terms, /without warranties/i);
});

test('legal routes are included in the canonical sitemap source', async () => {
  const sitemap = await source('app/sitemap.xml/route.ts');
  for (const route of ['/privacy', '/terms', '/cookies']) assert.match(sitemap, new RegExp(`['"]${route}['"]`));
});

test('public GitHub links use reachable public repositories', async () => {
  const files = await Promise.all([
    source('app/site.tsx'),
    source('app/footer.tsx'),
    source('app/seo.ts'),
    source('content/package/README.txt'),
  ]);
  const combined = files.join('\n');
  assert.doesNotMatch(combined, /github\.com\/varunisrani\/indusagi(?:['"`)\/]|$)/);
  assert.doesNotMatch(combined, /github\.com\/varunisrani\/indusagi-ts(?:['"`)\/]|$)/);
  assert.match(combined, /github\.com\/varunisrani\/indusagi-sdk/);
  assert.match(combined, /github\.com\/varunisrani\/indusagi-reimagined\/issues\/new/);
});

test('copy action reports genuine success and failure states', async () => {
  const copyButton = await source('app/copy-button.tsx');
  assert.match(copyButton, /await navigator\.clipboard\.writeText\(text\)/);
  assert.match(copyButton, /Copy failed/);
  assert.match(copyButton, /role="status"/);
  assert.match(copyButton, /aria-live="polite"/);
});

test('legal routes share accessible editorial structure and factual operator details', async () => {
  const legal = await source('app/legal-page.tsx');
  assert.match(legal, /export function LegalPage/);
  assert.match(legal, /Maintainer: Varun Israni/);
  assert.match(legal, /https:\/\/github\.com\/varunisrani\/indusagi-reimagined/);
  for (const route of ['privacy', 'terms', 'cookies']) {
    const info = await stat(resolve(root, 'app', route, 'page.tsx'));
    assert.ok(info.isFile());
  }
});
