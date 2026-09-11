import { readFile, writeFile, mkdir } from 'node:fs/promises';

const source = new URL('../app/data/', import.meta.url);
const docs = JSON.parse(await readFile(new URL('documents.json', source), 'utf8'));
await mkdir(new URL('pages/', source), { recursive: true });
const lines = [
  '// Per-route content stays on the server and is loaded only when requested.',
  'import type { DocumentPage } from "../document-types";',
  'const loaders: Record<string, () => Promise<{ default: DocumentPage }>> = {',
];
for (const [index, [path, document]] of Object.entries(docs).entries()) {
  const file = `page-${String(index).padStart(3, '0')}.json`;
  await writeFile(new URL(`pages/${file}`, source), JSON.stringify(document) + '\n');
  lines.push(`  ${JSON.stringify(path)}: () => import("./pages/${file}"),`);
}
lines.push('};', 'export const documentPaths = Object.keys(loaders);',
  'export async function getDocument(path: string): Promise<DocumentPage | undefined> {',
  '  const load = loaders[path];', '  return load ? (await load()).default : undefined;', '}', '');
await writeFile(new URL('content-index.ts', source), lines.join('\n'));
console.log(`Prepared ${Object.keys(docs).length} independent documentation routes.`);
