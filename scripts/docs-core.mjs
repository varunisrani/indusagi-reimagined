import { readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { marked } from 'marked';

const pinnedCommit = 'a24f7e9823d0149e27bf05af912fba8dd959866c';

const area = (basePath, sections, prefixes, order, preferred) => ({
  basePath, sections, prefixes, order, preferred,
});

export const AREA_CONFIG = {
  package: area('/docs', ['Start', 'Subsystems', 'AI', 'Agent', 'TUI', 'MCP', 'Memory', 'Reference'], {
    'subsystems/': 'Subsystems', 'ai/': 'AI', 'agent/': 'Agent', 'tui/': 'TUI', 'mcp/': 'MCP', 'memory/': 'Memory', 'use-cases/': 'Reference',
  }, ['README', 'getting-started', 'architecture', 'subsystems/llm-gateway', 'subsystems/runtime', 'subsystems/capabilities', 'subsystems/interop-mcp', 'subsystems/connectors-saas', 'subsystems/swarm', 'subsystems/smithy', 'subsystems/tracing', 'subsystems/shell-app', 'subsystems/react-ink', 'package-exports', 'use-cases/security-testing'], ['getting-started', 'README']),
  cli: area('/cli', ['Start', 'SDK & API', 'Customization', 'Session', 'Configuration', 'UI', 'Platform'], {
    'sdk': 'SDK & API', 'rpc': 'SDK & API', 'json': 'SDK & API',
    'extensions': 'Customization', 'loading-extensions': 'Customization', 'skills': 'Customization', 'hooks': 'Customization', 'subagents': 'Customization', 'prompt-templates': 'Customization', 'themes': 'Customization', 'packages': 'Customization', 'tools': 'Customization',
    'session': 'Session', 'tree': 'Session', 'compaction': 'Session',
    'settings': 'Configuration', 'models': 'Configuration', 'providers': 'Configuration', 'custom-provider': 'Configuration', 'keybindings': 'Configuration',
    'tui': 'UI', 'terminal-setup': 'UI', 'development': 'Platform', 'shell-aliases': 'Platform', 'windows': 'Platform',
  }, ['README', 'architecture', 'providers', 'sdk', 'rpc', 'json', 'extensions', 'loading-extensions', 'skills', 'hooks', 'subagents', 'tools', 'session', 'tree', 'compaction', 'settings', 'models', 'custom-provider', 'keybindings', 'tui', 'terminal-setup', 'development', 'shell-aliases', 'windows', 'packages', 'prompt-templates', 'themes'], ['README', 'providers', 'sdk']),
  python: area('/python', ['Start', 'Facades', 'Subsystems', 'UI', 'Reference'], {
    'facades/': 'Facades', 'subsystems/': 'Subsystems', 'ui/': 'UI', 'reference/': 'Reference',
  }, ['README', 'getting-started', 'architecture', 'facades/ai', 'facades/agent', 'facades/mcp', 'facades/memory', 'subsystems/llm-gateway', 'subsystems/runtime', 'subsystems/capabilities', 'subsystems/interop', 'subsystems/connectors', 'subsystems/swarm', 'subsystems/smithy', 'subsystems/tracing', 'subsystems/shell-app', 'ui/tui', 'ui/react-ink', 'ui/ui-bridge', 'reference/package-exports', 'reference/cli', 'reference/examples', 'reference/testing', 'reference/parity'], ['getting-started', 'README']),
  'python-cli': area('/python-cli', ['Start', 'Console', 'Subsystems', 'Configuration', 'Reference'], {
    'console/': 'Console', 'subsystems/': 'Subsystems', 'configuration/': 'Configuration', 'reference/': 'Reference',
  }, ['README', 'getting-started', 'architecture', 'console/overview', 'console/slash-commands', 'console/dialogs', 'console/theming', 'subsystems/launch', 'subsystems/boot', 'subsystems/conductor', 'subsystems/runtime-bridge', 'subsystems/capability-deck', 'subsystems/channels', 'subsystems/sessions', 'subsystems/window-budget', 'subsystems/transcript-export', 'subsystems/briefing', 'subsystems/addons', 'subsystems/insight', 'configuration/settings', 'configuration/auth', 'configuration/models', 'configuration/mcp', 'reference/cli', 'reference/package-exports', 'reference/parity', 'reference/testing'], ['getting-started', 'README']),
  rust: area('/rust', ['Start', 'Subsystems', 'UI', 'Reference'], {
    'subsystems/': 'Subsystems', 'ui/': 'UI', 'reference/': 'Reference',
  }, ['README', 'getting-started', 'architecture', 'subsystems/core', 'subsystems/llm-gateway', 'subsystems/runtime', 'subsystems/capabilities', 'subsystems/interop', 'subsystems/connectors', 'subsystems/swarm', 'subsystems/smithy', 'subsystems/tracing', 'subsystems/shell-app', 'subsystems/facade', 'ui/tui', 'ui/tui-render', 'reference/cli', 'reference/crate-exports', 'reference/testing', 'reference/parity'], ['getting-started', 'README']),
  'rust-cli': area('/rust-cli', ['Start', 'Console', 'Subsystems', 'Configuration', 'Reference'], {
    'console/': 'Console', 'subsystems/': 'Subsystems', 'configuration/': 'Configuration', 'reference/': 'Reference',
  }, ['README', 'getting-started', 'architecture', 'console/overview', 'console/slash-commands', 'console/dialogs', 'console/theming', 'subsystems/launch', 'subsystems/boot', 'subsystems/conductor', 'subsystems/runtime-bridge', 'subsystems/capability-deck', 'subsystems/channels', 'subsystems/sessions', 'subsystems/window-budget', 'subsystems/transcript-export', 'subsystems/briefing', 'subsystems/addons', 'subsystems/insight', 'configuration/settings', 'configuration/auth', 'configuration/models', 'configuration/mcp', 'reference/cli', 'reference/crate-exports', 'reference/parity', 'reference/testing'], ['getting-started', 'README']),
};

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function safeUrl(value) {
  const url = String(value || '').trim();
  if (!url || /^(?:javascript|data|vbscript):/i.test(url)) return '#';
  return escapeHtml(url);
}

const routeAliases = {
  '/rust/ui': '/rust/ui/tui',
  '/rust/subsystems': '/rust/architecture',
  '/rust-cli/console/overlays': '/rust-cli/console/dialogs',
  '/rust-cli/reference/core': '/rust-cli/reference/crate-exports',
  '/cli/reference/cli': '/cli',
  '/rust/performance': '/rust',
  '/rust/subsystems/connectors-saas': '/rust/subsystems/connectors',
  '/rust/reference/package-exports': '/rust/reference/crate-exports',
};

function documentationUrl(value, basePath, slug) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(raw)) return raw;
  const match = raw.match(/^([^?#]*)(.*)$/u);
  let pathname = match?.[1] || '';
  const suffix = match?.[2] || '';
  if (!pathname.startsWith('/')) pathname = posix.join(basePath, posix.dirname(slug), pathname);
  pathname = pathname.replace(/\.md$/i, '').replace(/\/$/, '') || '/';
  return `${routeAliases[pathname] || pathname}${suffix}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .trim()
    .replace(/\s*[→←↔]\s*/gu, ' ')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s/g, '-') || 'section';
}

function renderMarkdown(markdown, basePath, slug) {
  const sections = [];
  const seen = new Map();
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => escapeHtml(text);
  renderer.heading = function ({ text, depth, tokens }) {
    const plain = text.replace(/<[^>]+>/g, '');
    const base = slugify(plain);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    if (depth === 2 || depth === 3) sections.push({ id, title: plain, level: depth });
    const body = tokens ? this.parser.parseInline(tokens) : escapeHtml(text);
    return `<h${depth} id="${id}">${body}</h${depth}>`;
  };
  renderer.link = function ({ href, title, tokens }) {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${safeUrl(documentationUrl(href, basePath, slug))}"${titleAttr}>${this.parser.parseInline(tokens)}</a>`;
  };
  renderer.image = ({ href, title, text }) => `<img src="${safeUrl(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''}>`;
  const rendered = marked.parse(markdown, { renderer, gfm: true, breaks: false });
  const ids = [...rendered.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const html = rendered.replace(/href="#([^"]+)"/g, (attribute, fragment) => {
    if (ids.includes(fragment)) return attribute;
    const comparable = fragment.replace(/-+/g, '-');
    const matches = ids.filter(id => id.replace(/-+/g, '-') === comparable);
    return matches.length === 1 ? `href="#${matches[0]}"` : attribute;
  });
  return { html, sections };
}

