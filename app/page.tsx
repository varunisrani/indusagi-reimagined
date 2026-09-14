import { HomePage } from './site';
import { HomeStructuredData } from './home-structured-data';
import { SITE_ORIGIN } from './seo';

export default function Page(){return <><link rel="canonical" href={`${SITE_ORIGIN}/`}/><meta property="og:url" content={`${SITE_ORIGIN}/`}/><HomeStructuredData/><HomePage/></>;}
