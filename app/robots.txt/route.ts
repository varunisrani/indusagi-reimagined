import { getSiteOrigin } from '../site-origin';

const agents = ['*', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot', 'anthropic-ai'];
export function GET(){const rules=agents.map(agent=>`User-agent: ${agent}\nAllow: /`).join('\n\n');return new Response(`${rules}\n\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
