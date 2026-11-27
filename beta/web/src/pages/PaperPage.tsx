import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight, ChartBar, ChatsCircle, Clock, Gauge, LockOpen, Quotes, Repeat, Users,
} from '@phosphor-icons/react';
import { getAuthor, getInstitution, getPaper, listPapers } from '../data';
import type { Paper } from '../data/types';
import { computeTrust, type DimensionKey } from '../lib/trust';
import {
  citationsAnswer, integrityAnswer, pubpeerAnswer, replicationAnswer, statisticsAnswer, transparencyAnswer, type Answer,
} from '../lib/signals';
import { plural } from '../lib/format';
import { Shell } from '../components/Shell';
import { SectionRail, type RailItem } from '../components/SectionRail';
import { SectionHeader } from '../components/SectionHeader';
import { PaperHero } from '../components/paper/PaperHero';
import { ScoreBreakdown } from '../components/paper/TrustPanel';
import { EvidenceTimeline } from '../components/paper/EvidenceTimeline';
import { ReplicationSection } from '../components/paper/ReplicationSection';
import { StatChecks, Transparency } from '../components/paper/StatsTransparency';
import { PubPeerSection } from '../components/paper/PubPeerSection';
import { CitationsSection } from '../components/paper/CitationsSection';

export default function PaperPage() {
  const doi = useParams()['*'] ?? '';
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'missing'; paper?: Paper }>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    getPaper(doi).then(p => { if (live) setState(p ? { status: 'ready', paper: p } : { status: 'missing' }); });
    return () => { live = false; };
  }, [doi]);

  useEffect(() => {
    document.title = state.paper ? `${state.paper.title} · Lighthouse Beta` : 'Lighthouse Beta';
    window.scrollTo(0, 0);
  }, [state.paper]);

  if (state.status === 'loading') return <Shell><div className="page"><div className="skeleton" style={{ height: 420 }} /><div className="skeleton" style={{ height: 160 }} /></div></Shell>;
  if (state.status === 'missing') return <Shell><NotFound doi={doi} /></Shell>;
  return <Shell><PaperView paper={state.paper!} /></Shell>;
}

function PaperView({ paper }: { paper: Paper }) {
  const trust = useMemo(() => computeTrust(paper), [paper]);
  const answers = useMemo(() => ({
    replication: replicationAnswer(paper), statistics: statisticsAnswer(paper), transparency: transparencyAnswer(paper),
    pubpeer: pubpeerAnswer(paper), integrity: integrityAnswer(paper), citations: citationsAnswer(paper),
  }), [paper]);

  // Selecting a dimension anywhere (hero bars, waterfall) opens its reasons.
  const [openDim, setOpenDim] = useState<DimensionKey | null>('replication');
  const pick = useCallback((k: DimensionKey) => {
    setOpenDim(k);
    requestAnimationFrame(() => document.getElementById(`reason-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }, []);

  const scoreTone = trust.score >= 75 ? 'good' as const : trust.score >= 50 ? 'warn' as const : 'bad' as const;
  const scoreAnswer: Answer = {
    tone: scoreTone,
    verdict: `${trust.score} / 100`,
    text: trust.retracted ? 'Capped because the paper is retracted.' : `${trust.band} trust, ${trust.confidence.toLowerCase()} confidence. Select any bar for its reasons.`,
  };
  const events = paper.replications.length + paper.reproductions.length + paper.commentaries.length + paper.integrity.length + paper.pubpeer.comments.length;

  const rail: RailItem[] = useMemo(() => [
    { id: 'score', label: 'Trust score', icon: Gauge, tone: scoreTone },
    { id: 'timeline', label: 'Timeline', icon: Clock, tone: answers.integrity.tone },
    { id: 'replication', label: 'Replications', icon: Repeat, tone: answers.replication.tone, count: paper.replications.length },
    { id: 'statistics', label: 'Statistics', icon: ChartBar, tone: answers.statistics.tone, count: paper.statChecks.length },
    { id: 'transparency', label: 'Open science', icon: LockOpen, tone: answers.transparency.tone },
    { id: 'pubpeer', label: 'PubPeer', icon: ChatsCircle, tone: answers.pubpeer.tone, count: paper.pubpeer.comments.length },
    { id: 'citations', label: 'Citations', icon: Quotes, tone: answers.citations.tone },
    { id: 'authors', label: 'Authors', icon: Users, count: paper.authors.length },
  ], [paper, answers, scoreTone]);

  return (
    <div className="page paper-page">
      <PaperHero paper={paper} trust={trust} onPick={pick} />

      <div className="paper-layout">
        <SectionRail items={rail} />
        <div className="sections">
          <SectionHeader id="score" question="How is the trust score built?" answer={scoreAnswer} />
          <ScoreBreakdown trust={trust} open={openDim} setOpen={setOpenDim} onPick={pick} />

          <SectionHeader id="timeline" question="What has happened since publication?"
            answer={{ ...answers.integrity, text: `${plural(events, 'event')} since ${paper.year}. ${answers.integrity.text}` }} />
          <EvidenceTimeline paper={paper} />

          <SectionHeader id="replication" question="Has it held up?" answer={answers.replication} />
          <ReplicationSection paper={paper} />

          <div className="bento">
            <div className="span-6 stack">
              <SectionHeader id="statistics" question="Is it reported soundly?" answer={answers.statistics} />
              <StatChecks paper={paper} />
            </div>
            <div className="span-6 stack">
              <SectionHeader id="transparency" question="Is it open?" answer={answers.transparency} />
              <Transparency paper={paper} />
            </div>
          </div>

          <SectionHeader id="pubpeer" question="What are people saying?" answer={answers.pubpeer} />
          <PubPeerSection paper={paper} />

          <SectionHeader id="citations" question="Is the field still citing it?" answer={answers.citations} />
          <CitationsSection paper={paper} />

          <SectionHeader id="authors" question="Who wrote it?" />
          <ul className="author-cards">
            {paper.authors.map((a, i) => {
              const au = getAuthor(a.authorId); if (!au) return null;
              const inst = getInstitution(au.institutionId);
              return (
                <li key={au.id} className="card author-card" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="avatar" aria-hidden="true">{au.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
                  <div className="ac-body">
                    <Link to={`/author/${au.id}`} className="ac-name">{au.name}</Link>
                    <span className="ac-aff">{au.department}, {inst?.name}</span>
                    <span className="ac-role">{a.position} author{a.corresponding ? ' · corresponding' : ''}{a.roles?.length ? ` · ${a.roles.join(', ')}` : ''}</span>
                  </div>
                  <Link to={`/author/${au.id}`} className="ac-go" aria-label={`Open the X-ray for ${au.name}`}>
                    X-ray <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NotFound({ doi }: { doi: string }) {
  const [samples, setSamples] = useState<Paper[]>([]);
  useEffect(() => { listPapers().then(setSamples); }, []);
  return (
    <div className="page narrow">
      <section className="card empty-state">
        <span className="eyebrow">Not in the sample data</span>
        <h1>We have no record for <span className="mono">{doi}</span></h1>
        <p>The beta currently runs on a small set of invented sample papers. Once the data sources are connected, any DOI will show its metadata and retraction status, and papers that FORRT tracks will show their full evidence profile.</p>
        <h2>Try a sample paper</h2>
        <ul className="sample-links">
          {samples.map(p => <li key={p.doi}><Link to={`/paper/${p.doi}`}>{p.title}</Link> <span className="mono">{p.doi}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
