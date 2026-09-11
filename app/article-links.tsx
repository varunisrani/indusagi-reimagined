'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';

export function ArticleLinks({ children }: { children: ReactNode }) {
  const router = useRouter();
  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(target instanceof HTMLAnchorElement) || target.download || (target.target && target.target !== '_self')) return;
    const url = new URL(target.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    event.preventDefault();
    router.push(url.pathname + url.search + url.hash);
  }
  return <div onClick={navigate}>{children}</div>;
}
