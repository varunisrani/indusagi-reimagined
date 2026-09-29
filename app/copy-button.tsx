'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyStatus = 'idle' | 'success' | 'error';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
    }
  }

  const message = status === 'success'
    ? 'Copied'
    : status === 'error'
      ? 'Copy failed — select command manually'
      : label;

  return (
    <button onClick={copy} className="copy-button" aria-label={`${label}: ${text}`}>
      {status === 'success' ? <Check size={16} /> : <Copy size={16} />}
      <span role="status" aria-live="polite">{message}</span>
    </button>
  );
}
