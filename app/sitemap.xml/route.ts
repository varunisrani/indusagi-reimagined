import { documentPaths, documentRedirects } from '../data/content-index';
import { buildSitemapXml } from '../seo';

export function GET(){const paths=['/',...documentPaths.filter(path=>!documentRedirects[path])];return new Response(buildSitemapXml(paths),{headers:{'Content-Type':'application/xml; charset=utf-8'}});}
