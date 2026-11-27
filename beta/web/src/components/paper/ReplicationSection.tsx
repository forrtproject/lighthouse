import { useCallback, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { EffectSize, Paper, Replication, ReplicationOutcome } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import {
  OUTCOME_LABEL, OUTCOME_SYMBOL, REPRO_LABEL, effectText, fmt, outcomeColor, pct, pool,
} from '../../lib/format';
import { replicationWeight } from '../../lib/trust';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

interface Row {
  id: string; label: string; sub: string; e: EffectSize;
  kind: 'original' | 'replication' | 'pooled' | 'meta';
  outcome?: ReplicationOutcome;
}

type Select = (id: string | null) => void;

/** Forest plot: original vs every replication, with pooled estimates as diamonds. */
function ForestPlot({ paper, selected, onSelect }: { paper: Paper; selected: string | null; onSelect: Select }) {
  const rows = useMemo<Row[]>(() => {
    const reps = [...paper.replications].sort((a, b) => a.year - b.year);
    const out: Row[] = [{ id: 'original', label: `Original (${paper.year})`, sub: `N = ${fmt(paper.originalEffect.n)}`, e: paper.originalEffect, kind: 'original' }];
    for (const r of reps) out.push({ id: r.id, label: r.label, sub: `N = ${fmt(r.effect.n)}${r.labs > 1 ? ` · ${r.labs} labs` : ''}`, e: r.effect, kind: 'replication', outcome: r.outcome });
    const pooled = pool(reps.map(r => r.effect));
    if (pooled) out.push({ id: 'pooled', label: 'Replications pooled', sub: 'fixed effect', e: pooled, kind: 'pooled' });
    for (const m of paper.commentaries.filter(x => x.pooled)) out.push({ id: m.id, label: `Meta-analysis: ${m.label}`, sub: `N = ${fmt(m.pooled!.n)}`, e: m.pooled!, kind: 'meta' });
    return out.reverse();     // original at the top
  }, [paper]);

  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const colorOf = (r: Row) => r.kind === 'original' ? c.foundational : r.kind === 'pooled' ? c.primary : r.kind === 'meta' ? c.meta : outcomeColor(c, r.outcome!);
    const lo = Math.min(...rows.map(r => r.e.ciLow), 0), hi = Math.max(...rows.map(r => r.e.ciHigh));
    const xMax = Math.ceil(hi * 4) / 4;
    const xMin = Math.floor((lo - 0.05) * 4) / 4;   // on a 0.25 grid so tick labels do not collide
    const n = rows.length;
    return {
      ...baseOption(c),
      grid: { left: 8, right: 130, top: 28, bottom: 30, containLabel: true },   // room for reference-line labels
      xAxis: { type: 'value', min: xMin, max: xMax, name: `Effect size (${paper.originalEffect.metric})`, nameLocation: 'middle', nameGap: 24, ...ax },
      yAxis: { type: 'category', data: rows.map(r => r.label), ...ax, axisTick: { show: false },
        axisLabel: { ...ax.axisLabel, color: c.text, fontSize: 12,
          formatter: (v: string) => { const r = rows.find(x => x.label === v)!; return r.id === selected ? `{s|${v}}` : r.kind === 'replication' ? v : `{b|${v}}`; },
          rich: { b: { fontWeight: 700, color: c.text, fontSize: 12, fontFamily: c.fontBody },
                  s: { fontWeight: 700, color: c.primary, fontSize: 12, fontFamily: c.fontBody } } } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'item',
        formatter: (p: { dataIndex: number }) => { const r = rows[p.dataIndex]; return `<b>${r.label}</b><br/>${effectText(r.e)}<br/><span style="color:${c.muted}">${r.sub}${r.outcome ? ' · ' + OUTCOME_LABEL[r.outcome] : ''}</span>${r.kind === 'replication' ? '<br/><i>Select for details</i>' : ''}`; } },
      series: [
        {
          type: 'custom', cursor: 'pointer',
          // Series-level stagger, top row first; ECharts re-targets this correctly on resize.
          animationDelay: (i: number) => (n - 1 - i) * 90, animationDuration: 600,
          renderItem: (_: unknown, api: { value: (i: number) => number; coord: (v: number[]) => number[] }) => {
            const i = api.value(0), r = rows[i];
            const [x0, y] = api.coord([r.e.ciLow, i]); const [x1] = api.coord([r.e.ciHigh, i]); const [xm] = api.coord([r.e.value, i]);
            const [xa] = api.coord([xMax, i]); const [xz] = api.coord([xMin, i]);
            const col = colorOf(r);
            const isSel = r.id === selected;
            const band = isSel ? [{ type: 'rect', name: 'band', silent: true, shape: { x: xz, y: y - 17, width: xa - xz, height: 34 }, style: { fill: c.primaryFaint } }] : [];
            if (r.kind === 'pooled' || r.kind === 'meta') {
              return { type: 'group', $mergeChildren: 'byName', children: [...band, {
                type: 'polygon', name: 'diamond', shape: { points: [[x0, y], [xm, y - 9], [x1, y], [xm, y + 9]] },
                style: { fill: col, stroke: c.raised, lineWidth: 1 },
              }] };
            }
            const s = Math.max(6, Math.min(18, Math.sqrt(r.e.n) * 0.45)) * (isSel ? 1.25 : 1);
            const lw = isSel ? 3 : 2;
            // Children are matched by name on update; matching by index breaks when the band is added.
            return { type: 'group', $mergeChildren: 'byName', children: [...band,
              { type: 'line', name: 'ci', shape: { x1: x0, y1: y, x2: x1, y2: y }, style: { stroke: col, lineWidth: lw } },
              { type: 'line', name: 'capL', shape: { x1: x0, y1: y - 4, x2: x0, y2: y + 4 }, style: { stroke: col, lineWidth: lw } },
              { type: 'line', name: 'capR', shape: { x1: x1, y1: y - 4, x2: x1, y2: y + 4 }, style: { stroke: col, lineWidth: lw } },
              { type: 'rect', name: 'point', shape: { x: xm - s / 2, y: y - s / 2, width: s, height: s },
                style: { fill: col, stroke: isSel ? c.text : c.raised, lineWidth: isSel ? 2 : 1 } },
            ] };
          },
          encode: { x: [1, 2, 3], y: 0 },
          data: rows.map((r, i) => [i, r.e.ciLow, r.e.value, r.e.ciHigh]),
          markLine: { symbol: 'none', silent: true, animationDuration: 1200, data: [
            { xAxis: 0, lineStyle: { color: c.text2, type: 'solid', width: 1 }, label: { formatter: 'No effect', color: c.muted, position: 'end' } },
            { xAxis: paper.originalEffect.value, lineStyle: { color: c.foundational, type: 'dashed', width: 1 }, label: { formatter: 'Original', color: c.foundational, position: 'end' } },
          ] },
        },
        {
          // Label-only series: invisible markers carry the numeric labels at the right edge.
          type: 'scatter', symbolSize: 0, silent: true, itemStyle: { color: 'transparent' },
          data: rows.map((_, i) => [xMax, i]),
          label: { show: true, position: 'right', distance: 12, color: c.text2, fontFamily: c.fontMono, fontSize: 11,
            formatter: (p: { dataIndex: number }) => { const r = rows[p.dataIndex]; return `${r.e.value.toFixed(2)} [${r.e.ciLow.toFixed(2)}, ${r.e.ciHigh.toFixed(2)}]`; } },
        },
      ],
    };
  }, [rows, paper, selected]);

  const onClick = useCallback((p: ChartClick) => {
    const r = p.dataIndex != null ? rows[p.dataIndex] : undefined;
    if (r?.kind === 'replication') onSelect(r.id === selected ? null : r.id);
  }, [rows, selected, onSelect]);

  const pooled = rows.find(r => r.kind === 'pooled');
  const shrink = pooled ? pooled.e.value / paper.originalEffect.value : null;
  return (
    <ChartCard
      title="Effect sizes: original vs replications"
      summary={pooled
        ? `Original ${effectText(paper.originalEffect)}. Replications pooled: ${effectText(pooled.e)}, ${pct(shrink!)} of the original effect. Select a study for details.`
        : 'No replications yet, so only the original estimate is shown.'}
      source="FLoRA / FReD effect sizes; pooled estimate is an inverse-variance fixed-effect average. Placeholder data."
      table={{
        caption: 'Effect sizes of the original study and its replications',
        columns: ['Study', 'Effect size', '95% CI', 'N', 'Outcome'],
        rows: [...rows].reverse().map(r => [r.label, r.e.value.toFixed(2), `[${r.e.ciLow.toFixed(2)}, ${r.e.ciHigh.toFixed(2)}]`, fmt(r.e.n),
          r.outcome ? OUTCOME_LABEL[r.outcome] : r.kind === 'original' ? 'Original' : 'Pooled']),
      }}
      aside={<ul className="legend-inline" aria-label="Outcome legend">
        {(['success', 'mixed', 'failed'] as const).map(o => <li key={o}><i className={`sh ${OUTCOME_SYMBOL[o]} o-${o}`} />{OUTCOME_LABEL[o]}</li>)}
        <li><i className="sh diamond pooled" />Pooled</li>
      </ul>}
    >
      <Chart build={build} height={Math.max(220, rows.length * 44 + 60)} onClick={onClick}
        label="Forest plot of effect sizes with 95% confidence intervals. Select a replication for details." />
    </ChartCard>
  );
}

