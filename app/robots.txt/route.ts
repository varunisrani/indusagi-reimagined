import { buildRobotsText } from '../seo';

export function GET(){return new Response(buildRobotsText(),{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
