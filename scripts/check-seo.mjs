import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
const canonicalOrigin = 'https://www.indusagi.com';
const homeTitle = 'IndusAGI — Open-Source AI Agent Framework and Coding Agent';
const homeDescription = 'Build and run terminal-first AI coding agents with the open-source IndusAGI framework for TypeScript, Python, and Rust.';

async function get(path) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return { response, text: await response.text() };
}

function attribute(html, elementPattern, attributeName) {
  const element = html.match(elementPattern)?.[0];
  assert.ok(element, `missing element matching ${elementPattern}`);
  const value = element.match(new RegExp(`${attributeName}="([^"]+)"`))?.[1];
  assert.ok(value, `missing ${attributeName} on ${element}`);
  return value;
}

const { text: home } = await get('/');
assert.match(home, new RegExp(`<title>${homeTitle}</title>`));
assert.equal(attribute(home, /<meta name="description"[^>]*>/, 'content'), homeDescription);
assert.equal((home.match(/<link rel="canonical"[^>]*>/g) || []).length, 1);
assert.equal(attribute(home, /<link rel="canonical"[^>]*>/, 'href'), `${canonicalOrigin}/`);
assert.equal(attribute(home, /<meta property="og:title"[^>]*>/, 'content'), homeTitle);
assert.equal(attribute(home, /<meta property="og:description"[^>]*>/, 'content'), homeDescription);
assert.equal((home.match(/<meta property="og:url"[^>]*>/g) || []).length, 1);
assert.equal(attribute(home, /<meta property="og:url"[^>]*>/, 'content'), `${canonicalOrigin}/`);
assert.equal(attribute(home, /<meta name="twitter:card"[^>]*>/, 'content'), 'summary_large_image');
assert.equal((home.match(/<h1(?:\s|>)/g) || []).length, 1);

const schemas = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
assert.equal(schemas.length, 1);
assert.deepEqual(schemas[0]['@graph'].map((entry) => entry['@type']), [
  'WebSite', 'Organization', 'SoftwareApplication', 'FAQPage',
]);
assert.equal(schemas[0]['@graph'].find((entry) => entry['@type'] === 'FAQPage').mainEntity.length, 11);

const { text: docs } = await get('/docs/getting-started');
assert.match(docs, /<title>Getting Started — IndusAGI Documentation<\/title>/);
assert.equal(
  new URL(attribute(docs, /<link rel="canonical"[^>]*>/, 'href')).href,
  `${canonicalOrigin}/docs/getting-started`,
);
assert.equal((docs.match(/<h1(?:\s|>)/g) || []).length, 1);
assert.match(docs, /<meta property="og:title"[^>]*>/);
assert.match(docs, /<meta name="twitter:card" content="summary_large_image"/);

const { response: robotsResponse, text: robots } = await get('/robots.txt');
assert.match(robotsResponse.headers.get('content-type') || '', /^text\/plain/);
assert.equal(
  robots,
  `User-agent: *\nAllow: /\n\nHost: ${canonicalOrigin}\nSitemap: ${canonicalOrigin}/sitemap.xml\n`,
);

const { response: sitemapResponse, text: sitemap } = await get('/sitemap.xml');
assert.match(sitemapResponse.headers.get('content-type') || '', /^application\/xml/);
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.doesNotMatch(sitemap, /<lastmod>|vercel\.app/);
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'));
assert.ok(locations.length > 100, 'sitemap should contain the homepage and canonical documentation');
assert.equal(new Set(locations).size, locations.length, 'sitemap URLs must be unique');
assert.ok(locations.every((location) => location.startsWith(`${canonicalOrigin}/`)));

const sitemapChecks = await Promise.all(locations.map(async (location) => {
  const canonical = new URL(location);
  const response = await fetch(new URL(canonical.pathname + canonical.search, base), { redirect: 'manual' });
  return [canonical.pathname, response.status];
}));
assert.deepEqual(sitemapChecks.filter(([, status]) => status !== 200), []);

const { response: llmsResponse, text: llms } = await get('/llms.txt');
assert.match(llmsResponse.headers.get('content-type') || '', /^text\/plain/);
for (const link of [
  `${canonicalOrigin}/`,
  `${canonicalOrigin}/docs/getting-started`,
  `${canonicalOrigin}/cli/README`,
  `${canonicalOrigin}/python/getting-started`,
  `${canonicalOrigin}/rust/getting-started`,
]) assert.match(llms, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

await Promise.all(['/favicon.svg', '/indusagi-logo.png'].map(get));

const unknown = await fetch(new URL('/seo-check-missing-page', base), { redirect: 'manual' });
assert.equal(unknown.status, 404);

console.log(JSON.stringify({
  homepage: { title: homeTitle, descriptionLength: homeDescription.length, h1Count: 1 },
  schemaTypes: schemas[0]['@graph'].map((entry) => entry['@type']),
  faqQuestions: 11,
  sitemapUrls: locations.length,
  sitemapReachable: sitemapChecks.length,
  docsChecked: '/docs/getting-started',
  assetsChecked: 2,
  unknownRouteStatus: unknown.status,
}, null, 2));
