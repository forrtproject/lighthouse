import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import type { AuthorWork } from '../../data/types';
import type { AuthorStats } from '../../lib/authorStats';
import { INTEGRITY_LABEL, fmt } from '../../lib/format';
import { STATUS_LABEL } from './HeldUpSection';

type Filter = 'all' | 'tested' | 'success' | 'mixed' | 'failed' | 'untested' | 'replications' | 'notices';
const FILTERS: { key: Filter; label: string; test: (w: AuthorWork) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'tested', label: 'Tested', test: w => w.replication.status !== 'untested' },
  { key: 'success', label: 'Held up', test: w => w.replication.status === 'success' },
  { key: 'mixed', label: 'Mixed', test: w => w.replication.status === 'mixed' },
  { key: 'failed', label: 'Did not hold up', test: w => w.replication.status === 'failed' },
  { key: 'untested', label: 'Untested', test: w => !w.replicates && w.replication.status === 'untested' },
  { key: 'replications', label: 'Replications run', test: w => !!w.replicates },
  { key: 'notices', label: 'Notices', test: w => !!w.integrity },
];
const PAGE = 15;

export function PapersList({ s, topic, setTopic, onSelect }: {
  s: AuthorStats; topic: string | null; setTopic: (t: string | null) => void; onSelect: (doi: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.key, s.works.filter(f.test).length])), [s]);
  const shown = useMemo(() => {
    const f = FILTERS.find(x => x.key === filter)!;
    const needle = q.trim().toLowerCase();
    return s.works.filter(w => f.test(w) && (!topic || w.topic === topic) && (!needle || w.title.toLowerCase().includes(needle)));
  }, [s, filter, topic, q]);
  const visible = all ? shown : shown.slice(0, PAGE);

  return (
    <section className="card papers" aria-labelledby="papers-title">
      <header className="papers-head">
        <h3 id="papers-title" className="card-h">Every paper</h3>
        <label className="search-field">
          <MagnifyingGlass size={16} aria-hidden="true" />
          <span className="visually-hidden">Search titles</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles" type="search" />
        </label>
      </header>
      <div className="filter-row" role="group" aria-label="Filter papers">
        {FILTERS.map(f => (
          <button key={f.key} type="button" className="filter-chip" aria-pressed={filter === f.key} disabled={!counts[f.key] && f.key !== 'all'}
            onClick={() => { setFilter(f.key); setAll(false); }}>
            {f.label}<span>{counts[f.key]}</span>
          </button>
        ))}
        {topic && (
          <button type="button" className="filter-chip is-topic" onClick={() => setTopic(null)} aria-label={`Remove topic filter ${topic}`}>
            Topic: {topic} <X size={12} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="card-summary" aria-live="polite">Showing {Math.min(visible.length, shown.length)} of {shown.length} papers.</p>
      {shown.length ? (
        <ol className="paper-rows">
          {visible.map(w => (
            <li key={w.doi} className="paper-row">
              <span className="pr-year">{w.year}</span>
              <div className="pr-main">
                <button type="button" className="pr-title" onClick={() => onSelect(w.doi)}>{w.title}</button>
                <span className="pr-meta"><i>{w.venue}</i> · {w.position} author · {fmt(w.citations)} citations</span>
                <span className="pr-badges">
                  {w.replicates
                    ? <span className="badge b-rep">Replication of {w.replicates.targetLabel.length > 48 ? w.replicates.targetLabel.slice(0, 46) + '…' : w.replicates.targetLabel}</span>
                    : <span className={`badge st-${w.replication.status}`}>{STATUS_LABEL[w.replication.status]}</span>}
                  {w.integrity && <span className="badge b-notice">{INTEGRITY_LABEL[w.integrity]}</span>}
                  {w.registeredReport ? <span className="badge">Registered Report</span> : w.preregistered && <span className="badge">Preregistered</span>}
                  {w.openData && <span className="badge">Open data</span>}
                  {w.openAccess && <span className="badge">Open access</span>}
                </span>
              </div>
              {w.hasProfile && <Link to={`/paper/${w.doi}`} className="pr-go" aria-label={`Open the evidence profile of ${w.title}`}>Evidence <ArrowRight size={13} aria-hidden="true" /></Link>}
            </li>
          ))}
        </ol>
      ) : <div className="empty"><p>No papers match these filters.</p><button type="button" className="btn-secondary small" onClick={() => { setFilter('all'); setQ(''); setTopic(null); }}>Clear filters</button></div>}
      {!all && shown.length > PAGE && (
        <button type="button" className="btn-secondary show-all" onClick={() => setAll(true)}>Show all {shown.length} papers</button>
      )}
    </section>
  );
}