/** Sample sizes of every study, on a log scale. */
function SamplePower({ paper, selected, onSelect }: { paper: Paper; selected: string | null; onSelect: Select }) {
  const studies = useMemo(() => [{ id: 'original', label: `Original ${paper.year}`, n: paper.design.n, o: null as ReplicationOutcome | null }]
    .concat([...paper.replications].sort((a, b) => a.year - b.year).map(r => ({ id: r.id, label: r.label, n: r.effect.n, o: r.outcome }))), [paper]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 30, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: studies.map(s => s.label), ...ax, axisLabel: { ...ax.axisLabel, interval: 0, rotate: studies.length > 4 ? 25 : 0 } },
      yAxis: { type: 'log', name: 'Participants (log scale)', min: 10, ...ax },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [{
        type: 'bar', barMaxWidth: 34, name: 'Participants', cursor: 'pointer',
        animationDelay: (i: number) => i * 120,
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.2)' } },
        data: studies.map(s => ({ value: s.n, itemStyle: {
          color: s.o ? outcomeColor(c, s.o) : c.foundational, borderRadius: [3, 3, 0, 0],
          ...(s.id === selected ? { borderColor: c.text, borderWidth: 2 } : {}),
          opacity: selected && s.id !== selected && s.id !== 'original' ? 0.45 : 1,
        } })),
        label: { show: true, position: 'top', color: c.text2, fontSize: 11, formatter: (p: { value: number }) => fmt(p.value) },
      }],
    };
  }, [studies, selected]);
  const onClick = useCallback((p: ChartClick) => {
    const s = p.dataIndex != null ? studies[p.dataIndex] : undefined;
    if (s && s.id !== 'original') onSelect(s.id === selected ? null : s.id);
  }, [studies, selected, onSelect]);
  const power = paper.design.powerForReplicationEffect;
  return (
    <ChartCard
      title="Sample size and power"
      summary={power != null
        ? `The original (N = ${fmt(paper.design.n)}) had ${pct(power)} power to detect the effect replications later found${power < 0.5 ? ', which is low.' : '.'}`
        : `The original study had N = ${fmt(paper.design.n)}.`}
      source="Power computed for the pooled replication effect at α = .05, two-sided. Placeholder data."
      table={{ caption: 'Sample sizes', columns: ['Study', 'N'], rows: studies.map(s => [s.label, fmt(s.n)]) }}
    >
      {power != null && (
        <div className="power-strip" aria-hidden="true">
          <span>Original power</span>
          <div className="meter big"><span style={{ ['--w' as string]: pct(power) }} className={`grow ${power < 0.5 ? 'low' : power < 0.8 ? 'mid' : 'ok'}`} /><i style={{ left: '80%' }} title="80% convention" /></div>
          <b>{pct(power)}</b>
        </div>
      )}
      <Chart build={build} height={220} onClick={onClick} label="Sample size of the original study and each replication. Select a bar for details." />
    </ChartCard>
  );
}

