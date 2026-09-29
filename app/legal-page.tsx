import type { ReactNode } from 'react';
import { SiteLink } from './site-link';

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page wrap">
      <SiteLink href="/" className="editorial-back">← Back to Home</SiteLink>
      <span className="eyebrow orange">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="legal-intro">{intro}</p>
      <div className="legal-content">{children}</div>
      <aside className="legal-operator" aria-labelledby="operator-details">
        <h2 id="operator-details">Operator details</h2>
        <p>IndusAGI is an open-source project. Maintainer: Varun Israni (<code>varunisrani</code> on GitHub).</p>
        <ul>
          <li>Website: <SiteLink href="https://www.indusagi.com/">www.indusagi.com</SiteLink></li>
          <li>Source and issue tracker: <SiteLink href="https://github.com/varunisrani/indusagi-reimagined" target="_blank" rel="noreferrer">github.com/varunisrani/indusagi-reimagined</SiteLink></li>
        </ul>
      </aside>
    </main>
  );
}
