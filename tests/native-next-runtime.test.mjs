import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import test from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const next = resolve(root, 'node_modules/next/dist/bin/next');
const productionHostname = 'indusagi-runtime-test.vercel.app';

async function availablePort() {
  const server = createServer();
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const { port } = address;
  await new Promise((resolveClosed, reject) => server.close(error => error ? reject(error) : resolveClosed()));
  return port;
}

async function waitUntilReady(origin, process) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`Next server exited with ${process.exitCode}`);
    try {
      const response = await fetch(origin);
      await response.arrayBuffer();
      return;
    } catch {
      await new Promise(resolveWait => setTimeout(resolveWait, 50));
    }
  }
  throw new Error('Next production server did not become ready');
}

async function rawRequest(origin, path, headers = {}) {
  const url = new URL(origin);
  return new Promise((resolveResponse, reject) => {
    const outgoing = request({ hostname: url.hostname, port: url.port, path, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolveResponse({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    outgoing.once('error', reject);
    outgoing.end();
  });
}

test('native Next production server preserves redirect, not-found, and deployment URL semantics', { timeout: 180_000 }, async () => {
  const environment = {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: 'https://untrusted-override.example',
    VERCEL_PROJECT_PRODUCTION_URL: productionHostname,
  };
  execFileSync(process.execPath, [next, 'build'], { cwd: root, env: environment, stdio: 'pipe' });

  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [next, 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: root,
    env: environment,
    stdio: 'pipe',
  });

  try {
    await waitUntilReady(origin, server);

    const redirects = {
      '/docs': '/docs/getting-started',
      '/cli': '/cli/README',
      '/python': '/python/getting-started',
      '/python-cli': '/python-cli/getting-started',
      '/rust': '/rust/getting-started',
      '/rust-cli': '/rust-cli/getting-started',
    };
    for (const [source, destination] of Object.entries(redirects)) {
      const response = await fetch(`${origin}${source}`, { redirect: 'manual' });
      assert.equal(response.status, 308, source);
      assert.equal(response.headers.get('location'), destination, source);
    }

    for (const path of ['/definitely-missing', '/docs/definitely-missing']) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 404, path);
      assert.match(await response.text(), /Page not found/);
    }
    for (const path of ['/%2e%2e/%2e%2e/etc/passwd', '/docs/%2e%2e/%2e%2e/etc/passwd']) {
      const response = await rawRequest(origin, path);
      assert.ok(response.status === 400 || response.status === 404, `${path}: ${response.status}`);
    }

    for (const path of ['/', '/docs/getting-started', '/cli/extensions', '/python/facades/agent', '/rust-cli/configuration/models']) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 200, path);
    }

    const rootResponse = await rawRequest(origin, '/', { host: 'spoofed.example' });
    assert.match(rootResponse.body, new RegExp(`<link rel="canonical" href="https://${productionHostname}"`));
    const canonicalResponse = await rawRequest(origin, '/docs/getting-started', { host: 'spoofed.example' });
    assert.equal(canonicalResponse.status, 200);
    assert.match(canonicalResponse.body, new RegExp(`<link rel="canonical" href="https://${productionHostname}/docs/getting-started"`));
    assert.doesNotMatch(canonicalResponse.body, /spoofed\.example|untrusted-override\.example/);

    const robots = await (await fetch(`${origin}/robots.txt`)).text();
    assert.match(robots, new RegExp(`Sitemap: https://${productionHostname}/sitemap\\.xml`));
    const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
    assert.match(sitemap, new RegExp(`<loc>https://${productionHostname}/docs/getting-started</loc>`));
    const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
    assert.equal(sitemapPaths.length, 174);
    for (const redirectPath of Object.keys(redirects)) assert.ok(!sitemapPaths.includes(redirectPath), redirectPath);
    const llms = await fetch(`${origin}/llms.txt`);
    assert.equal(llms.status, 200);
    assert.match(await llms.text(), /npm install -g indusagi-coding-agent/);
  } finally {
    server.kill('SIGTERM');
    await new Promise(resolveExit => {
      if (server.exitCode !== null) resolveExit();
      else server.once('exit', resolveExit);
    });
  }
});
