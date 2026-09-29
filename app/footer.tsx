import { ArrowUpRight } from 'lucide-react';
import { SiteLink } from './site-link';

export function Footer() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="footer wrap">
      <div className="footer-top">
        <div>
          <SiteLink className="wordmark" href="/" aria-label="IndusAGI home">
            <img className="brand-image" src="/indusagi-logo.png" alt="IndusAGI" width="126" height="42" />
          </SiteLink>
          <p>The open-source AI agent stack.<br />TypeScript, Python &amp; Rust.</p>
        </div>
        <div>
          <h3>Product</h3>
          <SiteLink href="/docs">Framework</SiteLink>
          <SiteLink href="/cli">Coding Agent</SiteLink>
          <SiteLink href="/#benchmarks">Benchmarks</SiteLink>
        </div>
        <div>
          <h3>Docs</h3>
          <SiteLink href="/docs">TypeScript</SiteLink>
          <SiteLink href="/python">Python</SiteLink>
          <SiteLink href="/rust">Rust</SiteLink>
          <SiteLink href="/docs/getting-started">Getting started</SiteLink>
        </div>
        <div>
          <h3>Community</h3>
          <SiteLink href="https://github.com/varunisrani/indusagi-sdk" target="_blank" rel="noreferrer">GitHub</SiteLink>
          <SiteLink href="https://www.npmjs.com/package/indusagi" target="_blank" rel="noreferrer">npm</SiteLink>
          <SiteLink href="https://pypi.org/project/indusagi/" target="_blank" rel="noreferrer">PyPI</SiteLink>
        </div>
        <div>
          <h3>Legal</h3>
          <SiteLink href="/privacy">Privacy</SiteLink>
          <SiteLink href="/terms">Terms</SiteLink>
          <SiteLink href="/cookies">Cookies</SiteLink>
          <SiteLink href="https://github.com/varunisrani/indusagi-reimagined/issues/new" target="_blank" rel="noreferrer">Contact maintainers</SiteLink>
        </div>
      </div>
      <div className="footer-resources">
        <span className="eyebrow">Explore IndusAGI</span>
        <nav aria-label="Guides and comparisons">
          <SiteLink href="/use-cases/coding-agent">Terminal-First Autonomous Coding Agent CLI <ArrowUpRight size={15} /></SiteLink>
          <SiteLink href="/use-cases/memory-management">AI Agent Memory Management &amp; Context Compaction <ArrowUpRight size={15} /></SiteLink>
          <SiteLink href="/indusagi-vs-aider">IndusAGI vs Aider <ArrowUpRight size={15} /></SiteLink>
          <SiteLink href="/indusagi-vs-cursor">IndusAGI vs Cursor <ArrowUpRight size={15} /></SiteLink>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {year} IndusAGI · Open-source project</span>
        <span>Software licenses are stated in each repository.</span>
        <SiteLink href="#top">Back to top ↑</SiteLink>
      </div>
    </footer>
  );
}
