'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Sidebar } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { editions } from './site-data';
import { SiteLink } from './site-link';
import type { NavItem } from './document-types';

export function DocsNavigation({ path, title, items }: { path: string; title: string; items: NavItem[] }) {
  const [search, setSearch] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const router = useRouter();
  const base = '/' + path.split('/')[1];
  const edition = editions.find(e => e.path === base) || editions[0];
  const active = items.find(n => n.url === path)?.url || items.find(n => n.text === title)?.url;
  const filtered = items.map((item, i) => ({ ...item, index: i + 1 })).filter(n => n.text.toLowerCase().includes(search.toLowerCase()));
  return <Sidebar collapsible="none" className="docs-sidebar" role="complementary">
    <div className="docs-package-label">{edition.type === 'Framework' ? 'PACKAGE' : 'CLI'}</div>
    <div className="docs-package">{edition.name}</div><p>Developer documentation</p>
    <Select value={base} onValueChange={value => router.push(value)}><SelectTrigger className="edition-select" aria-label="Documentation edition"><SelectValue /></SelectTrigger><SelectContent>{editions.map(e => <SelectItem key={e.path} value={e.path}>{e.lang} · {e.type}</SelectItem>)}</SelectContent></Select>
    <button className="docs-mobile-toggle" aria-expanded={mobileNav} aria-controls="article-navigation" onClick={() => setMobileNav(!mobileNav)}>Browse pages <span>{mobileNav ? '−' : '+'}</span></button>
    <div id="article-navigation" className={mobileNav ? 'docs-browse is-open' : 'docs-browse'}>
      <label className="docs-search"><Search size={16} /><input aria-label="Search docs" placeholder="Search docs…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <nav aria-label="Documentation articles" className="docs-nav">{filtered.length ? filtered.map(n => <SiteLink href={n.url} onClick={() => setMobileNav(false)} className={n.url === active ? 'active' : ''} aria-current={n.url === active ? 'page' : undefined} key={n.url}><span className="nav-index">{String(n.index).padStart(2, '0')}</span>{n.text}</SiteLink>) : <p className="no-docs">No matching pages.</p>}</nav>
    </div>
  </Sidebar>;
}
