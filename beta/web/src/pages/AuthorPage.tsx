import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Books, ChartLineUp, Files, Graph, LockOpen, Repeat, ShieldCheck } from '@phosphor-icons/react';
import { getAuthorProfile, listAuthors } from '../data';
import type { Author, AuthorProfile } from '../data/types';
import {
  authorStats, heldUpAnswer, integrityAnswerAuthor, openAnswer, outputAnswer, replicatorAnswer,
} from '../lib/authorStats';
import { plural } from '../lib/format';
import { Shell } from '../components/Shell';
import { SectionRail, type RailItem } from '../components/SectionRail';
import { SectionHeader } from '../components/SectionHeader';
import { AuthorHero } from '../components/author/AuthorHero';
import { OutputSection } from '../components/author/OutputSection';
import { HeldUpSection } from '../components/author/HeldUpSection';
import { IntegritySection, OpenSection, ReplicatorSection } from '../components/author/PracticeSections';
import { NetworkSection } from '../components/author/NetworkSection';
import { PapersList } from '../components/author/PapersList';

export default function AuthorPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'missing'; profile?: AuthorProfile }>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    getAuthorProfile(id).then(p => { if (live) setState(p ? { status: 'ready', profile: p } : { status: 'missing' }); });
    return () => { live = false; };
  }, [id]);
  useEffect(() => {
    document.title = state.profile ? `${state.profile.author.name} · Author X-ray · Lighthouse Beta` : 'Lighthouse Beta';
    window.scrollTo(0, 0);
  }, [state.profile]);

  if (state.status === 'loading') return <Shell><div className="page"><div className="skeleton" style={{ height: 380 }} /><div className="skeleton" style={{ height: 160 }} /></div></Shell>;
  if (state.status === 'missing') return <Shell><MissingAuthor id={id} /></Shell>;
  return <Shell><XRay profile={state.profile!} /></Shell>;
}

function XRay({ profile }: { profile: AuthorProfile }) {
  const s = useMemo(() => authorStats(profile), [profile]);
  const answers = useMemo(() => ({
    output: outputAnswer(s), held: heldUpAnswer(s), rep: replicatorAnswer(s), open: openAnswer(s), integ: integrityAnswerAuthor(s),
  }), [s]);
  const [selected, setSelected] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  // Selecting a paper anywhere shows it in the "held up" section.
  const select = useCallback((doi: string | null) => {
    setSelected(doi);
    if (doi) requestAnimationFrame(() => document.getElementById('heldup')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);
  const pickTopic = useCallback((t: string | null) => {
    setTopic(t);
    if (t) requestAnimationFrame(() => document.getElementById('papers')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  const rail: RailItem[] = useMemo(() => [
    { id: 'output', label: 'Output', icon: ChartLineUp, count: s.works.length },
    { id: 'heldup', label: 'Held up?', icon: ShieldCheck, tone: answers.held.tone, count: s.tested.length },
    { id: 'replicator', label: 'Checks others', icon: Repeat, tone: answers.rep.tone, count: s.replicationsRun.length },
    { id: 'open', label: 'Open science', icon: LockOpen, tone: answers.open.tone },
    { id: 'integrity', label: 'Integrity', icon: Files, tone: answers.integ.tone, count: s.notices.length },
    { id: 'network', label: 'Network', icon: Graph, count: profile.coauthors.length },
    { id: 'papers', label: 'Every paper', icon: Books, count: s.works.length },
  ], [s, answers, profile]);

  return (
    <div className="page paper-page">
      <AuthorHero profile={profile} s={s} />
      <div className="paper-layout">
        <SectionRail items={rail} />
        <div className="sections">
          <SectionHeader id="output" question="What do they publish?" answer={answers.output} />
          <OutputSection profile={profile} s={s} onTopic={pickTopic} />

          <SectionHeader id="heldup" question="Has their work held up?" answer={answers.held} />
          <HeldUpSection s={s} selected={selected} onSelect={select} />

          <SectionHeader id="replicator" question="Do they check other people's work?" answer={answers.rep} />
          <ReplicatorSection s={s} />

          <SectionHeader id="open" question="How open is their work?" answer={answers.open} />
          <OpenSection s={s} />

          <SectionHeader id="integrity" question="Any integrity notices?" answer={answers.integ} />
          <IntegritySection s={s} />

          <SectionHeader id="network" question="Who do they work with?"
            answer={{ tone: 'none', verdict: plural(profile.coauthors.length, 'co-author'), text: `Across ${plural(profile.affiliations.length, 'institution')}. Co-authors with their own X-ray can be opened from the network.` }} />
          <NetworkSection profile={profile} />

          <SectionHeader id="papers" question="Every paper" />
          <PapersList s={s} topic={topic} setTopic={setTopic} onSelect={select} />
        </div>
      </div>
    </div>
  );
}

function MissingAuthor({ id }: { id: string }) {
  const [list, setList] = useState<Author[]>([]);
  useEffect(() => { listAuthors().then(setList); }, []);
  return (
    <div className="page narrow">
      <section className="card empty-state">
        <span className="eyebrow">Not in the sample data</span>
        <h1>No author with the id <span className="mono">{id}</span></h1>
        <p>The beta runs on invented sample authors. Try one of these:</p>
        <ul className="sample-links">{list.map(a => <li key={a.id}><Link to={`/author/${a.id}`}>{a.name}</Link></li>)}</ul>
      </section>
    </div>
  );
}
