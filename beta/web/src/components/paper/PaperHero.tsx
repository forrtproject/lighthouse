import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowDown, Check, Copy, EnvelopeSimple, Prohibit, ShieldCheck, ShieldWarning, Warning } from '@phosphor-icons/react';
import type { Paper } from '../../data/types';
import { getAuthor, getInstitution } from '../../data';
import { effectText, fmt, formatDate, pct } from '../../lib/format';
import type { DimensionKey, TrustResult } from '../../lib/trust';
import { keySignals, type Signal } from '../../lib/signals';
import { DimensionList, TrustGauge } from './TrustPanel';
import { ToneIcon } from '../Tone';

function CopyDoi({ doi }: { doi: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="copy-btn" onClick={() => { navigator.clipboard?.writeText(doi); setDone(true); setTimeout(() => setDone(false), 1500); }}
      aria-label={done ? 'DOI copied' : 'Copy DOI'}>
      {done ? <Check size={14} weight="bold" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{done ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** Mini visual for each key signal; the number and verdict carry the meaning, this adds shape. */
function SignalViz({ s, paper }: { s: Signal; paper: Paper }) {
  switch (s.key) {
    case 'replication': {
      const order = ['success', 'mixed', 'inconclusive', 'failed'] as const;
      return (
        <span className="sv-stack" aria-hidden="true">
          {paper.replications.length ? order.flatMap(o => paper.replications.filter(r => r.outcome === o).map(r => <i key={r.id} className={`o-${o}`} />))
            : <i className="o-none" />}
        </span>
      );
    }
    case 'effect': {
      const pooled = paper.replications.length ? Number(s.value.replace('%', '')) : 0;
      return (
        <span className="sv-compare" aria-hidden="true">
          <span><b style={{ width: '100%' }} className="orig" /></span>
          <span><b style={{ width: `${Math.min(100, pooled)}%` }} className="rep" /></span>
        </span>
      );
    }
    case 'integrity': {
      const I = s.tone === 'good' ? ShieldCheck : s.tone === 'warn' ? ShieldWarning : Prohibit;
      return <I size={26} weight="duotone" className={`sv-icon t-${s.tone}`} aria-hidden="true" />;
    }
    case 'statistics':
      return <span className="sv-dots" aria-hidden="true">{paper.statChecks.map((c, i) => <i key={i} className={c.decisionError ? 'bad' : Math.abs(c.reportedP - c.recomputedP) / c.recomputedP > 0.25 && Math.abs(c.reportedP - c.recomputedP) > 0.005 ? 'warn' : 'good'} />)}</span>;
    case 'transparency':
      return <span className="sv-pips" aria-hidden="true">{paper.practices.map(p => <i key={p.key} className={`s-${p.status}`} />)}</span>;
    case 'pubpeer': {
      const cs = paper.pubpeer.comments.filter(c => !c.isAuthorResponse);
      const max = Math.max(1, cs.length);
      const pos = cs.filter(c => c.sentiment === 'positive').length, crit = cs.filter(c => c.sentiment === 'critical').length;
      return (
        <span className="sv-diverge" aria-hidden="true">
          <span className="neg"><b style={{ width: `${(crit / max) * 100}%` }} /></span>
          <span className="pos"><b style={{ width: `${(pos / max) * 100}%` }} /></span>
        </span>
      );
    }
  }
}

function KeySignals({ paper }: { paper: Paper }) {
  const signals = keySignals(paper);
  return (
    <ul className="signals" aria-label="Key signals">
      {signals.map((s, i) => (
        <li key={s.key} style={{ animationDelay: `${150 + i * 70}ms` }}>
          <a href={`#${s.target}`} className={`signal t-${s.tone}`} title={s.text}>
            <span className="sg-head">
              <span className="sg-label">{s.label}</span>
              <span className="sg-verdict"><ToneIcon tone={s.tone} size={14} />{s.verdict}</span>
            </span>
            <span className="sg-value">{s.value}</span>
            <SignalViz s={s} paper={paper} />
            <span className="sg-caption">{s.caption}</span>
            <span className="visually-hidden">{s.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Above the fold: identity on the left, the verdict on the right, key signals below. */
export function PaperHero({ paper, trust, onPick }: { paper: Paper; trust: TrustResult; onPick: (k: DimensionKey) => void }) {
  const retraction = paper.integrity.find(e => e.kind === 'retraction');
  const eoc = paper.integrity.find(e => e.kind === 'expression_of_concern');
  const insts = [...new Set(paper.authors.map(a => getAuthor(a.authorId)?.institutionId).filter(Boolean) as string[])];
  const oa = paper.practices.find(p => p.key === 'open_access')?.status === 'yes';

  return (
    <section className="hero" aria-label="Paper summary">
      {retraction && (
        <div className="alert alert-bad" role="alert">
          <Prohibit size={22} weight="bold" aria-hidden="true" />
          <p><b>Retracted on {formatDate(retraction.date)}.</b> {retraction.reason}
            {retraction.noticeDoi && <> Notice <span className="mono">{retraction.noticeDoi}</span>.</>}</p>
        </div>
      )}
      {!retraction && eoc && (
        <div className="alert alert-warn" role="status">
          <Warning size={22} weight="bold" aria-hidden="true" />
          <p><b>Expression of concern, {formatDate(eoc.date)}.</b> {eoc.reason}</p>
        </div>
      )}

      <div className="hero-grid">
        <div className="hero-id">
          <div className="hero-tags">
            <span className="eyebrow">{paper.type.replace('-', ' ')} · {paper.year}</span>
            {oa && <span className="tag tag-good">Open access</span>}
            {paper.lighthouseEffect && <span className="tag tag-brand" title={`${paper.lighthouseEffect.discipline} · ${paper.lighthouseEffect.cluster}`}>Lighthouse: {paper.lighthouseEffect.name}</span>}
          </div>
          <h1 className="hero-title">{paper.title}</h1>
          <p className="hero-authors">
            {paper.authors.map((a, i) => {
              const au = getAuthor(a.authorId); if (!au) return null;
              return (
                <span key={a.authorId}>
                  <Link to={`/author/${au.id}`} className="author-link" title="Open the author X-ray">{au.name}</Link>
                  <sup>{insts.indexOf(au.institutionId) + 1}</sup>
                  {a.corresponding && <EnvelopeSimple size={13} className="corr" aria-label="corresponding author" role="img" />}
                  {i < paper.authors.length - 1 && <span aria-hidden="true">, </span>}
                </span>
              );
            })}
          </p>
          <p className="hero-insts">{insts.map((id, i) => { const inst = getInstitution(id)!; return <span key={id}><sup>{i + 1}</sup><Link to={`/institution/${id}`} className="inst-link">{inst.name}</Link>, {inst.country}</span>; })}</p>
          <p className="hero-venue">
            <i>{paper.venue.name}</i> · {formatDate(paper.published)}
            <span className="doi-line"><a className="mono" href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener">doi:{paper.doi}</a><CopyDoi doi={paper.doi} /></span>
          </p>

          <blockquote className="hero-claim">
            <span className="eyebrow">Central claim</span>
            <p>{paper.claim}</p>
          </blockquote>

          <dl className="hero-facts">
            <div><dt>Design</dt><dd>{paper.design.kind}</dd></div>
            <div><dt>Sample</dt><dd>N = {fmt(paper.design.n)} · {paper.design.population.toLowerCase()}</dd></div>
            <div><dt>Original effect</dt><dd className="mono">{effectText(paper.originalEffect)}</dd></div>
          </dl>
          <details className="hero-abstract"><summary>Abstract, topics and funding</summary>
            <p>{paper.abstract}</p>
            <p className="hero-topics">{paper.topics.map(t => <span key={t} className="chip">{t}</span>)}</p>
            <p className="fineprint">Funding: {paper.funding.join('; ')}</p>
          </details>
        </div>

        <aside className="verdict-card" aria-labelledby="verdict-title">
          <div className="vc-head">
            <h2 id="verdict-title" className="eyebrow">Trust score</h2>
            <span className="vc-meta">{trust.confidence} confidence · {pct(trust.coverage)} coverage</span>
          </div>
          <TrustGauge trust={trust} />
          <DimensionList trust={trust} onPick={onPick} />
          <a href="#score" className="vc-link">How the score is built <ArrowDown size={14} aria-hidden="true" /></a>
          {paper.predictedReplicability && (
            <p className="vc-pred">Predicted replicability <b>{pct(paper.predictedReplicability.value)}</b> <span>({paper.predictedReplicability.method}; not in the score)</span></p>
          )}
        </aside>
      </div>

      <KeySignals paper={paper} />
    </section>
  );
}
