const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indusagi.com';
const agents = ['*', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot', 'anthropic-ai'];
export function GET(){const rules=agents.map(agent=>`User-agent: ${agent}\nAllow: /`).join('\n\n');return new Response(`${rules}\n\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
