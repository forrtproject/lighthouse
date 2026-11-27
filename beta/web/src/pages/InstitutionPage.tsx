import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChartLineUp, Handshake, LockOpen, ShieldCheck, SquaresFour, Tag, Users } from '@phosphor-icons/react';
import { getInstitutionProfile, listInstitutionProfiles } from '../data';
import type { InstitutionProfile } from '../data/types';
import { institutionStats, instHeldUpAnswer, instOpenAnswer, orgAnswer } from '../lib/institutionStats';
import { fmt, plural } from '../lib/format';
import { Shell } from '../components/Shell';
import { SectionRail, type RailItem } from '../components/SectionRail';
import { SectionHeader } from '../components/SectionHeader';
import { InstitutionHero } from '../components/institution/InstitutionHero';
import {
  DepartmentTreemap, DeptHeldUp, DerivationPanel, InstOpenTrend, InstOutput, Partners, PeopleDirectory, TopicHeatmap,
} from '../components/institution/InstitutionSections';

export default function InstitutionPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'missing'; profile?: InstitutionProfile }>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    getInstitutionProfile(id).then(p => { if (live) setState(p ? { status: 'ready', profile: p } : { status: 'missing' }); });
    return () => { live = false; };
  }, [id]);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (state.status === 'loading') return <Shell><div className="page"><div className="skeleton" style={{ height: 380 }} /></div></Shell>;
  if (state.status === 'missing') return <Shell><div className="page narrow"><section className="card empty-state"><h1>No institution with that id in the sample data</h1><Link to="/institutions">See all institutions</Link></section></div></Shell>;
  return <Shell><InstitutionView profile={state.profile!} /></Shell>;
}

function InstitutionView({ profile }: { profile: InstitutionProfile }) {
  // The department scope lives in the URL (?dept=psychology), so a department view can be shared.
  const [params, setParams] = useSearchParams();
  const dept = params.get('dept');
  const setDept = useCallback((d: string | null) => {
    const next = new URLSearchParams(params);
    if (d) next.set('dept', d); else next.delete('dept');
    setParams(next);
  }, [params, setParams]);
  const [topic, setTopic] = useState<string | null>(null);

  const s = useMemo(() => institutionStats(profile, dept), [profile, dept]);
  useEffect(() => { document.title = `${dept ? `${s.scopeName}, ` : ''}${profile.institution.name} · Lighthouse Beta`; }, [s, dept, profile]);

  const onCell = useCallback((d: string, t: string) => {
    setDept(d); setTopic(t);
    requestAnimationFrame(() => document.getElementById('people')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [setDept]);

  const held = instHeldUpAnswer(s), open = instOpenAnswer(s), org = orgAnswer(s);
  const topTopics = s.topics.slice(0, 3).map(t => t.name.toLowerCase()).join(', ');
  const rail: RailItem[] = [
    { id: 'organisation', label: 'Departments', icon: SquaresFour, count: s.departments.filter(d => d.slug !== 'unassigned').length },
    { id: 'topics', label: 'Who works on what', icon: Tag },
    { id: 'people', label: 'Researchers', icon: Users, count: s.scope.length },
    { id: 'heldup', label: 'Held up?', icon: ShieldCheck, tone: held.tone },
    { id: 'open', label: 'Open science', icon: LockOpen, tone: open.tone },
    { id: 'output', label: 'Output', icon: ChartLineUp, count: s.papers },
    { id: 'partners', label: 'Partners', icon: Handshake, count: profile.partners.length },
  ];

  return (
    <div className="page paper-page">
      <InstitutionHero profile={profile} s={s} dept={dept} setDept={setDept} />
      <div className="paper-layout">
        <SectionRail items={rail} />
        <div className="sections">
          <SectionHeader id="organisation" question="How is it organised?" answer={org} />
          <div className="bento">
            <DepartmentTreemap s={s} dept={dept} setDept={setDept} />
            <DerivationPanel s={s} />
          </div>

          <SectionHeader id="topics" question={`Who works on what${dept ? ` in ${s.scopeName}` : ''}?`}
            answer={{ tone: 'none', verdict: plural(s.topics.length, 'topic'), text: `Most researchers work on ${topTopics}. Select a cell to list the people.` }} />
          <TopicHeatmap s={s} onCell={onCell} />

          <SectionHeader id="people" question="Who works here?"
            answer={{ tone: 'none', verdict: plural(s.scope.length, 'researcher'), text: `${dept ? s.scopeName : 'Across all departments'}, listed alphabetically.` }} />
          <PeopleDirectory s={s} topic={topic} setTopic={setTopic} dept={dept} />

          <SectionHeader id="heldup" question="How does its research hold up?" answer={held} />
          <DeptHeldUp s={s} dept={dept} />

          <SectionHeader id="open" question="How open is its research?" answer={open} />
          <InstOpenTrend s={s} />

          <SectionHeader id="output" question="How much does it publish?"
            answer={{ tone: 'none', verdict: `${fmt(s.papers)} papers`, text: `${fmt(s.citations)} citations, from ${plural(s.scope.length, 'researcher')}.` }} />
          <InstOutput s={s} />

          <SectionHeader id="partners" question="Who does it work with?"
            answer={{ tone: 'none', verdict: plural(profile.partners.length, 'partner'), text: `Most co-authored papers with ${profile.partners[0]?.name}.` }} />
          <Partners profile={profile} />
        </div>
      </div>
    </div>
  );
}

/** Index of institutions in the sample data, alphabetical. */
export function InstitutionsIndex() {
  const [list, setList] = useState<InstitutionProfile[]>([]);
  useEffect(() => { listInstitutionProfiles().then(ps => setList([...ps].sort((a, b) => a.institution.name.localeCompare(b.institution.name)))); document.title = 'Institutions · Lighthouse Beta'; }, []);
  return (
    <Shell>
      <div className="page">
        <div className="section-head">
          <span className="eyebrow">Institutions</span>
          <h1 className="hero-title">Institutions and departments</h1>
          <p className="card-summary">Departments are derived from the affiliation text on papers. Select a department to open the institution page scoped to it.</p>
        </div>
        <ul className="inst-grid">
          {list.map((p, i) => {
            const s = institutionStats(p, null);
            return (
              <li key={p.institution.id} className="card inst-card" style={{ animationDelay: `${i * 60}ms` }}>
                <Link to={`/institution/${p.institution.id}`} className="ic-name">{p.institution.name}</Link>
                <span className="ic-meta">{p.type} · {p.city}, {p.institution.country} · {plural(s.all.length, 'researcher')} · {fmt(s.papers)} papers</span>
                <span className="ic-depts">
                  {s.departments.filter(d => d.slug !== 'unassigned').map(d => (
                    <Link key={d.slug} to={`/institution/${p.institution.id}?dept=${d.slug}`} className="mini-chip">{d.name} <b>{d.researchers}</b></Link>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}
