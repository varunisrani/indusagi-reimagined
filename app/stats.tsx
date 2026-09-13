'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
type DownloadData = Record<string, number[]>;
const cacheKey = 'indus-npm-stats-v1';
const ttl = 15 * 60 * 1000;
const packages = ['indusagi', 'indusagi-coding-agent'];
let memoryCache: { at: number; data: DownloadData } | undefined;
let pending: Promise<DownloadData> | undefined;
function valid(data: unknown): data is DownloadData {
  if (!data || typeof data !== 'object') return false;
  return packages.every(name => { const values = (data as DownloadData)[name]; return Array.isArray(values) && values.length === 3 && values.every(n => Number.isFinite(n) && n >= 0); });
}
function loadStats(): Promise<DownloadData> {
  if (!memoryCache) {
    try { const c = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); if(c && typeof c.at === 'number' && valid(c.data)) memoryCache = c; } catch {}
  }
  if (memoryCache && Date.now() - memoryCache.at < ttl) return Promise.resolve(memoryCache.data);
  if (pending) return pending;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  pending = Promise.all(packages.map(async name => {
    const values = await Promise.all(['last-year', 'last-month', 'last-week'].map(async period => {
      const response = await fetch(`https://api.npmjs.org/downloads/point/${period}/${name}`, {signal: controller.signal});
      if (!response.ok) throw new Error('Stats unavailable');
      const data = await response.json() as {downloads?: unknown};
      if (typeof data.downloads !== 'number' || !Number.isFinite(data.downloads)) throw new Error('Invalid stats');
      return data.downloads;
    }));
    return [name, values] as const;
  })).then(entries => {
    const data = Object.fromEntries(entries);
    memoryCache = { at: Date.now(), data };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(memoryCache)); } catch {}
    return data;
  }).finally(() => { clearTimeout(timeout); pending = undefined; });
  return pending;
}
export function Stats() {
  const [data, setData] = useState<DownloadData>({});
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      observer.disconnect();
      loadStats().then(data => { if (active) setData(data); }).catch(() => { if (active) setFailed(true); });
    }, { rootMargin: '240px' });
    if (root.current) observer.observe(root.current);
    return () => { active = false; observer.disconnect(); };
  }, []);
  return <section ref={root} className="stats-section wrap"><div className="stats-intro"><span className="eyebrow">Live on npm</span><h2>Real download stats</h2><p>Pulled live from the npm registry.</p></div>{['indusagi','indusagi-coding-agent'].map((name,i)=><div className="stat-card" key={name}><div className="stat-package"><span>{i?'CLI Package':'SDK Package'}</span><a href={'https://www.npmjs.com/package/'+name} target="_blank" rel="noreferrer">{name} <ArrowUpRight size={14}/></a></div><div className="stat-numbers">{['per year','monthly','weekly'].map((label,j)=><div key={label}><strong>{data[name]?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(data[name][j]):'—'}</strong><span>{label}</span></div>)}</div>{!data[name]&&<small>{failed?'Live stats are temporarily unavailable.':'Loading stats…'}</small>}</div>)}</section>}
