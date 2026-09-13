import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const chromeRoot = resolve(root, '.sites-runtime/chrome153');
const chrome = process.env.CHROME_BIN || resolve(chromeRoot, 'chrome-headless-shell-linux64/chrome-headless-shell');
const chromedriver = process.env.CHROMEDRIVER_BIN || resolve(chromeRoot, 'chromedriver-linux64/chromedriver');
const driverPort = 9516;
const appPort = 5197;
const browserOrigin = `http://127.0.0.1:${appPort}`;

const sleep = ms => new Promise(resolvePromise => setTimeout(resolvePromise, ms));

async function waitFor(check, description, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${description}${lastError ? `: ${lastError.message}` : ''}`);
}

async function webdriver(path, body) {
  const response = await fetch(`http://127.0.0.1:${driverPort}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || payload.value?.error) throw new Error(JSON.stringify(payload.value));
  return payload.value;
}

function stop(child) {
  if (child && child.exitCode === null) child.kill('SIGTERM');
}

test('root route does not replace the docs shell with a full-page loading fallback', async () => {
  await assert.rejects(access(resolve(root, 'app/loading.tsx')), { code: 'ENOENT' });
});

test('docs navigation retains the visible shell and does not reload the document', { timeout: 90_000 }, async t => {
  try {
    await Promise.all([access(chrome), access(chromedriver)]);
  } catch {
    t.skip('Set CHROME_BIN and CHROMEDRIVER_BIN to run the browser regression test.');
    return;
  }

  let sessionId;
  const app = spawn(process.execPath, ['node_modules/vinext/dist/cli.js', 'dev', '--hostname', '127.0.0.1', '--port', String(appPort)], {
    cwd: root,
    env: process.env,
    stdio: 'ignore',
  });
  const libraryPath = resolve(chromeRoot, 'nss/usr/lib/x86_64-linux-gnu');
  const driver = spawn(chromedriver, [`--port=${driverPort}`, '--allowed-ips=127.0.0.1'], {
    cwd: root,
    env: { ...process.env, LD_LIBRARY_PATH: [libraryPath, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
    stdio: 'ignore',
  });
  t.after(async () => {
    if (sessionId) {
      try { await fetch(`http://127.0.0.1:${driverPort}/session/${sessionId}`, { method: 'DELETE', signal: AbortSignal.timeout(1_000) }); } catch {}
    }
    stop(driver);
    stop(app);
  });

  await waitFor(async () => (await fetch(`http://127.0.0.1:${appPort}/docs/getting-started`)).ok, 'development server');
  await waitFor(async () => {
    try { return (await fetch(`http://127.0.0.1:${driverPort}/status`)).ok; } catch { return false; }
  }, 'ChromeDriver');

  const session = await webdriver('/session', {
    capabilities: { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': {
      binary: chrome,
      args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000'],
    } } },
  });
  sessionId = session.sessionId;
  const execute = script => webdriver(`/session/${sessionId}/execute/sync`, { script, args: [] });

  await webdriver(`/session/${sessionId}/url`, { url: `${browserOrigin}/docs/getting-started` });
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'Getting Started', 'initial docs page');
  await waitFor(async () => execute(`
    const link = document.querySelector('a[href="/docs/architecture"]');
    return !!link && Object.keys(link).some(key => key.startsWith('__reactProps'));
  `), 'docs link hydration');
  const marker = `docs-${Date.now()}`;
  await execute(`
    window.__docsNavigationMarker = ${JSON.stringify(marker)};
    window.__docsShell = document.querySelector('.docs-layout');
    window.__docsTransition = { loadingSeen: false, contentHidden: false };
    new MutationObserver(() => {
      if (document.querySelector('.route-loading')) window.__docsTransition.loadingSeen = true;
      if (!document.querySelector('.doc-main h1')) window.__docsTransition.contentHidden = true;
    }).observe(document.body, { childList: true, subtree: true });
    return true;
  `);

  const point = await execute(`
    const rect = document.querySelector('a[href="/docs/architecture"]').getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  `);
  const dispatchMouse = (type, button = 'none') => webdriver(`/session/${sessionId}/goog/cdp/execute`, {
    cmd: 'Input.dispatchMouseEvent',
    params: { type, ...point, button, clickCount: 1 },
  });
  await webdriver(`/session/${sessionId}/goog/cdp/execute`, {
    cmd: 'Emulation.setCPUThrottlingRate',
    params: { rate: 20 },
  });
  await dispatchMouse('mousePressed', 'left');
  await dispatchMouse('mouseReleased', 'left');
  await sleep(150);
  const pending = await execute(`return {
    marker: window.__docsNavigationMarker,
    heading: document.querySelector('h1')?.textContent || null,
    sameShell: window.__docsShell === document.querySelector('.docs-layout') && window.__docsShell?.isConnected,
    loadingVisible: !!document.querySelector('.route-loading'),
  };`);
  assert.deepEqual(pending, {
    marker,
    heading: 'Getting Started',
    sameShell: true,
    loadingVisible: false,
  });

  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'Architecture', 'client-side docs transition');
  const settled = await execute(`return {
    marker: window.__docsNavigationMarker,
    navigationEntries: performance.getEntriesByType('navigation').length,
    transition: window.__docsTransition,
  };`);
  assert.deepEqual(settled, {
    marker,
    navigationEntries: 1,
    transition: { loadingSeen: false, contentHidden: false },
  });

  await webdriver(`/session/${sessionId}/goog/cdp/execute`, {
    cmd: 'Emulation.setCPUThrottlingRate',
    params: { rate: 1 },
  });
  await webdriver(`/session/${sessionId}/goog/cdp/execute`, {
    cmd: 'Emulation.setDeviceMetricsOverride',
    params: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true },
  });
  await webdriver(`/session/${sessionId}/url`, { url: `${browserOrigin}/` });
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent'))?.includes('open-source'), 'mobile homepage');
  await waitFor(async () => execute(`
    const link = document.querySelector('main a[href="/docs"]');
    return !!link && Object.keys(link).some(key => key.startsWith('__reactProps'));
  `), 'mobile homepage hydration');
  const homeDocsLink = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: 'main a[href="/docs"]' });
  await webdriver(`/session/${sessionId}/element/${homeDocsLink['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'Getting Started', 'homepage to docs on mobile');

  const mobileLayout = await execute(`return {
    width: innerWidth,
    toggle: getComputedStyle(document.querySelector('.docs-mobile-toggle')).display,
    articleVisible: document.querySelector('.doc-main').getBoundingClientRect().height > 0,
  };`);
  assert.deepEqual(mobileLayout, { width: 390, toggle: 'flex', articleVisible: true });

  const browseButton = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: '.docs-mobile-toggle' });
  await webdriver(`/session/${sessionId}/element/${browseButton['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  assert.equal(await execute(`return getComputedStyle(document.querySelector('.docs-browse')).display;`), 'flex');
  const mobileArchitecture = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: 'a[href="/docs/architecture"]' });
  await webdriver(`/session/${sessionId}/element/${mobileArchitecture['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'Architecture', 'mobile docs sidebar navigation');

  const mobileBrowseAgain = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: '.docs-mobile-toggle' });
  await webdriver(`/session/${sessionId}/element/${mobileBrowseAgain['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  const search = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: 'input[aria-label="Search docs"]' });
  await webdriver(`/session/${sessionId}/element/${search['element-6066-11e4-a52e-4f735466cecf']}/value`, { text: 'providers', value: [...'providers'] });
  const providerResult = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: 'a[href="/docs/ai/providers"]' });
  await webdriver(`/session/${sessionId}/element/${providerResult['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'AI Providers', 'mobile search result navigation');

  const nextLink = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: '.doc-pagination a:last-child' });
  await webdriver(`/session/${sessionId}/element/${nextLink['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'AI Utilities', 'mobile next-page navigation');
  const previousLink = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: '.doc-pagination a:first-child' });
  await webdriver(`/session/${sessionId}/element/${previousLink['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return document.querySelector("h1")?.textContent')) === 'AI Providers', 'mobile previous-page navigation');

  const editionSelect = await webdriver(`/session/${sessionId}/element`, { using: 'css selector', value: '[aria-label="Documentation edition"]' });
  await webdriver(`/session/${sessionId}/element/${editionSelect['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  const pythonEdition = await webdriver(`/session/${sessionId}/element`, { using: 'xpath', value: '//*[@role="option" and contains(., "Python · Framework")]' });
  await webdriver(`/session/${sessionId}/element/${pythonEdition['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
  await waitFor(async () => (await execute('return location.pathname')) === '/python/getting-started', 'mobile edition switcher');
  await webdriver(`/session/${sessionId}/back`, {});
  await waitFor(async () => (await execute('return location.pathname')) === '/docs/ai/providers', 'mobile browser back');
  await webdriver(`/session/${sessionId}/forward`, {});
  await waitFor(async () => (await execute('return location.pathname')) === '/python/getting-started', 'mobile browser forward');

  const external = await execute(`
    const link = document.querySelector('a[href="https://www.npmjs.com/package/indusagi"]');
    return { href: link?.href, target: link?.target, rel: link?.rel };
  `);
  assert.deepEqual(external, { href: 'https://www.npmjs.com/package/indusagi', target: '_blank', rel: 'noreferrer' });
});
