const fallbackOrigin = 'https://www.indusagi.com';

function vercelProductionOrigin(value: string | undefined): string | undefined {
  const hostname = value?.trim().toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname.length > 253) return undefined;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+vercel\.app$/.test(hostname)) return undefined;
  return `https://${hostname}`;
}

function configuredOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function getSiteOrigin(): string {
  return vercelProductionOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    || configuredOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    || fallbackOrigin;
}
