import { ArrowUpRight, Star } from 'lucide-react';
import { editions } from './site-data';
import { Installer } from './installer';
import { Stats } from './stats';
import { CopyButton } from './copy-button';
import { FAQ } from './faq';
import { HeroTerminal } from './hero-terminal';
import { HeroTitle } from './hero-title';
import { SiteLink } from './site-link';
import { CapabilityShowcase } from './capability-showcase';
import { Benchmarks } from './benchmarks';

export function HomePage() {
  return <div id="top"><main>
    <a href="#benchmarks" className="benchmark-announcement"><span>TERMINAL-BENCH 2.1</span><strong>86.74% strict accuracy</strong><span className="announcement-detail">IndusAGI-reported · 445 trials each</span><ArrowUpRight size={16} /></a>
    <section className="hero wrap">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="hero-badge"><span />Open source · MIT licensed</span>
          <HeroTitle />
          <p>A terminal-first coding agent and the framework underneath it. Install from npm, pip, or cargo — free models included, or bring Claude, GPT, Gemini and your own.</p>
          <div className="hero-actions">
            <SiteLink href="/docs" className="primary-button">Read the docs <ArrowUpRight size={18} /></SiteLink>
            <SiteLink href="https://github.com/varunisrani/indusagi" className="secondary-button"><Star size={16} /> Star on GitHub</SiteLink>
          </div>
          <div className="hero-install"><code>npm install -g indusagi</code><CopyButton text="npm install -g indusagi" label="Copy" /></div>
          <a className="hero-proof" href="#benchmarks"><strong>386 / 445</strong><span>Terminal-Bench 2.1 · TypeScript &amp; Python<br />IndusAGI-reported results</span><ArrowUpRight size={15} /></a>
        </div>
        <HeroTerminal />
      </div>
      <div className="hero-base">
        <p>Free models included.<br /><span>No account, no credit card.</span></p>
        <div className="provider-list" aria-label="Supported model providers"><span>Claude</span><span>GPT</span><span>Gemini</span><span>Groq</span><span>Ollama</span></div>
      </div>
    </section>
    <Benchmarks />
    <section className="architecture-section wrap" id="architecture">
      <div className="section-heading centered-heading"><span className="section-number">The complete stack</span><h2>Five capability layers.<br /><span className="muted">One import.</span></h2><p>Drop in the whole stack or reach for a single layer. The same architecture ships in TypeScript, Python, and Rust.</p></div>
      <CapabilityShowcase />
    </section>
    <section className="install-section wrap">
      <div className="install-intro"><span className="section-number">From idea to terminal</span><h2>Start building<br /><span className="muted">in one command.</span></h2><p>Free models included. No account, no credit card.</p><div className="install-languages"><span>TypeScript</span><span>Python</span><span>Rust</span></div></div>
      <Installer />
    </section>
    <Stats />
    <section className="editions-section wrap" id="editions">
      <div className="section-heading centered-heading"><span className="section-number">Documentation</span><h2>Pick your edition<span className="orange">.</span></h2><p>Framework or coding agent, in the language your team already ships.</p></div>
      <div className="edition-grid">{['TypeScript', 'Python', 'Rust'].map((lang, i) => <div className="edition-column" key={lang}>
        <div className="edition-language"><span>{['TS', 'PY', 'RS'][i]}</span><h3>{lang}</h3></div>
        {editions.filter(e => e.lang === lang).map(e => <SiteLink href={e.path} className="edition-card" key={e.path}><div className="edition-meta"><span>{e.type}</span><span>{e.pages} pages</span></div><h4>{e.name}</h4><p>{e.description}</p><span className="edition-link">Open docs <ArrowUpRight size={18} /></span></SiteLink>)}
      </div>)}</div>
    </section>
    <section className="faq-section wrap"><div><span className="section-number">Frequently asked</span><h2>Questions,<br /><span className="muted">answered.</span></h2></div><FAQ /></section>
    <section className="closing wrap"><div className="closing-inner"><span className="hero-badge"><span />Open source · MIT licensed</span><h2>Start building<br /><span className="muted">in one command.</span></h2><p>Free models included. No account, no credit card.</p><SiteLink href="/docs" className="primary-button">Get started <ArrowUpRight size={18} /></SiteLink><div className="closing-command"><code>npm install -g indusagi</code><CopyButton text="npm install -g indusagi" /></div></div></section>
  </main></div>;
}
