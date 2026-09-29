import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
import { SiteLink } from '../site-link';

export const metadata: Metadata = {
  title: 'Privacy Notice — IndusAGI',
  description: 'How the IndusAGI website handles technical data, local preferences, third-party services, and privacy requests.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy notice"
      intro="This notice describes the current public IndusAGI website. It does not extend to software you install, third-party websites, or services that you configure yourself."
    >
      <p><strong>Effective date:</strong> 28 September 2026.</p>

      <section>
        <h2>What this website does not ask for</h2>
        <p>The public website does not include account registration, contact forms, payments, advertising trackers, or analytics SDKs. Please do not send API keys, passwords, or other secrets through links or public issue trackers.</p>
      </section>

      <section>
        <h2>Information handled during a visit</h2>
        <ul>
          <li><strong>Theme preference:</strong> choosing light or dark mode stores <code>indus-theme</code> in your browser&apos;s <code>localStorage</code>. It stays on your device and can be removed through your browser settings.</li>
          <li><strong>Live package statistics:</strong> when the statistics section loads, your browser may request public download counts from the npm registry API. npm receives the technical information normally included with that request and applies its own privacy terms.</li>
          <li><strong>Hosting logs:</strong> hosting and content-delivery providers may process IP addresses, request paths, timestamps, user-agent strings, and security logs to deliver and protect the site. Their retention and processing are controlled by their services.</li>
        </ul>
      </section>

      <section>
        <h2>Third-party links</h2>
        <p>The site links to GitHub, npm, PyPI, Harbor, Terminal-Bench, and other documentation sources. Visiting those sites is governed by their policies. IndusAGI does not sell visitor information and does not use it for targeted advertising.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>This developer-documentation website is not directed to children and does not provide a form or account system for collecting a child&apos;s personal information.</p>
      </section>

      <section>
        <h2>Access and data deletion requests</h2>
        <p>The site has no user-account database or submitted profile records. You can clear the local theme preference in your browser. For a site-specific privacy or data deletion request, <SiteLink href="https://github.com/varunisrani/indusagi-reimagined/issues/new" target="_blank" rel="noreferrer">open a maintainer issue</SiteLink>. GitHub issues are public: do not include secrets or sensitive personal information. Ask the maintainer to arrange a private channel if verification is needed.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>This notice will be updated if the website begins collecting additional information or adds new analytics, account, payment, or communication features.</p>
      </section>
    </LegalPage>
  );
}
