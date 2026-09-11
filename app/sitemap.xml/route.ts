import { documentPaths } from '../data/content-index';
const origin='https://indusagi-reimagined.varun-israni-2063303.chatgpt.site';
export function GET(){const urls=['/',...documentPaths].map(path=>`<url><loc>${origin}${path}</loc></url>`).join('');return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});}
