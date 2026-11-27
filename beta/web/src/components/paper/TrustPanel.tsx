import { useCallback } from 'react';
import { ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { type DimensionKey, type TrustResult } from '../../lib/trust';
import { useCountUp } from '../../lib/hooks';
import { pct } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

const bandColor = (c: Colors, s: number) => (s >= 75 ? c.success : s >= 50 ? c.inconclusive : s >= 25 ? c.mixed : c.failed);
const bandClass = (s: number) => (s >= 75 ? 'b-high' : s >= 50 ? 'b-moderate' : s >= 25 ? 'b-low' : 'b-very-low');

/** Overall score: a gauge against labelled bands, with the number and band as text. */
export function TrustGauge({ trust }: { trust: TrustResult }) {
  const [scoreRef, shown] = useCountUp<HTMLSpanElement>(trust.score, 1100);
  const build = useCallback((c: Colors) => ({
    ...baseOption(c),
    series: [{
      type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 100, radius: '100%', center: ['50%', '66%'],
      splitNumber: 4,
      axisLine: { lineStyle: { width: 12, color: [[0.25, c.failed], [0.5, c.mixed], [0.75, c.inconclusive], [1, c.success]] } },
      progress: { show: false },
      pointer: { length: '56%', width: 4, itemStyle: { color: c.text } },
      anchor: { show: true, size: 10, itemStyle: { color: c.raised, borderColor: c.text, borderWidth: 2 } },
      axisTick: { distance: -12, length: 4, lineStyle: { color: c.raised, width: 1 } },
      splitLine: { distance: -12, length: 12, lineStyle: { color: c.raised, width: 2 } },
      axisLabel: { distance: 16, color: c.muted, fontSize: 10, fontFamily: c.fontBody },
      title: { show: false }, detail: { show: false },
      animationDuration: 1100, animationEasing: 'elasticOut',
      data: [{ value: trust.score, name: 'Trust score' }],
    }],
  }), [trust.score]);

  return (
    <div className="gauge">
      <Chart build={build} height={150} label={`Trust score ${trust.score} out of 100, ${trust.band} band.`} />
      <div className="gauge-readout">
        <span className="gauge-num"><span ref={scoreRef} aria-hidden="true">{shown}</span><span className="visually-hidden">{trust.score}</span><small>/100</small></span>
        <span className={`band-chip band-${trust.band.replace(' ', '-').toLowerCase()}`}>{trust.band} trust</span>
      </div>
    </div>
  );
}

/** Six dimensions as compact bars; each opens its reasons in the breakdown section. */
export function DimensionList({ trust, onPick }: { trust: TrustResult; onPick: (k: DimensionKey) => void }) {
  return (
    <ul className="dim-list" aria-label="Trust score by dimension">
      {trust.dimensions.map((d, i) => (
        <li key={d.key}>
          <button type="button" className="dim-row" onClick={() => onPick(d.key)}
            aria-label={`${d.label}: ${d.assessed ? `${d.score} out of 100` : 'no evidence yet'}. Show reasons.`}>
            <span className="dim-name">{d.short}</span>
            <span className="dim-track" aria-hidden="true">
              {d.assessed
                ? <span className={`dim-fill ${bandClass(d.score!)}`} style={{ ['--w' as string]: `${d.score}%`, animationDelay: `${300 + i * 90}ms` }} />
                : <span className="dim-empty">No evidence yet</span>}
            </span>
            <span className="dim-score">{d.assessed ? d.score : '—'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** How each dimension adds up to the final score (waterfall). */
function ContributionWaterfall({ trust, onPick }: { trust: TrustResult; onPick: (k: DimensionKey) => void }) {
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const items = trust.contributions.map(x => ({ name: x.label, v: x.points }));
    if (trust.capApplied > 0) items.push({ name: 'Retraction cap', v: -trust.capApplied });
    const base: number[] = []; const pos: (number | string)[] = []; const neg: (number | string)[] = [];
    let run = 0;
    for (const it of items) {
      if (it.v >= 0) { base.push(run); pos.push(+it.v.toFixed(1)); neg.push('-'); run += it.v; }
      else { run += it.v; base.push(run); pos.push('-'); neg.push(+(-it.v).toFixed(1)); }
    }
    const cats = [...items.map(i => i.name), 'Trust score'];
    base.push(0); pos.push(trust.score); neg.push('-');
    return {
      ...baseOption(c),
      grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: cats, ...ax, axisLabel: { ...ax.axisLabel, interval: 0, color: c.text2, width: 80, overflow: 'break' } },
      // Scale to the data: a fixed 0–100 axis flattens low scores into slivers.
      yAxis: { type: 'value', min: 0, max: (v: { max: number }) => Math.min(100, Math.ceil((v.max + 8) / 10) * 10), ...ax },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } },
        formatter: (ps: { name: string; seriesName: string; value: number | string }[]) => {
          const p = ps.find(x => x.seriesName !== 'base' && x.value !== '-');
          if (!p) return '';
          return p.name === 'Trust score' ? `<b>Trust score</b>: ${p.value}`
            : `<b>${p.name}</b>: ${p.seriesName === 'down' ? '−' : '+'}${p.value} points<br/><i>Select to read the reasons</i>`;
        } },
      series: [
        { name: 'base', type: 'bar', stack: 'w', silent: true, itemStyle: { color: 'transparent' }, data: base },
        { name: 'up', type: 'bar', stack: 'w', barWidth: '56%', cursor: 'pointer',
          animationDelay: (i: number) => i * 140,
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.2)' } },
          data: pos.map((v, i) => ({ value: v, itemStyle: { color: i === cats.length - 1 ? c.primary : bandColor(c, trust.dimensions[i]?.score ?? 0), borderRadius: 3 } })),
          label: { show: true, position: 'top', color: c.text, fontSize: 11, fontFamily: c.fontBody, fontWeight: 600,
            formatter: (p: { value: number | string; dataIndex: number }) => p.value === '-' || p.value === 0 ? '' : p.dataIndex === cats.length - 1 ? `${p.value}` : `+${p.value}` } },
        { name: 'down', type: 'bar', stack: 'w', animationDelay: () => trust.contributions.length * 140, itemStyle: { color: c.failed, borderRadius: 3 }, data: neg,
          label: { show: true, position: 'bottom', color: c.failed, fontSize: 11, fontWeight: 600, formatter: (p: { value: number | string }) => p.value === '-' ? '' : `−${p.value}` } },
      ],
    };
  }, [trust]);
  const onClick = useCallback((p: ChartClick) => {
    const d = p.dataIndex != null ? trust.contributions[p.dataIndex] : undefined;
    if (d) onPick(d.key);
  }, [trust, onPick]);
  return <Chart build={build} height={240} onClick={onClick} label={`Contribution of each dimension to the trust score of ${trust.score}. Select a bar to read its reasons.`} />;
}

