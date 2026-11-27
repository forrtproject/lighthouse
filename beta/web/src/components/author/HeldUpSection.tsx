import { useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, X } from '@phosphor-icons/react';
import type { AuthorWork, WorkReplicationStatus } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import type { AuthorStats } from '../../lib/authorStats';
import { fmt } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

export const STATUS_LABEL: Record<WorkReplicationStatus, string> = { untested: 'Untested', success: 'Held up', mixed: 'Mixed', failed: 'Did not hold up' };
const SYMBOL: Record<WorkReplicationStatus, string> = { untested: 'circle', success: 'circle', mixed: 'diamond', failed: 'triangle' };

/** Every paper by year and citations, coloured by replication evidence; untested papers stay visible. */
function PaperLandscape({ s, selected, onSelect }: { s: AuthorStats; selected: string | null; onSelect: (doi: string | null) => void }) {
  // Deterministic jitter so papers from the same year do not sit on one vertical line.
  const pts = useMemo(() => s.original.map((w, i) => ({ w, x: w.year + (((i * 37) % 100) / 100 - 0.5) * 0.7 })), [s]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const col: Record<WorkReplicationStatus, string> = { untested: c.faint, success: c.success, mixed: c.mixed, failed: c.failed };
    const order: WorkReplicationStatus[] = ['untested', 'success', 'mixed', 'failed'];
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 44, bottom: 30, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'value', min: s.firstYear - 1, max: 2026, interval: 2, name: 'Year', nameLocation: 'middle', nameGap: 26, ...ax, axisLabel: { ...ax.axisLabel, formatter: (v: number) => String(v) } },
      yAxis: { type: 'log', min: 1, name: 'Citations (log)', ...ax },
      dataZoom: [{ type: 'inside', xAxisIndex: 0 }, { type: 'inside', yAxisIndex: 0 }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'item',
        formatter: (p: { data: { w: AuthorWork } }) => { const w = p.data.w; return `<div style="max-width:280px;white-space:normal"><b>${w.title}</b><br/>${w.year} · ${fmt(w.citations)} citations · ${w.position} author<br/>${STATUS_LABEL[w.replication.status]}${w.replication.count ? ` (${w.replication.count} replication${w.replication.count > 1 ? 's' : ''})` : ''}<br/><i>Select for details</i></div>`; } },
      series: order.map((st, si) => ({
        type: 'scatter', name: STATUS_LABEL[st], symbol: SYMBOL[st], cursor: 'pointer',
        // Series colour drives the legend icon; without it ECharts falls back to its default palette.
        itemStyle: { color: col[st] },
        animationDelay: (i: number) => si * 250 + i * 4,
        emphasis: { scale: 1.6, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.25)' } },
        data: pts.filter(p => p.w.replication.status === st).map(p => ({
          value: [p.x, Math.max(1, p.w.citations)], w: p.w,
          symbolSize: (st === 'untested' ? 5 : 9) + Math.sqrt(p.w.citations) * (st === 'untested' ? 0.5 : 0.9) + (p.w.doi === selected ? 6 : 0),
          itemStyle: { color: col[st], opacity: st === 'untested' ? 0.55 : 0.95, borderColor: p.w.doi === selected ? c.text : c.raised, borderWidth: p.w.doi === selected ? 2.5 : 1 },
        })),
      })),
    };
  }, [pts, s, selected]);
  const onClick = useCallback((p: ChartClick) => {
    const w = (p.data as { w?: AuthorWork } | undefined)?.w;
    if (w) onSelect(w.doi === selected ? null : w.doi);
  }, [selected, onSelect]);
  return (
    <ChartCard className="span-8" title="Paper landscape"
      summary={`All ${fmt(s.original.length)} papers by year and citations. Grey papers have never been tested; that is most of them, as for most researchers. Select a paper for details; scroll to zoom.`}
      source="FLoRA replication links, OpenAlex citations. Placeholder data."
      table={{ caption: 'Papers with replication evidence', columns: ['Year', 'Paper', 'Citations', 'Replications', 'Result'],
        rows: s.tested.map(w => [w.year, w.title, fmt(w.citations), w.replication.count, STATUS_LABEL[w.replication.status]]) }}>
      <Chart build={build} height={340} onClick={onClick} label={`Scatter of ${s.original.length} papers by year and citations, coloured by replication result.`} />
    </ChartCard>
  );
}

function WorkDetail({ w, onClose }: { w: AuthorWork; onClose: () => void }) {
  const flags = [
    w.openAccess && 'Open access', w.preregistered && 'Preregistered', w.registeredReport && 'Registered Report',
    w.openData && 'Open data', w.openCode && 'Open code',
  ].filter(Boolean) as string[];
  return (
    <aside className={`card span-4 work-detail st-${w.replication.status}`} aria-live="polite" aria-label="Selected paper">
      <header>
        <span className={`status-pill st-${w.replication.status}`}>{STATUS_LABEL[w.replication.status]}</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close paper details"><X size={16} aria-hidden="true" /></button>
      </header>
      <h3 className="card-h">{w.title}</h3>
      <p className="wd-meta">{w.year} · <i>{w.venue}</i> · {w.position} author</p>
      <dl className="facts">
        <div><dt>Citations</dt><dd>{fmt(w.citations)}</dd></div>
        <div><dt>Replications</dt><dd>{w.replication.count || 'None on record'}</dd></div>
        <div><dt>Topic</dt><dd>{w.topic}</dd></div>
        <div><dt>Practices</dt><dd>{flags.length ? flags.join(' · ') : 'None recorded'}</dd></div>
      </dl>
      {w.hasProfile
        ? <Link className="btn-secondary small" to={`/paper/${w.doi}`}>Open the full evidence profile <ArrowRight size={14} aria-hidden="true" /></Link>
        : <p className="fineprint">No full evidence profile for this paper in the sample data.</p>}
    </aside>
  );
}

function TestedList({ s, onSelect }: { s: AuthorStats; onSelect: (doi: string) => void }) {
  const tested = [...s.tested].sort((a, b) => b.citations - a.citations);
  return (
    <section className="card span-4 tested-list" aria-labelledby="tested-title">
      <h3 id="tested-title" className="card-h">Tested papers</h3>
      <p className="card-summary">{tested.length ? 'Every paper someone has tried to replicate, most cited first.' : 'Nobody has tried to replicate any of these papers yet.'}</p>
      <ul>
        {tested.map(w => (
          <li key={w.doi}>
            <button type="button" onClick={() => onSelect(w.doi)}>
              <span className={`dot st-${w.replication.status}`} aria-hidden="true" />
              <span className="tl-title">{w.title}</span>
              <span className="tl-meta">{w.year} · {STATUS_LABEL[w.replication.status]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HeldUpSection({ s, selected, onSelect }: { s: AuthorStats; selected: string | null; onSelect: (doi: string | null) => void }) {
  const w = selected ? s.works.find(x => x.doi === selected) : undefined;
  return (
    <div className="bento">
      <PaperLandscape s={s} selected={selected} onSelect={onSelect} />
      {w ? <WorkDetail w={w} onClose={() => onSelect(null)} /> : <TestedList s={s} onSelect={onSelect} />}
    </div>
  );
}
