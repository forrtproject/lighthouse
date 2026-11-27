import { Buildings, Info, X } from '@phosphor-icons/react';
import type { InstitutionProfile } from '../../data/types';
import type { InstitutionStats } from '../../lib/institutionStats';
import { instHeldUpAnswer, instOpenAnswer } from '../../lib/institutionStats';
import { fmt } from '../../lib/format';
import type { Tone } from '../../lib/signals';
import { ToneIcon } from '../Tone';

const COUNTRY: Record<string, string> = { GB: 'United Kingdom', DE: 'Germany', US: 'United States', NL: 'Netherlands', JP: 'Japan', BR: 'Brazil', AT: 'Austria' };

interface Props {
  profile: InstitutionProfile;
  s: InstitutionStats;
  dept: string | null;
  setDept: (slug: string | null) => void;
}

export function InstitutionHero({ profile, s, dept, setDept }: Props) {
  const inst = profile.institution;
  const held = instHeldUpAnswer(s), open = instOpenAnswer(s);
  const cov = s.papers ? s.tested / s.papers : 0;
  const r = s.recentOpen;
  const tiles: { key: string; label: string; value: string; caption: string; tone: Tone; verdict: string; target: string; text: string }[] = [
    { key: 'people', label: 'Researchers', value: fmt(s.scope.length), caption: dept ? 'in this department' : 'listed alphabetically', tone: 'none', verdict: '', target: 'people', text: `${s.scope.length} researchers.` },
    { key: 'papers', label: 'Papers', value: fmt(s.papers), caption: `${fmt(s.citations)} citations`, tone: 'none', verdict: '', target: 'output', text: `${s.papers} papers.` },
    { key: 'cov', label: 'Tested', value: `${Math.round(cov * 100)}%`, caption: `${fmt(s.tested)} papers with replication evidence`, tone: 'none', verdict: '', target: 'heldup', text: `${s.tested} of ${s.papers} papers tested.` },
    { key: 'held', label: 'Held up?', value: s.tested ? `${s.outcomes.success}/${s.tested}` : '—', caption: 'tested papers that held up', tone: held.tone, verdict: held.verdict === 'Too few tested' ? 'Too few' : held.verdict, target: 'heldup', text: held.text },
    { key: 'rep', label: 'Replications run', value: fmt(s.replicationsRun), caption: 'checks of others\' work', tone: s.replicationsRun ? 'good' : 'none', verdict: '', target: 'heldup', text: `${s.replicationsRun} replications of others' work.` },
    { key: 'open', label: 'Open science', value: `${Math.round(((r.oa + r.prereg + r.data + r.code) / 4) * 100)}%`, caption: 'practice use, last 5 years', tone: open.tone, verdict: open.verdict, target: 'open', text: open.text },
  ];

  return (
    <section className="hero" aria-label="Institution summary">
      <div className="hero-grid">
        <div className="hero-id">
          <div className="author-title">
            <span className="avatar big inst" aria-hidden="true"><Buildings size={34} weight="duotone" /></span>
            <div>
              <span className="eyebrow">{profile.type} · {profile.city}, {COUNTRY[inst.country] ?? inst.country}</span>
              <h1 className="hero-title">{inst.name}</h1>
              {dept && <p className="hero-venue">Showing <b>{s.scopeName}</b> only</p>}
            </div>
          </div>
          <div className="scope-row" role="group" aria-label="Show the whole institution or one department">
            <button type="button" className="filter-chip" aria-pressed={!dept} onClick={() => setDept(null)}>Whole institution<span>{s.all.length}</span></button>
            {s.departments.map(d => (
              <button key={d.slug} type="button" className={`filter-chip${d.slug === 'unassigned' ? ' is-muted' : ''}`} aria-pressed={dept === d.slug} onClick={() => setDept(dept === d.slug ? null : d.slug)}>
                {d.name}<span>{d.researchers}</span>
                {dept === d.slug && <X size={12} weight="bold" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="fair-note" role="note">
            <Info size={18} weight="fill" aria-hidden="true" />
            <p><b>Departments are derived.</b> Bibliographic records do not store departments, so Lighthouse reads them from the affiliation text on each paper. Every derivation is shown under “How is it organised?”.</p>
          </div>
        </div>

        <aside className="verdict-card" aria-labelledby="inst-foot-title">
          <div className="vc-head">
            <h2 id="inst-foot-title" className="eyebrow">Replication footprint</h2>
            <span className="vc-meta">{dept ? s.scopeName : 'whole institution'}</span>
          </div>
          <div className="cov-bar" role="img" aria-label={`${fmt(s.tested)} of ${fmt(s.papers)} papers have replication evidence: ${s.outcomes.success} held up, ${s.outcomes.mixed} mixed, ${s.outcomes.failed} did not.`}>
            <span className="cb-seg cb-success" style={{ flexGrow: s.outcomes.success }} />
            <span className="cb-seg cb-mixed" style={{ flexGrow: s.outcomes.mixed }} />
            <span className="cb-seg cb-failed" style={{ flexGrow: s.outcomes.failed }} />
            <span className="cb-seg cb-untested" style={{ flexGrow: Math.max(0, s.papers - s.tested) }} />
          </div>
          <ul className="waffle-legend" aria-hidden="true">
            <li><i className="wf-success" />Held up <b>{s.outcomes.success}</b></li>
            <li><i className="wf-mixed" />Mixed <b>{s.outcomes.mixed}</b></li>
            <li><i className="wf-failed" />Did not <b>{s.outcomes.failed}</b></li>
            <li><i className="wf-untested" />Untested <b>{fmt(Math.max(0, s.papers - s.tested))}</b></li>
          </ul>
          <p className="vc-pred"><b>{Math.round(cov * 100)}%</b> of {fmt(s.papers)} papers have replication evidence. {held.tone === 'none' ? 'Too few to judge.' : ''}</p>
          <div className="zoom-bar" aria-hidden="true">
            <span>Tested papers only</span>
            <div className="cov-bar thin">
              <span className="cb-seg cb-success" style={{ flexGrow: s.outcomes.success }} />
              <span className="cb-seg cb-mixed" style={{ flexGrow: s.outcomes.mixed }} />
              <span className="cb-seg cb-failed" style={{ flexGrow: s.outcomes.failed }} />
            </div>
          </div>
          <a href="#heldup" className="vc-link">By department</a>
        </aside>
      </div>

      <ul className="signals" aria-label="Key signals">
        {tiles.map((t, i) => (
          <li key={t.key} style={{ animationDelay: `${150 + i * 70}ms` }}>
            <a href={`#${t.target}`} className={`signal t-${t.tone}`} title={t.text}>
              <span className="sg-head">
                <span className="sg-label">{t.label}</span>
                {t.verdict && <span className="sg-verdict"><ToneIcon tone={t.tone} size={14} />{t.verdict}</span>}
              </span>
              <span className="sg-value">{t.value}</span>
              <span className="sg-caption">{t.caption}</span>
              <span className="visually-hidden">{t.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
