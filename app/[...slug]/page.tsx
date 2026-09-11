import { notFound, permanentRedirect } from 'next/navigation';
import { DocsShell } from '../docs-shell';
import { SiteLink } from '../site-link';
import { ArticleLinks } from '../article-links';
import { documentRedirects, getDocument } from '../data/content-index';
type PageParams = { params: Promise<{ slug: string[] }> };
export async function generateMetadata({ params }: PageParams) {
  const { slug } = await params;
  const doc = await getDocument('/' + slug.join('/'));
  if (!doc) return { title: 'Page not found — IndusAGI' };
  const description = doc.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const canonical = doc.canonicalPath || '/' + slug.join('/');
  return { title: `${doc.title} — IndusAGI Documentation`, description, alternates: { canonical } };
}
export default async function Page({ params }: PageParams) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const redirect = documentRedirects[path];
  if (redirect) permanentRedirect(redirect);
  const doc = await getDocument(path);
  if (!doc) notFound();
  if (doc.kind === 'article') return <div id="top"><main className="editorial-page wrap"><SiteLink href="/" className="editorial-back">← Back to Home</SiteLink><span className="eyebrow orange">IndusAGI</span><h1>{doc.title}</h1><ArticleLinks><article className="article-prose" dangerouslySetInnerHTML={{ __html: doc.html }} /></ArticleLinks></main></div>;
  return <DocsShell path={path} {...doc} />;
}
