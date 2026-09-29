import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
import { SiteLink } from '../site-link';

export const metadata: Metadata = {
  title: 'Cookie Notice — IndusAGI',
  description: 'The current IndusAGI website cookie and local-storage behavior.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie notice"
      intro="A plain-language explanation of browser storage used by the current public website."
    >
      <p><strong>Effective date:</strong> 28 September 2026.</p>

      <section>
        <h2>Current cookie use</h2>
        <p>The public IndusAGI website does not set first-party cookies and does not load advertising or analytics cookies.</p>
      </section>

      <section>
        <h2>Theme preference</h2>
        <p>If you change the color theme, the site saves <code>indus-theme</code> in browser <code>localStorage</code>. LocalStorage is not a cookie, is not sent with web requests, and is used only to remember the theme on that browser. You can remove it through browser site-data settings.</p>
      </section>

      <section>
        <h2>Why there is no consent banner</h2>
        <p>Because the current site does not use non-essential cookies or similar tracking technologies, a consent banner is not shown. A banner that asks for consent when no consent-requiring technology is present would be misleading.</p>
      </section>

      <section>
        <h2>Third-party destinations</h2>
        <p>External services linked from this website—including GitHub, npm, PyPI, Harbor, and Terminal-Bench—may use cookies under their own notices after you visit them. Read the destination&apos;s policy before using it.</p>
      </section>

      <section>
        <h2>Future changes</h2>
        <p>If IndusAGI later introduces analytics, advertising, account, or other non-essential storage, it will update this notice and add consent controls where required before enabling those technologies.</p>
      </section>

      <p>For questions, use the <SiteLink href="https://github.com/varunisrani/indusagi-reimagined/issues/new" target="_blank" rel="noreferrer">public project issue tracker</SiteLink> without posting sensitive information.</p>
    </LegalPage>
  );
}
