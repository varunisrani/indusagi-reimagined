'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

const highlights = [
  { id: 'official-20', edition: 'TERMINAL-BENCH 2.0', headline: '#24 official rank', detail: 'IndusAGI Coding Agent · 69.1%' },
  { id: 'python-21', edition: 'TERMINAL-BENCH 2.1', headline: 'Python · 86.74%', detail: '386/445 strict accuracy · IndusAGI-reported' },
  { id: 'typescript-21', edition: 'TERMINAL-BENCH 2.1', headline: 'TypeScript · 86.74%', detail: '386/445 strict accuracy · IndusAGI-reported' },
  { id: 'rust-21', edition: 'TERMINAL-BENCH 2.1', headline: 'Rust · 73.03%', detail: '325/445 strict accuracy · IndusAGI-reported' },
] as const;

export function BenchmarkAnnouncement() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % highlights.length), 5_000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const highlight = highlights[index];
  return <a
    href="#benchmarks"
    className="benchmark-announcement"
    aria-label="Benchmark highlights; open detailed benchmark results"
    data-highlight={highlight.id}
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
  >
    <span className="benchmark-announcement-frame" key={highlight.id} aria-hidden="true">
      <span>{highlight.edition}</span>
      <strong>{highlight.headline}</strong>
      <span className="announcement-detail">{highlight.detail}</span>
    </span>
    <ArrowUpRight size={16} aria-hidden="true" />
  </a>;
}
