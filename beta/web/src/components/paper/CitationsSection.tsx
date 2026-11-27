import { useCallback } from 'react';
import type { Attention, Paper } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { INTEGRITY_LABEL, fmt, pct } from '../../lib/format';
import { useCountUp } from '../../lib/hooks';
import { Chart } from '../Chart';
import { ChartCard } from '../ChartCard';

export function CitationsSection({ paper }: { paper: Paper }) {
  const cs = paper.citations;
  const total = cs.reduce((s, y) => s + y.supporting + y.contrasting + y.mentioning, 0);
  const contrasting = cs.reduce((s, y) => s + y.contrasting, 0);
  const retraction = paper.integrity.find(e => e.kind === 'retraction');
  const afterRetraction = retraction ? cs.filter(y => y.year > +retraction.date.slice(0, 4)).reduce((s, y) => s + y.supporting + y.contrasting + y.mentioning, 0) : 0;
  const firstFail = [...paper.replications].filter(r => r.outcome === 'failed').sort((a, b) => a.year - b.year)[0];

  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const years = cs.map(y => String(y.year));
    // Short labels sit horizontally above the plot; full names are in the tooltip and summary.
    const SHORT = { correction: 'Corrected', expression_of_concern: 'Concern', retraction: 'Retracted' } as const;
    const marks: { xAxis: string; name: string; full: string; color: string }[] = [];
    for (const r of paper.replications.filter(r => r.outcome === 'failed')) marks.push({ xAxis: String(r.year), name: 'Failed rep.', full: `Failed replication: ${r.label}`, color: c.failed });
    for (const e of paper.integrity) marks.push({ xAxis: e.date.slice(0, 4), name: SHORT[e.kind], full: INTEGRITY_LABEL[e.kind], color: e.kind === 'correction' ? c.mixed : c.failed });
    const bar = (name: string, key: 'supporting' | 'mentioning' | 'contrasting', color: string, d: number) => ({
      type: 'bar', name, stack: 'c', barMaxWidth: 28, itemStyle: { color }, emphasis: { focus: 'series' },
      animationDelay: (i: number) => d + i * 45, data: cs.map(y => y[key]),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 8, top: 78, bottom: 48, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: years, ...ax },
      yAxis: [
        { type: 'value', name: 'Citations', ...ax },
        { type: 'value', name: 'Contrasting', min: 0, max: 1, ...ax, splitLine: { show: false }, axisLabel: { ...ax.axisLabel, formatter: (v: number) => pct(v) } },
      ],
      dataZoom: [{ type: 'slider', height: 16, bottom: 8, borderColor: c.border, fillerColor: c.primaryFaint, textStyle: { color: c.muted },
        handleStyle: { color: c.raised, borderColor: c.primary } }, { type: 'inside' }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [
        bar('Supporting', 'supporting', c.success, 0),
        bar('Mentioning', 'mentioning', c.neutral, 120),
        bar('Contrasting', 'contrasting', c.failed, 240),
        {
          type: 'line', name: 'Share contrasting', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: { color: c.primary, width: 2 }, itemStyle: { color: c.primary },
          animationDuration: 1400, animationDelay: 500,
          data: cs.map(y => { const t = y.supporting + y.contrasting + y.mentioning; return t ? +(y.contrasting / t).toFixed(3) : 0; }),
          tooltip: { valueFormatter: (v: number) => pct(v) },
          markLine: { symbol: 'none', silent: false, animationDuration: 900,
            label: { position: 'end', fontSize: 10, fontWeight: 700, fontFamily: c.fontBody, formatter: (p: { name: string }) => p.name },
            tooltip: { formatter: (p: { data: { full: string } }) => p.data.full },
            data: marks.map(m => ({ xAxis: m.xAxis, name: m.name, full: m.full, lineStyle: { color: m.color, type: 'dashed', width: 1.5 }, label: { color: m.color } })) },
        },
      ],
    };
  }, [cs, paper]);

  return (
    <div className="citations">
      <ChartCard
        title="Citations and how they cite"
        summary={<>
          {fmt(total)} citations, {pct(contrasting / Math.max(total, 1))} of them contrasting.
          {firstFail && <> The first failed replication came in {firstFail.year}.</>}
          {retraction && <> <b>{fmt(afterRetraction)} citations came after the retraction.</b></>}
          {' '}Toggle stances in the legend; drag the slider to zoom.
        </>}
        source="Citation counts from OpenAlex; citation stance from citation-context classification. Placeholder data."
        table={{ caption: 'Citations per year by stance', columns: ['Year', 'Supporting', 'Mentioning', 'Contrasting'],
          rows: cs.map(y => [y.year, y.supporting, y.mentioning, y.contrasting]) }}
      >
        <Chart build={build} height={320} label={`Citations per year by stance, ${fmt(total)} in total, with replication failures and notices marked.`} />
      </ChartCard>
      <AttentionStrip a={paper.attention} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  const [ref, v] = useCountUp<HTMLElement>(value);
  return (
    <div className="att">
      <b ref={ref} aria-hidden="true">{fmt(v)}</b>
      <span className="visually-hidden">{fmt(value)}</span>
      <span>{label}</span>
      <small>{hint}</small>
    </div>
  );
}

function AttentionStrip({ a }: { a: Attention }) {
  return (
    <section className="card attention" aria-label="Attention outside academia">
      <Stat label="News stories" value={a.news} hint="Media coverage" />
      <Stat label="Policy documents" value={a.policy} hint="Cited in policy" />
      <Stat label="Syllabi" value={a.syllabi} hint="Taught in courses" />
      <Stat label="Wikipedia articles" value={a.wikipedia} hint="Public reference" />
      <Stat label="Social posts" value={a.socialPosts} hint="Online discussion" />
    </section>
  );
}
