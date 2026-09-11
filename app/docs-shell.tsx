import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { editions } from './site-data';
import { SiteLink } from './site-link';
import { DocsNavigation } from './docs-navigation';
import { ArticleLinks } from './article-links';
import type { DocumentPage } from './document-types';

export function DocsShell({ path, title, html, nav, sections }: DocumentPage & { path: string }) {
  const base = '/' + path.split('/')[1];
  const edition = editions.find(e => e.path === base) || editions[0];
  const items = nav.filter(n => n.url.startsWith(base + '/'));
  const index = items.findIndex(n => n.url === path);
  const current = index < 0 ? items.findIndex(n => n.text === title) : index;
  return <div id="top">
    <div className="docs-topbar wrap"><SiteLink href="/" className="back-home"><ArrowLeft size={16} /> Back to home</SiteLink><span>Docs <span>/</span> {edition.lang} <span>/</span> {edition.type}</span></div>
    <SidebarProvider className="docs-layout wrap">
      <DocsNavigation path={path} title={title} items={items} />
      <main className="doc-main">
        <div className="article-topline"><span className="eyebrow">{edition.lang} / {edition.type}</span><BookOpen size={19} /></div><h1>{title}</h1>
        <ArticleLinks><article className="article-prose" dangerouslySetInnerHTML={{ __html: html }} /></ArticleLinks>
        <div className="doc-pagination">{current > 0 ? <SiteLink href={items[current - 1].url}><ArrowLeft size={18} /><span><small>Previous</small>{items[current - 1].text}</span></SiteLink> : <span />}{current >= 0 && current < items.length - 1 && <SiteLink href={items[current + 1].url}><span><small>Next</small>{items[current + 1].text}</span><ArrowRight size={18} /></SiteLink>}</div>
      </main>
      <aside className="docs-toc"><span className="eyebrow">On this page</span><nav aria-label="On this page">{sections.map((s, i) => <a key={s.id + '-' + i} href={'#' + s.id}>{s.title}</a>)}</nav><div className="docs-tip"><span className="eyebrow">Tip</span><p>Use sidebar search to jump between modules fast.</p></div></aside>
    </SidebarProvider>
  </div>;
}
