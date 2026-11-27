import { Link } from 'react-router';
import { Flag, Info } from '@phosphor-icons/react';
import type { AuthorProfile } from '../../data/types';
import { getInstitution } from '../../data';
import { fmt, plural } from '../../lib/format';
import { heldUpAnswer, integrityAnswerAuthor, openAnswer, replicatorAnswer, MIN_TESTED, type AuthorStats } from '../../lib/authorStats';
import type { Tone } from '../../lib/signals';
import { ToneIcon } from '../Tone';

const initials = (n: string) => n.split(' ').map(x => x[0]).slice(0, 2).join('');

/**
 * Coverage waffle: one square per paper. Grey squares are papers nobody has
 * tried to replicate, which is most of anyone's work. It is the honest
 * framing for every replication statistic about a person.
 */
function CoverageWaffle({ s }: { s: AuthorStats }) {
  const ordered = [...s.original].sort((a, b) => a.year - b.year);
  const label = `${s.original.length} papers. Replication evidence for ${s.tested.length}: ${s.outcomes.success} held up, ${s.outcomes.mixed} mixed, ${s.outcomes.failed} did not. ${s.original.length - s.tested.length} untested.`;
  return (
    <div className="waffle-wrap">
      <div className="waffle" role="img" aria-label={label}>
        {ordered.map((w, i) => (
          <i key={w.doi} className={`wf-${w.replication.status}`} style={{ animationDelay: `${Math.min(i * 6, 600)}ms` }} title={`${w.year} · ${w.title}`} />
        ))}
      </div>
      <ul className="waffle-legend" aria-hidden="true">
        <li><i className="wf-success" />Held up <b>{s.outcomes.success}</b></li>
        <li><i className="wf-mixed" />Mixed <b>{s.outcomes.mixed}</b></li>
        <li><i className="wf-failed" />Did not <b>{s.outcomes.failed}</b></li>
        <li><i className="wf-untested" />Untested <b>{s.original.length - s.tested.length}</b></li>
      </ul>
    </div>
  );
}

interface Tile { key: string; label: string; value: string; caption: string; tone: Tone; verdict: string; target: string; text: string; viz: React.ReactNode }

