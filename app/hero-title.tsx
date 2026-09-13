'use client';

import { useEffect, useState } from 'react';

const phrase = 'AI agent stack.';

export function HeroTitle() {
  const [title, setTitle] = useState(phrase);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 1024px)');
    let timer: ReturnType<typeof setTimeout>;
    let length = phrase.length;
    let deleting = true;
    const tick = () => {
      if (document.hidden) { timer = setTimeout(tick, 500); return; }
      length += deleting ? -1 : 1;
      setTitle(phrase.slice(0, length));
      let delay = deleting ? 45 : 110;
      if (length === 0) { deleting = false; delay = 450; }
      if (length === phrase.length) return;
      timer = setTimeout(tick, delay);
    };
    const reset = () => {
      clearTimeout(timer);
      length = phrase.length;
      deleting = true;
      setTitle(phrase);
      if (!preference.matches) timer = setTimeout(tick, 150);
    };
    reset();
    preference.addEventListener('change', reset);
    return () => { clearTimeout(timer); preference.removeEventListener('change', reset); };
  }, []);

  return <h1 className="hero-title" aria-label="The open-source AI agent stack.">
    <span aria-hidden="true">The open-source<br />
      <span className="hero-type-line"><span className="hero-type-spacer">{phrase}</span><em className="hero-type-text">{title}<span className="hero-type-cursor" /></em></span>
    </span>
  </h1>;
}
