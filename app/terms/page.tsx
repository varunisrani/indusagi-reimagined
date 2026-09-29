import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
import { SiteLink } from '../site-link';

export const metadata: Metadata = {
  title: 'Terms of Use — IndusAGI',
  description: 'Terms for using the IndusAGI website, documentation, links, and open-source materials.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      intro="These terms apply to the public IndusAGI website and documentation. They do not replace the license terms attached to individual software repositories or third-party services."
    >
      <p><strong>Effective date:</strong> 28 September 2026.</p>

      <section>
        <h2>Open-source project</h2>
        <p>IndusAGI is an open-source project. Software is provided under the license stated in its repository, including the MIT License where identified. Repository license files control if website text and repository metadata differ.</p>
      </section>

      <section>
        <h2>Documentation and acceptable use</h2>
        <p>You may use the public website and documentation for lawful evaluation, learning, and development. Do not interfere with the website, bypass access controls, distribute malware, misuse project infrastructure, or use the materials to violate another person&apos;s rights.</p>
      </section>

      <section>
        <h2>No warranties</h2>
        <p>The website, documentation, examples, benchmark references, and open-source materials are provided as available and without warranties to the extent permitted by law. Verify commands, security assumptions, compatibility, and benchmark methodology for your own environment before relying on them.</p>
      </section>

      <section>
        <h2>No website purchases or refunds</h2>
        <p>This website does not sell products or services, process payments, or offer a paid subscription. A refund policy does not apply to this website. Purchases made from a third-party provider are governed by that provider&apos;s terms and refund rules.</p>
      </section>

      <section>
        <h2>Third-party services and links</h2>
        <p>Links to GitHub, npm, PyPI, Harbor, model providers, benchmark projects, and other third-party services are provided for convenience and sourcing. IndusAGI does not control their availability, content, privacy practices, or terms.</p>
      </section>

      <section>
        <h2>Claims and benchmark context</h2>
        <p>Benchmark figures shown on the site identify their source and scope. They are not a promise that your results will match. Product capabilities can change, and the current source code and documentation should be checked before making a technical or commercial decision.</p>
      </section>

      <section>
        <h2>Questions and changes</h2>
        <p>Material updates will be posted on this page. Questions can be raised through the <SiteLink href="https://github.com/varunisrani/indusagi-reimagined/issues/new" target="_blank" rel="noreferrer">project issue tracker</SiteLink>; do not publish sensitive information there.</p>
      </section>
    </LegalPage>
  );
}
