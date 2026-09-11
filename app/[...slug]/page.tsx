import { notFound } from 'next/navigation';
import { DocsShell } from '../docs-shell';
import { SiteLink } from '../site-link';
import { ArticleLinks } from '../article-links';
import { getDocument } from '../data/content-index';
type PageParams = { params: Promise<{ slug: string[] }> };
export async function generateMetadata({ params }: PageParams) {
  const { slug } = await params;
  const doc = await getDocument('/' + slug.join('/'));
  return { title: doc ? `${doc.title} — IndusAGI Documentation` : 'Page not found — IndusAGI' };
}
export default async function Page({ params }: PageParams) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const doc = await getDocument(path);
  if (!doc) notFound();
  if (doc.kind === 'article') return <div id="top"><main className="editorial-page wrap"><SiteLink href="/" className="editorial-back">← Back to Home</SiteLink><span className="eyebrow orange">IndusAGI</span><h1>{doc.title}</h1><ArticleLinks><article className="article-prose" dangerouslySetInnerHTML={{ __html: doc.html }} /></ArticleLinks></main></div>;
  return <DocsShell path={path} {...doc} />;
}
