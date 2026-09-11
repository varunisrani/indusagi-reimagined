import { ArrowUpRight, Check } from 'lucide-react';
import { SiteLink } from './site-link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const leaderboardUrl = 'https://www.tbench.ai/?version=2.1';
// Read from the official Terminal-Bench 2.1 table on 11 September 2026.
const references = [
  { agent: 'Codex', model: 'GPT-6 Astra', effort: 'high', rate: '87.4', interval: '1.8' },
  { agent: 'Claude Code', model: 'Fable 5', effort: 'xhigh', rate: '83.8', interval: '2.3' },
  { agent: 'Codex', model: 'GPT-5.5', effort: 'xhigh', rate: '83.2', interval: '2.2' },
  { agent: 'Terminus 2', model: 'Fable 5', effort: 'high', rate: '80.5', interval: '2.3' },
];

const campaigns = [
  { edition: 'TypeScript', agent: 'indusagi', model: 'openai-codex/gpt-6-astra', passed: 386, accuracy: '86.74', passAtFive: '91.01', tasks: 81, errors: 28, cost: '$887.76', finished: 'September 8, 2026', date: '2026-09-08', job: 'https://hub.harborframework.com/jobs/f32f1c4f-3c58-4701-bc29-c286f5b2f8dd' },
  { edition: 'Python', agent: 'induscode-python', model: 'openai-codex/gpt-6-astra', passed: 386, accuracy: '86.74', passAtFive: '89.89', tasks: 80, errors: 26, cost: '$639.39', finished: 'September 9, 2026', date: '2026-09-09', job: 'https://hub.harborframework.com/jobs/9a8dc035-4ca6-49fc-a829-843afd88e0ef', scored: '88.74% across 435 scored trials' },
  { edition: 'Rust', agent: 'induscode-rust', model: 'openai-codex/gpt-5.6-sol', passed: 325, accuracy: '73.03', passAtFive: '91.01', tasks: 81, errors: 72, cost: '$799.43', finished: 'August 31, 2026', date: '2026-08-31', job: 'https://hub.harborframework.com/jobs/e08f1b91-555c-40a1-b280-5784064e231c' },
];

export function Benchmarks() {
  return <section className="benchmarks-section wrap" id="benchmarks" aria-labelledby="benchmarks-title">
    <div className="benchmark-heading"><div><span className="section-number">Terminal-Bench 2.1</span><h2 id="benchmarks-title">445 trials.<br /><span className="muted">Every result counts.</span></h2></div><p>In IndusAGI’s reported campaigns, TypeScript and Python each passed <strong>386 of 445 trials</strong> — <strong>86.74% strict accuracy</strong>, with errored trials counted as unsuccessful.</p></div>
    <div className="benchmark-source-line"><span>IndusAGI-reported campaigns</span><span>Complete runs · source jobs linked below</span></div>
    <div className="benchmark-grid">{campaigns.map(c => <article className="benchmark-card" key={c.edition}>
      <div className="benchmark-card-top"><h3>{c.edition}</h3><span><Check size={12} />445/445 complete</span></div>
      <div className="benchmark-score">{c.accuracy}<span>%</span></div>
      <p className="benchmark-score-label">Strict accuracy · all 445 trials</p>
      <div className="benchmark-passed"><strong>{c.passed}</strong> passed / 445</div>
      <dl className="benchmark-metrics"><div><dt>Pass@5</dt><dd>{c.passAtFive}%<small>{c.tasks}/89 tasks solved</small></dd></div><div><dt>Errors</dt><dd>{c.errors}</dd></div><div><dt>Campaign cost</dt><dd>{c.cost}</dd></div></dl>
      <dl className="benchmark-config"><div><dt>Agent</dt><dd>{c.agent}</dd></div><div><dt>Model</dt><dd>{c.model}</dd></div><div><dt>Reasoning</dt><dd>xhigh</dd></div><div><dt>Finished</dt><dd><time dateTime={c.date}>{c.finished}</time></dd></div></dl>
      {c.scored && <p className="benchmark-scored">Scored-trial accuracy: {c.scored}. The headline includes all 445 trials.</p>}
      <SiteLink href={c.job} className="benchmark-job" target="_blank" rel="noreferrer">Open {c.edition} Harbor job <ArrowUpRight size={16} /></SiteLink>
    </article>)}</div>
    <div className="benchmark-method"><p><strong>How to read these results.</strong> Strict accuracy uses all 445 trials, including errored trials as unsuccessful. Pass@5 reports tasks solved out of 89. Models differ between campaigns: TypeScript and Python used GPT-6 Astra; Rust used GPT-5.6 Sol. All used xhigh reasoning.</p><p>The newer Rust GPT-6 Astra campaign is excluded because it stopped after 87/445 attempts and was not a fully completed run.</p></div>
    <div className="benchmark-reference">
      <div className="benchmark-reference-heading"><div><span className="section-number">From the official leaderboard</span><h3>Terminal-Bench 2.1 reference results</h3></div><SiteLink href={leaderboardUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={16} /></SiteLink></div>
      <Table className="benchmark-reference-table"><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Model</TableHead><TableHead>Reasoning</TableHead><TableHead className="reference-rate">Resolution rate</TableHead></TableRow></TableHeader><TableBody>{references.map(row => <TableRow key={row.agent + row.model}><TableCell>{row.agent}</TableCell><TableCell>{row.model}</TableCell><TableCell>{row.effort}</TableCell><TableCell className="reference-rate"><strong>{row.rate}%</strong><span> ± {row.interval}%</span></TableCell></TableRow>)}</TableBody></Table>
      <p className="benchmark-reference-note">Source: Terminal-Bench 2.1, checked <time dateTime="2026-09-11">11 September 2026</time>. The ± values show 95% confidence intervals. These are selected official entries, separate from the IndusAGI-reported campaigns above. IndusAGI was not listed in the official table checked; no official rank is claimed. Scoring and run configurations may differ.</p>
    </div>
  </section>;
}