const DIR = { 1: { Icon: ArrowUp, label: 'Raises trust', cls: 'up' }, 0: { Icon: Minus, label: 'Context', cls: 'flat' }, [-1]: { Icon: ArrowDown, label: 'Lowers trust', cls: 'down' } } as const;

/** The waterfall plus every reason behind every dimension. */
export function ScoreBreakdown({ trust, open, setOpen, onPick }: {
  trust: TrustResult; open: DimensionKey | null; setOpen: (k: DimensionKey | null) => void; onPick: (k: DimensionKey) => void;
}) {
  return (
    <div className="bento">
      <ChartCard
        className="span-7"
        title="Points per dimension"
        summary={trust.retracted
          ? `The dimensions add up to ${(trust.score + trust.capApplied).toFixed(0)}, but a retraction caps the score at ${trust.score}.`
          : `Each dimension contributes its score times its weight. Weights are rescaled over the dimensions that have evidence (${pct(trust.coverage)} of the model).`}
        source="Draft trust model; weights are under discussion."
        table={{
          caption: 'Trust score by dimension',
          columns: ['Dimension', 'Weight', 'Score', 'Points', 'Based on'],
          rows: trust.dimensions.map((d, i) => [d.label, pct(d.weight), d.assessed ? d.score! : 'Not assessed', trust.contributions[i].points.toFixed(1), d.basis])
            .concat(trust.capApplied ? [['Retraction cap', '', '', `−${trust.capApplied.toFixed(1)}`, 'Paper is retracted']] : [])
            .concat([['Trust score', '', trust.score, trust.score, `${trust.band} · ${trust.confidence} confidence`]]),
        }}
      >
        <ContributionWaterfall trust={trust} onPick={onPick} />
      </ChartCard>

      <section className="card span-5 reasons" aria-labelledby="reasons-title">
        <h3 id="reasons-title" className="card-h">Every reason</h3>
        {trust.dimensions.map(d => (
          <details key={d.key} id={`reason-${d.key}`} className={`reason-group${open === d.key ? ' is-active' : ''}`} open={open === d.key}
            onToggle={e => { const isOpen = (e.currentTarget as HTMLDetailsElement).open; if (isOpen) setOpen(d.key); else if (open === d.key) setOpen(null); }}>
            <summary>
              <span className="rg-name">{d.label}</span>
              <span className={`rg-score ${d.assessed ? bandClass(d.score!) : ''}`}>{d.assessed ? d.score : '—'}</span>
            </summary>
            <p className="rg-basis">{d.basis} · weight {pct(d.weight)}</p>
            <ul>
              {d.reasons.map((r, i) => {
                const { Icon, label, cls } = DIR[r.direction];
                return (
                  <li key={i} className={`dir-${cls}`}>
                    <Icon size={14} weight="bold" className="dir-icon" aria-label={label} role="img" />
                    <span>{r.text}</span>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}
