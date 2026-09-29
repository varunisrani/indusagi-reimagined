import { documentPaths, documentRedirects } from '../data/content-index';
import { buildSitemapXml } from '../seo';

const staticPaths = ['/', '/privacy', '/terms', '/cookies'];

export function GET() {
  const paths = [...staticPaths, ...documentPaths.filter((path) => !documentRedirects[path])];
  return new Response(buildSitemapXml(paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
