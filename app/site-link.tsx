import Link from 'next/link';
import type { ComponentProps } from 'react';

export function SiteLink({ href, ...props }: ComponentProps<'a'>) {
  if (href?.startsWith('/') && !href.startsWith('//')) {
    return <Link href={href} prefetch={false} {...props} />;
  }
  return <a href={href} {...props} />;
}
