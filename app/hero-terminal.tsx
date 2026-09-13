'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, FileCode2, FolderSearch, Terminal, Pause, Play, CornerDownLeft, LoaderCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteLink } from './site-link';

const steps = [
  { id: 'inspect', label: 'Inspect', icon: FolderSearch, command: 'cat src/validate.ts', status: 'Reading project files' },
  { id: 'edit', label: 'Edit', icon: FileCode2, command: 'apply_patch < validation.patch', status: 'Applying validation patch' },
  { id: 'verify', label: 'Verify', icon: Check, command: 'npm test -- validate', status: 'Running focused tests' },
] as const;
const duration = 8000;
const runAt = 2300;
const outputAt = 3300;

export function HeroTerminal() {
  const [stage, setStage] = useState({ index: 0, elapsed: 0 });
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = setInterval(() => {
      if (!document.hidden) setStage(current => current.elapsed + 50 >= duration
        ? { index: (current.index + 1) % steps.length, elapsed: 0 }
        : { ...current, elapsed: current.elapsed + 50 });
    }, 50);
    return () => clearInterval(timer);
  }, [playing, reducedMotion]);
  const step = steps[stage.index];
  const elapsed = reducedMotion ? duration : stage.elapsed;
  const command = step.command.slice(0, Math.max(0, Math.floor((elapsed - 250) / 55)));
  const running = elapsed >= runAt && elapsed < outputAt + 1800;
  const visible = (line: number) => elapsed >= outputAt + line * 430 ? 'terminal-line-ready' : 'terminal-line-pending';
  const selectStep = (value: string) => {
    setStage({ index: steps.findIndex(item => item.id === value), elapsed: 0 });
    setPlaying(true);
  };
  return <div className="hero-terminal">
    <div className="terminal-caption"><span><Terminal size={16} /> INDUSCODE</span><span>Example session</span></div>
    <div className="terminal-window">
      <div className="terminal-titlebar"><span className="terminal-window-mark" aria-hidden="true">⌘</span><span>workspace / api</span><span className="terminal-branch">main</span></div>
      <div className="terminal-request"><span className="terminal-prompt" aria-hidden="true">›</span><p>Add input validation.<br /><span>Cover the empty-name case with a test.</span></p></div>
      <Tabs value={step.id} onValueChange={selectStep} className={`terminal-workflow${playing && !reducedMotion ? ' is-running' : ''}`}>
        <TabsList aria-label="Run a step of the example agent workflow" className="terminal-step-tabs">
          {steps.map(({ id, label, icon: Icon }, index) => <TabsTrigger key={id} value={id}><span className="terminal-step-number">0{index + 1}</span><Icon size={15} />{label}</TabsTrigger>)}
        </TabsList>
        <div className="terminal-command-row">
          <code aria-label={step.command}><span aria-hidden="true"><b>$</b> {command}<span className={`terminal-command-cursor${elapsed >= runAt ? ' is-hidden' : ''}`} /></span></code>
          <button type="button" className={`terminal-run${elapsed >= runAt && elapsed < runAt + 450 ? ' is-pressed' : ''}`} onClick={() => { setStage(current => ({ ...current, elapsed: current.elapsed < runAt ? runAt : 0 })); setPlaying(true); }} aria-label={elapsed < runAt ? 'Run example command' : 'Replay example command'}><CornerDownLeft size={13} />{elapsed < runAt ? 'Run' : 'Replay'}</button>
        </div>
        <div className="terminal-execution-status" aria-hidden="true">{elapsed < runAt ? <><Terminal size={13} /> Typing command</> : running ? <><LoaderCircle size={13} className="terminal-spinner" />{step.status}…</> : <><Check size={13} />Command completed</>}</div>
        <TabsContent value="inspect" className="terminal-output">
          <div className="terminal-file"><FolderSearch size={14} /><span>Read the project context</span></div>
          <div className="terminal-inspect">{['src/validate.ts', 'tests/validate.test.ts', 'package.json'].map((file, index) => <code className={visible(index)} key={file}><span>read</span> {file}</code>)}</div>
          <p className={`terminal-note ${visible(3)}`}>The validator accepts an empty string. Add a guard and a regression test.</p>
        </TabsContent>
        <TabsContent value="edit" className="terminal-output">
          <div className="terminal-file"><FileCode2 size={14} /><span>src/validate.ts</span><span className={`terminal-diff-count ${visible(3)}`}>+3</span></div>
          <pre className="terminal-diff"><code><span><i>1</i>{' export function validate(name: string) {'}</span><span className={`added ${visible(0)}`}><i>2</i>{'+  if (!name.trim()) {'}</span><span className={`added ${visible(1)}`}><i>3</i>{'+    throw new Error("Name is required");'}</span><span className={`added ${visible(2)}`}><i>4</i>{'+  }'}</span><span><i>5</i>{'   return name.trim();'}</span><span><i>6</i>{' }'}</span></code></pre>
        </TabsContent>
        <TabsContent value="verify" className="terminal-output">
          <div className="terminal-file"><Terminal size={14} /><span>Run the focused tests</span></div>
          <div className="terminal-test-output">{['Accepts a valid name', 'Rejects an empty name', 'Rejects whitespace-only input'].map((test, index) => <p className={visible(index)} key={test}><Check size={14} /> {test}</p>)}<strong className={visible(3)}>3 tests passed</strong></div>
        </TabsContent>
      </Tabs>
      <div className="terminal-statusbar"><span>Files · Tools · Context</span>{!reducedMotion && <button type="button" className="terminal-playback" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Pause example animation' : 'Play example animation'}>{playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause demo' : 'Play demo'}</button>}</div>
    </div>
    <div className="terminal-underneath"><p>From a prompt to a patch.<br /><span>Every step stays in view.</span></p><SiteLink href="/cli" aria-label="Explore IndusCode"><ArrowUpRight size={24} /></SiteLink></div>
  </div>;
}