async function filesUnder(directory) {
  const result = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.endsWith('.txt')) result.push(full);
    }
  }
  await walk(directory);
  return result;
}

function titleAndBody(markdown) {
  const lines = markdown.split(/\r?\n/);
  const index = lines.findIndex(line => line.trim().startsWith('# '));
  if (index < 0) return { title: 'Untitled', body: markdown };
  return { title: lines[index].replace(/^#\s+/, '').trim(), body: [...lines.slice(0, index), ...lines.slice(index + 1)].join('\n').trim() };
}

function sectionFor(config, slug) {
  for (const [match, section] of Object.entries(config.prefixes)) {
    if ((match.endsWith('/') && slug.startsWith(match)) || slug === match) return section;
  }
  if (slug === 'package-exports') return 'Reference';
  return 'Start';
}

function orderDocuments(config, docs) {
  const explicit = new Map(config.order.map((slug, index) => [slug, index]));
  return docs.sort((a, b) => {
    const section = config.sections.indexOf(a.section) - config.sections.indexOf(b.section);
    if (section) return section;
    const ordered = (explicit.get(a.slug) ?? 1000) - (explicit.get(b.slug) ?? 1000);
    return ordered || a.title.localeCompare(b.title);
  });
}

export async function buildDocumentation({ root, write = true }) {
  const provenance = JSON.parse(await readFile(join(root, 'content/source.json'), 'utf8'));
  if (provenance.commit !== pinnedCommit) throw new Error(`Unexpected canonical source commit: ${provenance.commit}`);

  const previousPath = join(root, 'app/data/documents.json');
  const previous = JSON.parse(await readFile(previousPath, 'utf8'));
  const documents = Object.fromEntries(Object.entries(previous).filter(([, doc]) => doc.kind === 'article'));
  const counts = {};
  const redirects = {};
  let canonicalCount = 0;

  for (const [name, config] of Object.entries(AREA_CONFIG)) {
    const directory = join(root, 'content', name);
    const entries = [];
    for (const file of await filesUnder(directory)) {
      const slug = relative(directory, file).replace(/\.txt$/, '').split(sep).join('/');
      const raw = await readFile(file, 'utf8');
      const { title, body } = titleAndBody(raw);
      const rendered = renderMarkdown(body, config.basePath, slug);
      entries.push({ slug, title, section: sectionFor(config, slug), ...rendered });
    }
    orderDocuments(config, entries);
    const nav = entries.map(({ slug, title, section }) => ({ text: title, url: `${config.basePath}/${slug}`, section }));
    for (const entry of entries) {
      documents[`${config.basePath}/${entry.slug}`] = { kind: 'documentation', title: entry.title, html: entry.html, nav, sections: entry.sections };
    }
    const defaultSlug = config.preferred.find(slug => entries.some(entry => entry.slug === slug));
    if (!defaultSlug) throw new Error(`No default document for ${name}`);
    const canonicalPath = `${config.basePath}/${defaultSlug}`;
    redirects[config.basePath] = canonicalPath;
    documents[config.basePath] = { ...documents[canonicalPath], nav, canonicalPath };
    counts[name] = entries.length;
    canonicalCount += entries.length;
  }

  const sorted = Object.fromEntries(Object.entries(documents).sort(([a], [b]) => a.localeCompare(b)));
  if (write) await writeGenerated(root, sorted, redirects);
  return { documents: sorted, redirects, counts, canonicalCount, routeCount: Object.keys(sorted).length };
}

async function writeGenerated(root, documents, redirects) {
  const data = join(root, 'app/data');
  const pages = join(data, 'pages');
  await rm(pages, { recursive: true, force: true });
  await mkdir(pages, { recursive: true });
  await writeFile(join(data, 'documents.json'), JSON.stringify(documents));
  const lines = [
    '// Generated by scripts/build-docs.mjs from the pinned canonical corpus.',
    'import type { DocumentPage } from "../document-types";',
    'const loaders: Record<string, () => Promise<{ default: DocumentPage }>> = {',
  ];
  let index = 0;
  for (const [path, document] of Object.entries(documents)) {
    const file = `page-${String(index++).padStart(3, '0')}.json`;
    await writeFile(join(pages, file), `${JSON.stringify(document)}\n`);
    lines.push(`  ${JSON.stringify(path)}: () => import("./pages/${file}"),`);
  }
  lines.push(
    '};',
    `export const documentRedirects: Readonly<Record<string, string>> = ${JSON.stringify(redirects)};`,
    'export const documentPaths = Object.keys(loaders);',
    'export async function getDocument(path: string): Promise<DocumentPage | undefined> {',
    '  const load = loaders[path];',
    '  return load ? (await load()).default : undefined;',
    '}',
    '',
  );
  await writeFile(join(data, 'content-index.ts'), lines.join('\n'));
}

export function collectLocalHrefFailures(documents) {
  const routes = new Set(['/', ...Object.keys(documents)]);
  const failures = [];
  for (const [route, doc] of Object.entries(documents)) {
    for (const match of doc.html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href || /^(?:https?:|mailto:|tel:)/i.test(href)) continue;
      let parsed;
      let target;
      try {
        parsed = new URL(href.replaceAll('&amp;', '&'), `https://local.invalid${route}`);
        target = parsed.pathname.replace(/\/$/, '') || '/';
      }
      catch { failures.push({ route, href, reason: 'invalid URL' }); continue; }
      if (!routes.has(target)) {
        failures.push({ route, href, target });
        continue;
      }
      if (parsed.hash) {
        let fragment;
        try { fragment = decodeURIComponent(parsed.hash.slice(1)); }
        catch { failures.push({ route, href, target, reason: 'invalid fragment encoding' }); continue; }
        const ids = new Set([...documents[target].html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
        if (!ids.has(fragment)) failures.push({ route, href, target, fragment });
      }
    }
  }
  return failures;
}
