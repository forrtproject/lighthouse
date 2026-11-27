import { useCallback, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { Paper } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import {
  INTEGRITY_LABEL, OUTCOME_LABEL, OUTCOME_SYMBOL, REPRO_LABEL, SENTIMENT_LABEL, fmt, formatDate, outcomeColor,
  reproColor, sentimentColor,
} from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

const LANES = ['Publication & notices', 'Replications', 'Reanalyses', 'Critiques & meta-analyses', 'PubPeer'] as const;
type Lane = typeof LANES[number];

interface Ev {
  date: string; lane: Lane; title: string; detail: string;
  color: (c: Colors) => string; symbol: string; size: number;
}

const mid = (y: number) => `${y}-07-01`;

function events(p: Paper): Ev[] {
  const out: Ev[] = [];
  out.push({ date: p.published, lane: 'Publication & notices', title: 'Original paper published', detail: `${p.venue.name}, N = ${fmt(p.design.n)}`,
    color: c => c.foundational, symbol: 'rect', size: 16 });
  for (const e of p.integrity) {
    out.push({ date: e.date, lane: 'Publication & notices', title: INTEGRITY_LABEL[e.kind], detail: e.reason,
      color: c => (e.kind === 'correction' ? c.mixed : c.failed), symbol: e.kind === 'retraction' ? 'pin' : 'triangle', size: e.kind === 'retraction' ? 26 : 16 });
  }
  for (const r of p.replications) {
    out.push({ date: mid(r.year), lane: 'Replications', title: `${r.label}: ${OUTCOME_LABEL[r.outcome].toLowerCase()}`,
      detail: `${r.kind} replication, N = ${fmt(r.effect.n)}${r.labs > 1 ? `, ${r.labs} labs` : ''}${r.registeredReport ? ', Registered Report' : r.preregistered ? ', preregistered' : ''}`,
      color: c => outcomeColor(c, r.outcome), symbol: OUTCOME_SYMBOL[r.outcome], size: Math.max(10, Math.min(34, 4 + Math.sqrt(r.effect.n) * 0.7)) });
  }
  for (const r of p.reproductions) {
    out.push({ date: mid(r.year), lane: 'Reanalyses', title: `${r.label}: ${REPRO_LABEL[r.outcome].toLowerCase()}`, detail: `${r.kind}. ${r.note}`,
      color: c => reproColor(c, r.outcome), symbol: r.outcome === 'reproduced' ? 'circle' : r.outcome === 'partially' ? 'diamond' : 'triangle', size: 14 });
  }
  for (const m of p.commentaries) {
    out.push({ date: mid(m.year), lane: 'Critiques & meta-analyses', title: `${m.kind === 'meta_analysis' ? 'Meta-analysis' : m.kind === 'critique' ? 'Critique' : 'Commentary'}: ${m.label}`,
      detail: `${m.stance === 'supports' ? 'Supports' : m.stance === 'questions' ? 'Questions' : 'Neutral on'} the claim. ${m.note}`,
      color: c => (m.stance === 'supports' ? c.success : m.stance === 'questions' ? c.failed : c.neutral),
      symbol: m.kind === 'meta_analysis' ? 'diamond' : 'circle', size: m.kind === 'meta_analysis' ? 18 : 12 });
  }
  for (const cm of p.pubpeer.comments) {
    out.push({ date: cm.date, lane: 'PubPeer', title: cm.isAuthorResponse ? 'Author response' : `${SENTIMENT_LABEL[cm.sentiment]} comment`,
      detail: `${cm.commenter}: “${cm.excerpt}”`,
      color: c => (cm.isAuthorResponse ? c.primary : sentimentColor(c, cm.sentiment)), symbol: cm.isAuthorResponse ? 'roundRect' : 'circle', size: 10 });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function EvidenceTimeline({ paper }: { paper: Paper }) {
  const evs = useMemo(() => events(paper), [paper]);
  const [sel, setSel] = useState<number | null>(null);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const retraction = paper.integrity.find(e => e.kind === 'retraction');
    return {
      ...baseOption(c),
      grid: { left: 8, right: 24, top: 44, bottom: 48, containLabel: true },
      legend: { top: 0, left: 0, icon: 'circle', itemWidth: 9, itemHeight: 9, itemGap: 16,
        textStyle: { color: c.text2, fontFamily: c.fontBody, fontSize: 12 }, inactiveColor: c.faint,
        data: LANES.map(l => ({ name: l, itemStyle: { color: c.text2 } })) },
      // Six months of padding each side so edge markers are not clipped.
      xAxis: { type: 'time', ...ax, splitLine: { show: true, lineStyle: { color: c.borderLight } },
        min: +new Date(evs[0].date) - 182 * 864e5, max: +new Date(evs[evs.length - 1].date) + 182 * 864e5 },
      yAxis: { type: 'category', data: [...LANES].reverse(), ...ax, axisTick: { show: false },
        splitArea: { show: true, areaStyle: { color: [c.raised, c.surface] } }, axisLabel: { ...ax.axisLabel, color: c.text, fontWeight: 600 } },
      dataZoom: [{ type: 'slider', height: 16, bottom: 8, borderColor: c.border, fillerColor: c.primaryFaint, textStyle: { color: c.muted },
        handleStyle: { color: c.raised, borderColor: c.primary } }, { type: 'inside' }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'item',
        formatter: (p: { value: [string, string, number] }) => {
          const e = evs[p.value[2]];
          return `<div style="max-width:300px;white-space:normal"><b>${e.title}</b><br/><span style="color:${c.muted}">${formatDate(e.date)} · ${e.lane}</span><br/>${e.detail}</div>`;
        } },
      series: LANES.map((lane, li) => ({
        type: 'scatter', name: lane, cursor: 'pointer',
        animationDelay: (i: number) => li * 120 + i * 45,
        animationEasing: 'backOut',
        emphasis: { scale: 1.5, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.25)' } },
        data: evs.map((e, idx) => ({ e, idx })).filter(x => x.e.lane === lane).map(({ e, idx }) => ({
          value: [e.date, e.lane, idx], symbol: e.symbol, symbolSize: idx === sel ? e.size * 1.5 : e.size,
          itemStyle: { color: e.color(c), borderColor: idx === sel ? c.text : c.raised, borderWidth: idx === sel ? 2.5 : 1.5, opacity: 0.95 },
        })),
        markLine: li === 0 && retraction ? {
          symbol: 'none', silent: true,
          lineStyle: { color: c.failed, type: 'dashed', width: 1.5 },
          label: { formatter: 'Retracted', color: c.failed, fontWeight: 700, position: 'insideEndTop' },
          data: [{ xAxis: retraction.date }],
        } : undefined,
      })),
    };
  }, [paper, evs, sel]);
  const onClick = useCallback((p: ChartClick) => {
    const idx = (p.value as [string, string, number] | undefined)?.[2];
    if (idx != null) setSel(cur => (cur === idx ? null : idx));
  }, []);
  const current = sel != null ? evs[sel] : null;

  const counts = `${paper.replications.length} replications, ${paper.reproductions.length} reanalyses, ${paper.commentaries.length} critiques or meta-analyses and ${paper.pubpeer.comments.length} PubPeer comments`;
  return (
    <ChartCard
      title="Evidence timeline"
      summary={`Everything that has happened to this paper since ${paper.year}: ${counts}. Hover or select a marker; drag the slider or scroll to zoom.`}
      source="FLoRA (replications, reanalyses), Lighthouse (critiques, meta-analyses), Retraction Watch (notices), PubPeer. Placeholder data."
      table={{
        caption: 'Evidence timeline',
        columns: ['Date', 'Lane', 'Event', 'Detail'],
        rows: evs.map(e => [formatDate(e.date), e.lane, e.title, e.detail]),
      }}
      aside={<ul className="legend-inline" aria-label="Marker shapes">
        <li><i className="sh circle" />Success / positive</li>
        <li><i className="sh diamond" />Mixed / meta-analysis</li>
        <li><i className="sh triangle" />Failed / notice</li>
      </ul>}
    >
      <Chart build={build} height={350} onClick={onClick} label={`Timeline of evidence about the paper: ${counts}. Select a marker for details.`} />
      <div className={`event-detail${current ? ' is-open' : ''}`} aria-live="polite">
        {current ? (<>
          <span className="ed-date">{formatDate(current.date)} · {current.lane}</span>
          <b>{current.title}</b>
          <p>{current.detail}</p>
          <button type="button" className="icon-btn" onClick={() => setSel(null)} aria-label="Close event details"><X size={16} aria-hidden="true" /></button>
        </>) : <span className="ed-hint">Select any marker to pin its details here. Use the legend to show or hide lanes.</span>}
      </div>
    </ChartCard>
  );
}
