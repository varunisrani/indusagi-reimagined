import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_ORIGIN,
  buildDocumentMetadata,
  buildHomeStructuredData,
  buildRobotsText,
  buildSitemapXml,
  homepageMetadata,
} from '../app/seo.ts';

const root = resolve(import.meta.dirname, '..');

test('homepage metadata has one canonical production identity and complete social cards', () => {
  assert.equal(SITE_ORIGIN, 'https://www.indusagi.com');
  assert.equal(HOME_TITLE, 'IndusAGI — Open-Source AI Agent Framework and Coding Agent');
  assert.equal(
    HOME_DESCRIPTION,
    'Build and run terminal-first AI coding agents with the open-source IndusAGI framework for TypeScript, Python, and Rust.',
  );
  assert.equal(homepageMetadata.metadataBase?.href, 'https://www.indusagi.com/');
  assert.equal(homepageMetadata.title, HOME_TITLE);
  assert.equal(homepageMetadata.description, HOME_DESCRIPTION);
  assert.equal(homepageMetadata.alternates?.canonical, '/');
  assert.deepEqual(homepageMetadata.robots, { index: true, follow: true });
  assert.deepEqual(homepageMetadata.openGraph, {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'IndusAGI',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{
      url: '/indusagi-logo.png',
      width: 640,
      height: 213,
      alt: 'IndusAGI',
    }],
  });
  assert.deepEqual(homepageMetadata.twitter, {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ['/indusagi-logo.png'],
  });
  assert.deepEqual(homepageMetadata.icons, {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  });
});

test('documentation metadata keeps each document canonical and shareable', () => {
  const metadata = buildDocumentMetadata(
    'Getting Started',
    'Install and configure the IndusAGI framework.',
    '/docs/getting-started',
  );

  assert.equal(metadata.title, 'Getting Started — IndusAGI Documentation');
  assert.equal(metadata.description, 'Install and configure the IndusAGI framework.');
  assert.deepEqual(metadata.alternates, { canonical: '/docs/getting-started' });
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.openGraph, {
    type: 'article',
    locale: 'en_US',
    url: '/docs/getting-started',
    siteName: 'IndusAGI',
    title: 'Getting Started — IndusAGI Documentation',
    description: 'Install and configure the IndusAGI framework.',
    images: [{
      url: '/indusagi-logo.png',
      width: 640,
      height: 213,
      alt: 'IndusAGI',
    }],
  });
  assert.deepEqual(metadata.twitter, {
    card: 'summary_large_image',
    title: 'Getting Started — IndusAGI Documentation',
    description: 'Install and configure the IndusAGI framework.',
    images: ['/indusagi-logo.png'],
  });
});

test('homepage structured data identifies the site, organization, software, and visible FAQ', async () => {
  const faq = JSON.parse(await readFile(resolve(root, 'app/data/faq.json'), 'utf8'));
  const data = buildHomeStructuredData(faq);

  assert.equal(data['@context'], 'https://schema.org');
  assert.deepEqual(data['@graph'].map((entry) => entry['@type']), [
    'WebSite',
    'Organization',
    'SoftwareApplication',
    'FAQPage',
  ]);
  assert.deepEqual(data['@graph'].map((entry) => entry['@id']), [
    'https://www.indusagi.com/#website',
    'https://www.indusagi.com/#organization',
    'https://www.indusagi.com/#software',
    'https://www.indusagi.com/#faq',
  ]);

  const [website, organization, software, faqPage] = data['@graph'];
  assert.equal(website.url, 'https://www.indusagi.com/');
  assert.deepEqual(website.publisher, { '@id': organization['@id'] });
  assert.equal(organization.logo.url, 'https://www.indusagi.com/indusagi-logo.png');
  assert.equal(software.applicationCategory, 'DeveloperApplication');
  assert.equal(software.license, 'https://opensource.org/license/mit');
  assert.equal(software.softwareHelp, 'https://www.indusagi.com/docs/getting-started');
  assert.deepEqual(
    faqPage.mainEntity,
    faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  );
  assert.doesNotMatch(JSON.stringify(data), /SearchAction|aggregateRating|offers/);
});

test('visible FAQ uses the documented TypeScript install command and avoids unsupported setup timing', async () => {
  const faq = JSON.parse(await readFile(resolve(root, 'app/data/faq.json'), 'utf8'));
  const answers = faq.map(({ answer }) => answer).join('\n');
  assert.match(answers, /npm install -g indusagi-coding-agent/);
  assert.doesNotMatch(answers, /npm install -g induscode|under two minutes/i);
});

test('robots policy allows public crawling and advertises only the canonical sitemap', () => {
  assert.equal(
    buildRobotsText(),
    'User-agent: *\nAllow: /\n\nHost: https://www.indusagi.com\nSitemap: https://www.indusagi.com/sitemap.xml\n',
  );
});

test('sitemap output is canonical, escaped, and deduplicated without invented dates', () => {
  const xml = buildSitemapXml(['/', '/docs/getting-started', '/docs/getting-started', '/guide?a&b']);
  assert.equal((xml.match(/<url>/g) || []).length, 3);
  assert.match(xml, /<loc>https:\/\/www\.indusagi\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.indusagi\.com\/docs\/getting-started<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.indusagi\.com\/guide\?a&amp;b<\/loc>/);
  assert.doesNotMatch(xml, /<lastmod>|vercel\.app|NEXT_PUBLIC_SITE_URL/);
});

test('LLM discovery file describes the product factually and links canonical documentation', async () => {
  const discovery = await readFile(resolve(root, 'public/llms.txt'), 'utf8');
  assert.match(discovery, /^# IndusAGI$/m);
  assert.match(discovery, /https:\/\/www\.indusagi\.com\/$/m);
  for (const path of [
    'docs/getting-started',
    'cli/README',
    'python/getting-started',
    'python-cli/getting-started',
    'rust/getting-started',
    'rust-cli/getting-started',
  ]) assert.match(discovery, new RegExp(`https://www\\.indusagi\\.com/${path.replace('/', '\\/')}`));
  assert.match(discovery, /npm install -g indusagi-coding-agent/);
  assert.doesNotMatch(discovery, /official ranking signal|rating|customers|award/i);
});
