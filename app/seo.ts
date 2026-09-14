import type { Metadata } from 'next';

export const SITE_ORIGIN = 'https://www.indusagi.com';
export const SITE_NAME = 'IndusAGI';
export const HOME_TITLE = 'IndusAGI — Open-Source AI Agent Framework and Coding Agent';
export const HOME_DESCRIPTION =
  'Build and run terminal-first AI coding agents with the open-source IndusAGI framework for TypeScript, Python, and Rust.';

type FaqItem = Readonly<{ question: string; answer: string }>;

export function buildHomeStructuredData(faq: readonly FaqItem[]) {
  const websiteId = `${SITE_ORIGIN}/#website`;
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const softwareId = `${SITE_ORIGIN}/#software`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${SITE_ORIGIN}/`,
        name: SITE_NAME,
        description: HOME_DESCRIPTION,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/indusagi-logo.png`,
          width: 640,
          height: 213,
        },
        sameAs: ['https://github.com/varunisrani/indusagi'],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': softwareId,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        description: HOME_DESCRIPTION,
        applicationCategory: 'DeveloperApplication',
        license: 'https://opensource.org/license/mit',
        creator: { '@id': organizationId },
        isPartOf: { '@id': websiteId },
        softwareHelp: `${SITE_ORIGIN}/docs/getting-started`,
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_ORIGIN}/#faq`,
        isPartOf: { '@id': websiteId },
        mainEntity: faq.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };
}

const socialImage = {
  url: '/indusagi-logo.png',
  width: 640,
  height: 213,
  alt: SITE_NAME,
};

export function buildDocumentMetadata(title: string, description: string, canonical: string): Metadata {
  const pageTitle = `${title} — IndusAGI Documentation`;
  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [socialImage.url],
    },
  };
}

export function buildRobotsText() {
  return `User-agent: *\nAllow: /\n\nHost: ${SITE_ORIGIN}\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemapXml(paths: readonly string[]) {
  const locations = [...new Set(paths)].map((path) => escapeXml(new URL(path, `${SITE_ORIGIN}/`).href));
  const urls = locations.map((location) => `  <url><loc>${location}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const homepageMetadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [socialImage.url],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
};
