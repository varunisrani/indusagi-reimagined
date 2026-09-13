'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Boxes, Braces, Cpu, Layers, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { layers } from './site-data';
import examples from './data/layer-examples.json';
import { SiteLink } from './site-link';
import { CopyButton } from './copy-button';

const names = ['Gateway', 'Runtime', 'Tools', 'Memory', 'Terminal'];
const icons = [Boxes, Cpu, Braces, Layers, Terminal];

export function CapabilityShowcase() {
  const [selected, setSelected] = useState('1');
  useEffect(() => {
    const selectHash = () => {
      const match = /^#layer-([1-5])$/.exec(window.location.hash);
      if (match) setSelected(String(Number(match[1]) - 1));
    };
    selectHash();
    window.addEventListener('hashchange', selectHash);
    return () => window.removeEventListener('hashchange', selectHash);
  }, []);
  return <div className="capability-showcase">
    {layers.map(([title], i) => <span key={title} id={`layer-${i + 1}`} className="layer-anchor" />)}
    <Tabs value={selected} onValueChange={setSelected}>
      <TabsList className="capability-tabs" aria-label="Explore the IndusAGI stack">
        {names.map((name, i) => { const Icon = icons[i]; return <TabsTrigger key={name} value={String(i)}><Icon size={16} />{name}</TabsTrigger>; })}
      </TabsList>
      {layers.map(([title, description], i) => {
        const Icon = icons[i];
        return <TabsContent key={title} value={String(i)} className="capability-panel">
          <div className="capability-copy"><span className="capability-icon"><Icon size={25} /></span><span className="eyebrow">Layer 0{i + 1}</span><h3>{title}</h3><p>{description}</p><SiteLink href={examples[i].path} className="text-button">Read the documentation <ArrowUpRight size={17} /></SiteLink></div>
          <div className="code-window"><div className="code-window-top"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>{examples[i].file}</span><CopyButton text={examples[i].code} /></div><pre tabIndex={0} aria-label={`${title} code example`}><code>{examples[i].code}</code></pre><div className="code-window-bottom"><span>INDUSAGI</span><span>{i === 4 ? 'Terminal-first coding agent' : 'TypeScript framework'}</span></div></div>
        </TabsContent>;
      })}
    </Tabs>
  </div>;
}
