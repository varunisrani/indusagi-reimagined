import { buildDocumentation, collectLocalHrefFailures } from './docs-core.mjs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const result = await buildDocumentation({ root, write: true });
const broken = collectLocalHrefFailures(result.documents);
if (broken.length) {
  console.error(JSON.stringify(broken, null, 2));
  throw new Error(`Generated documentation contains ${broken.length} unresolved local links`);
}
console.log(`Generated ${result.canonicalCount} canonical documents across ${result.routeCount} routes.`);