function Tiles({ s, profile }: { s: AuthorStats; profile: AuthorProfile }) {
  const held = heldUpAnswer(s), rep = replicatorAnswer(s), open = openAnswer(s), integ = integrityAnswerAuthor(s);
  const maxY = Math.max(1, ...s.perYear.map(y => y.first + y.middle + y.last));
  const maxC = Math.max(1, ...profile.citationsByYear.map(y => y.citations));
  const r = s.recentOpen;
  const tiles: Tile[] = [
    { key: 'output', label: 'Papers', value: fmt(s.works.length), caption: `since ${s.firstYear}`, tone: 'none', verdict: '', target: 'output', text: `${s.works.length} papers since ${s.firstYear}.`,
      viz: <span className="sv-spark" aria-hidden="true">{s.perYear.map(y => <i key={y.year} style={{ height: `${Math.max(6, ((y.first + y.middle + y.last) / maxY) * 100)}%` }} />)}</span> },
    { key: 'cites', label: 'Citations', value: fmt(s.citations), caption: `h-index ${s.hIndex} · i10 ${s.i10}`, tone: 'none', verdict: '', target: 'output', text: `${s.citations} citations; h-index ${s.hIndex}.`,
      viz: <span className="sv-spark cite" aria-hidden="true">{profile.citationsByYear.map(y => <i key={y.year} style={{ height: `${Math.max(6, (y.citations / maxC) * 100)}%` }} />)}</span> },
    { key: 'held', label: 'Held up?', value: s.tested.length ? `${s.outcomes.success}/${s.tested.length}` : '—',
      caption: `${Math.round(s.coverage * 100)}% of papers tested`, tone: held.tone, verdict: s.tested.length < MIN_TESTED ? 'Too few' : held.verdict, target: 'heldup', text: held.text,
      viz: <span className="sv-stack" aria-hidden="true">{s.tested.length ? (['success', 'mixed', 'failed'] as const).flatMap(o => Array.from({ length: s.outcomes[o] }, (_, i) => <i key={o + i} className={`o-${o}`} />)) : <i className="o-none" />}</span> },
    { key: 'rep', label: 'Replications run', value: String(s.replicationsRun.length), caption: 'of others\' work', tone: rep.tone, verdict: rep.tone === 'none' ? 'None' : 'Yes', target: 'replicator', text: rep.text,
      viz: <span className="sv-stack" aria-hidden="true">{s.replicationsRun.length ? s.replicationsRun.map(w => <i key={w.doi} className={`o-${w.replicates!.outcome === 'inconclusive' ? 'mixed' : w.replicates!.outcome}`} />) : <i className="o-none" />}</span> },
    { key: 'open', label: 'Open science', value: `${Math.round(((r.oa + r.prereg + r.data + r.code) / 4) * 100)}%`, caption: 'practice use, last 5 years', tone: open.tone, verdict: open.verdict, target: 'open', text: open.text,
      viz: <span className="sv-bars4" aria-hidden="true">{[r.oa, r.prereg, r.data, r.code].map((v, i) => <span key={i}><b style={{ width: `${v * 100}%` }} /></span>)}</span> },
    { key: 'integ', label: 'Integrity', value: String(s.notices.length), caption: s.notices.length ? s.notices.map(w => w.integrity === 'expression_of_concern' ? 'concern' : w.integrity).join(' · ') : 'notices on record', tone: integ.tone, verdict: integ.verdict, target: 'integrity', text: integ.text,
      viz: <span className="sv-dots" aria-hidden="true">{s.notices.length ? s.notices.map(w => <i key={w.doi} className={w.integrity === 'correction' ? 'warn' : 'bad'} />) : <i className="good" />}</span> },
  ];
  return (
    <ul className="signals" aria-label="Key signals">
      {tiles.map((t, i) => (
        <li key={t.key} style={{ animationDelay: `${150 + i * 70}ms` }}>
          <a href={`#${t.target}`} className={`signal t-${t.tone}`} title={t.text}>
            <span className="sg-head">
              <span className="sg-label">{t.label}</span>
              {t.verdict && <span className="sg-verdict"><ToneIcon tone={t.tone} size={14} />{t.verdict}</span>}
            </span>
            <span className="sg-value">{t.value}</span>
            {t.viz}
            <span className="sg-caption">{t.caption}</span>
            <span className="visually-hidden">{t.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AuthorHero({ profile, s }: { profile: AuthorProfile; s: AuthorStats }) {
  const a = profile.author;
  const current = profile.affiliations.find(x => x.to === null) ?? profile.affiliations[profile.affiliations.length - 1];
  const inst = getInstitution(current.institutionId);
  const report = `mailto:info@forrt.org?subject=${encodeURIComponent(`Lighthouse author record: ${a.name}`)}`;
  return (
    <section className="hero" aria-label="Author summary">
      <div className="hero-grid">
        <div className="hero-id author-id">
          <div className="author-title">
            <span className="avatar big" aria-hidden="true">{initials(a.name)}</span>
            <div>
              <span className="eyebrow">Author X-ray</span>
              <h1 className="hero-title">{a.name}</h1>
              <p className="hero-venue">{current.role} · {current.department}, <Link to={`/institution/${current.institutionId}`} className="author-link">{inst?.name}</Link> ({inst?.country})</p>
            </div>
          </div>
          <dl className="hero-facts">
            <div><dt>Active</dt><dd>{s.firstYear}–present</dd></div>
            <div><dt>Also published as</dt><dd>{profile.nameVariants.join(' · ')}</dd></div>
            <div><dt>ORCID</dt><dd>Not linked (sample data)</dd></div>
          </dl>
          <p className="hero-topics">{s.topics.slice(0, 5).map(t => <span key={t.name} className="chip">{t.name} <b>{t.n}</b></span>)}</p>
          <div className="fair-note" role="note">
            <Info size={18} weight="fill" aria-hidden="true" />
            <p><b>An X-ray describes the evidence, not the person.</b> There is no score for researchers and no ranking. Most papers by anyone have never been replicated, so every figure here shows how much of the work it covers.</p>
          </div>
          <a className="report-link" href={report}><Flag size={15} aria-hidden="true" />Report an error, or “this isn't me”</a>
        </div>

        <aside className="verdict-card" aria-labelledby="footprint-title">
          <div className="vc-head">
            <h2 id="footprint-title" className="eyebrow">Replication footprint</h2>
            <span className="vc-meta">{plural(s.original.length, 'original paper')}</span>
          </div>
          <CoverageWaffle s={s} />
          <p className="vc-pred">
            <b>{Math.round(s.coverage * 100)}%</b> of papers have replication evidence.
            {s.tested.length < MIN_TESTED ? ' Too few to judge how this work holds up.' : ''}
          </p>
          <a href="#heldup" className="vc-link">See every tested paper</a>
        </aside>
      </div>
      <Tiles s={s} profile={profile} />
    </section>
  );
}