/** Details of the selected replication. */
function ReplicationDetail({ rep, totalWeight, onClose }: { rep: Replication; totalWeight: number; onClose: () => void }) {
  return (
    <aside className={`card rep-detail o-${rep.outcome}`} aria-live="polite" aria-label={`Details: ${rep.label}`}>
      <header>
        <span className={`outcome-badge o-${rep.outcome}`}>{OUTCOME_LABEL[rep.outcome]}</span>
        <h4>{rep.label}</h4>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details"><X size={16} aria-hidden="true" /></button>
      </header>
      <blockquote>“{rep.quote}”</blockquote>
      <dl className="facts">
        <div><dt>Type</dt><dd>{rep.kind} replication</dd></div>
        <div><dt>Sample</dt><dd>N = {fmt(rep.effect.n)}{rep.labs > 1 ? `, ${rep.labs} labs` : ', single lab'}</dd></div>
        <div><dt>Effect</dt><dd className="mono">{effectText(rep.effect)}</dd></div>
        <div><dt>Design</dt><dd>{rep.registeredReport ? 'Registered Report' : rep.preregistered ? 'Preregistered' : 'Not preregistered'}</dd></div>
        <div><dt>Weight in trust score</dt><dd>{pct(replicationWeight(rep) / totalWeight)} of the replication evidence</dd></div>
      </dl>
    </aside>
  );
}

