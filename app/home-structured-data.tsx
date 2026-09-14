import faq from './data/faq.json';
import { buildHomeStructuredData } from './seo';

export function HomeStructuredData() {
  const json = JSON.stringify(buildHomeStructuredData(faq)).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