/** Computational reproductions and robustness reanalyses as outcome tiles. */
function Reanalyses({ paper }: { paper: Paper }) {
  const rs = paper.reproductions;
  return (
    <section className="card" aria-labelledby="reanalyses-title">
      <header className="card-head">
        <div className="card-titles">
          <h3 id="reanalyses-title">Reproductions and robustness checks</h3>
          <p className="card-summary">{rs.length ? `${rs.length} reanalyses of the original data or analysis.` : 'No one has reanalysed the original data yet.'}</p>
        </div>
      </header>
      {rs.length ? (
        <ul className="tiles">
          {rs.map((r, i) => (
            <li key={r.id} className={`tile tile-${r.outcome}`} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="tile-kind">{r.kind}</span>
              <span className="tile-outcome">{REPRO_LABEL[r.outcome]}</span>
              <span className="tile-label">{r.label}</span>
              <p>{r.note}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <p><b>No reproductions on record.</b> A reproduction re-runs the original analysis on the original data. It is the cheapest check of a finding.</p>
          <a className="btn-secondary" href="#">Suggest a reproduction</a>
        </div>
      )}
    </section>
  );
}

export function ReplicationSection({ paper }: { paper: Paper }) {
  const [selected, setSelected] = useState<string | null>(null);
  const rep = paper.replications.find(r => r.id === selected);
  const totalWeight = paper.replications.reduce((s, r) => s + replicationWeight(r), 0);
  return (
    <>
      {paper.replications.length ? (
        <div className={`forest-wrap${rep ? ' has-detail' : ''}`}>
          <ForestPlot paper={paper} selected={selected} onSelect={setSelected} />
          {rep && <ReplicationDetail rep={rep} totalWeight={totalWeight} onClose={() => setSelected(null)} />}
        </div>
      ) : (
        <section className="card">
          <div className="empty">
            <p><b>No replications on record.</b> That is not the same as replicated: nobody has tested this finding again yet, or the test is not in our sources.</p>
            <a className="btn-secondary" href="#">Suggest a replication</a>
          </div>
        </section>
      )}
      <div className="grid-2">
        <SamplePower paper={paper} selected={selected} onSelect={setSelected} />
        <Reanalyses paper={paper} />
      </div>
    </>
  );
}
