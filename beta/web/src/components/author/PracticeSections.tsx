import { useCallback, useMemo } from 'react';
import { Prohibit, ShieldCheck, Warning } from '@phosphor-icons/react';
import type { ReplicationOutcome } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import type { AuthorStats } from '../../lib/authorStats';
import { INTEGRITY_LABEL, pct } from '../../lib/format';
import { Chart } from '../Chart';
import { ChartCard } from '../ChartCard';

const FOUND: Record<ReplicationOutcome, string> = { success: 'Supported the original', mixed: 'Mixed', inconclusive: 'Inconclusive', failed: 'Did not support it' };

/** Replications and reanalyses this author ran of other people's work. */
export function ReplicatorSection({ s }: { s: AuthorStats }) {
  const runs = [...s.replicationsRun].sort((a, b) => b.year - a.year);
  const years = Array.from(new Set(runs.map(w => w.year))).sort((a, b) => a - b);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const ser = (o: ReplicationOutcome, color: string, d: number) => ({
      type: 'bar', name: FOUND[o], stack: 'r', barMaxWidth: 26, itemStyle: { color, borderRadius: 2 }, emphasis: { focus: 'series' },
      animationDelay: (i: number) => d + i * 60, data: years.map(y => runs.filter(w => w.year === y && w.replicates!.outcome === o).length),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 14, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: years.map(String), ...ax },
      yAxis: { type: 'value', minInterval: 1, ...ax },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [ser('success', c.success, 0), ser('mixed', c.mixed, 120), ser('inconclusive', c.inconclusive, 200), ser('failed', c.failed, 280)],
    };
  }, [runs, years]);

  if (!runs.length) {
    return <section className="card"><div className="empty"><p><b>No replications of other people's work on record.</b> Most researchers have none; it says nothing about the quality of their own work.</p></div></section>;
  }
  return (
    <div className="bento">
      <ChartCard className="span-7" title="What their checks found"
        summary="Each bar counts the replications and reanalyses this author ran that year, by what they found about the original finding."
        source="FLoRA replication and reproduction records. Placeholder data."
        table={{ caption: 'Replications run', columns: ['Year', 'Study', 'Finding'], rows: runs.map(w => [w.year, w.replicates!.targetLabel, FOUND[w.replicates!.outcome]]) }}>
        <Chart build={build} height={240} label={`${runs.length} replications or reanalyses run, by year and result.`} />
      </ChartCard>
      <section className="card span-5 runs-list" aria-labelledby="runs-title">
        <h3 id="runs-title" className="card-h">Studies they checked</h3>
        <ul>
          {runs.map(w => (
            <li key={w.doi}>
              <span className={`dot st-${w.replicates!.outcome === 'success' ? 'success' : w.replicates!.outcome === 'failed' ? 'failed' : 'mixed'}`} aria-hidden="true" />
              <div>
                <span className="tl-title">{w.replicates!.targetLabel}</span>
                <span className="tl-meta">{w.year} · {FOUND[w.replicates!.outcome]}{w.registeredReport ? ' · Registered Report' : w.preregistered ? ' · preregistered' : ''}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** How open their work is, and how that changed. */
export function OpenSection({ s }: { s: AuthorStats }) {
  const firstPrereg = s.works.filter(w => w.preregistered).map(w => w.year).sort((a, b) => a - b)[0];
  const buildTrend = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    // Line style as well as hue separates the four practices.
    const line = (name: string, key: 'oa' | 'prereg' | 'data' | 'code', color: string, type: string, d: number) => ({
      type: 'line', name, smooth: 0.3, symbol: 'circle', symbolSize: 4, showSymbol: false,
      lineStyle: { color, width: 2.5, type }, itemStyle: { color }, emphasis: { focus: 'series' },
      animationDuration: 1300, animationDelay: d,
      data: s.openShare.map(y => (y.n ? +(y[key] * 100).toFixed(0) : null)),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: s.years.map(String), boundaryGap: false, ...ax },
      yAxis: { type: 'value', min: 0, max: 100, ...ax, axisLabel: { ...ax.axisLabel, formatter: '{value}%' } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', valueFormatter: (v: number) => (v == null ? '—' : `${v}%`) },
      series: [
        { ...line('Open access', 'oa', c.success, 'solid', 0),
          markLine: firstPrereg ? { symbol: 'none', silent: true, lineStyle: { color: c.primary, type: 'dotted' }, label: { formatter: 'First preregistration', color: c.primary, fontSize: 10, position: 'insideEndTop' }, data: [{ xAxis: String(firstPrereg) }] } : undefined },
        line('Preregistered', 'prereg', c.primary, 'dashed', 150),
        line('Open data', 'data', c.foundational, 'dotted', 300),
        line('Open code', 'code', c.meta, [8, 4, 2, 4] as unknown as string, 450),
      ],
    };
  }, [s, firstPrereg]);

  // Early career vs the last five years (memoised so the chart is not rebuilt on every render).
  const pairs = useMemo(() => {
    const early = s.works.filter(w => w.year < s.firstYear + 5);
    const recent = s.recentOpen;
    const e = (f: (w: (typeof early)[number]) => boolean) => (early.length ? early.filter(f).length / early.length : 0);
    return [
      { name: 'Open access', then: e(w => w.openAccess), now: recent.oa },
      { name: 'Preregistered', then: e(w => w.preregistered), now: recent.prereg },
      { name: 'Open data', then: e(w => w.openData), now: recent.data },
      { name: 'Open code', then: e(w => w.openCode), now: recent.code },
    ];
  }, [s]);
  const buildPairs = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 30, top: 34, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody } },
      xAxis: { type: 'value', min: 0, max: 100, ...ax, axisLabel: { ...ax.axisLabel, formatter: '{value}%' } },
      yAxis: { type: 'category', data: [...pairs].reverse().map(p => p.name), ...ax, axisTick: { show: false }, axisLabel: { ...ax.axisLabel, color: c.text } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } }, valueFormatter: (v: number) => `${v}%` },
      series: [
        { type: 'bar', name: `First five years (${s.firstYear}–${s.firstYear + 4})`, barWidth: 9, itemStyle: { color: c.faint, borderRadius: [0, 3, 3, 0] },
          animationDelay: (i: number) => i * 80, data: [...pairs].reverse().map(p => Math.round(p.then * 100)) },
        { type: 'bar', name: 'Last five years', barWidth: 9, itemStyle: { color: c.primary, borderRadius: [0, 3, 3, 0] },
          animationDelay: (i: number) => 300 + i * 80, data: [...pairs].reverse().map(p => Math.round(p.now * 100)),
          label: { show: true, position: 'right', color: c.text, fontSize: 11, fontWeight: 600, formatter: '{c}%' } },
      ],
    };
  }, [pairs, s.firstYear]);

  return (
    <div className="bento">
      <ChartCard className="span-7" title="Open-science practice over time"
        summary="Share of papers using each practice, smoothed over three years. Each practice has its own line style."
        source="Unpaywall, OSF, Registered Reports list. Placeholder data."
        table={{ caption: 'Open-science practice by year', columns: ['Year', 'Open access', 'Preregistered', 'Open data', 'Open code', 'Papers'],
          rows: s.openShare.filter(y => y.n).map(y => [y.year, pct(y.oa), pct(y.prereg), pct(y.data), pct(y.code), y.n]) }}>
        <Chart build={buildTrend} height={260} label="Share of papers that are open access, preregistered, and share data or code, by year." />
      </ChartCard>
      <ChartCard className="span-5" title="Then and now"
        summary={`First five years compared with the last five. ${s.registeredReports ? `${s.registeredReports} Registered Report${s.registeredReports > 1 ? 's' : ''} in total.` : 'No Registered Reports.'}`}
        table={{ caption: 'Open-science practice, early career vs recent', columns: ['Practice', 'First five years', 'Last five years'], rows: pairs.map(p => [p.name, pct(p.then), pct(p.now)]) }}>
        <Chart build={buildPairs} height={260} label="Open-science practice in the first five years compared with the last five." />
      </ChartCard>
    </div>
  );
}

/** Retractions, expressions of concern and corrections across the author's work. */
export function IntegritySection({ s }: { s: AuthorStats }) {
  if (!s.notices.length) {
    return (
      <section className="card integrity-clean">
        <ShieldCheck size={28} weight="duotone" aria-hidden="true" />
        <p><b>No integrity notices.</b> None of the {s.works.length} papers has a retraction, expression of concern or correction on record in Retraction Watch.</p>
      </section>
    );
  }
  return (
    <ul className="notice-list">
      {s.notices.map(w => {
        const bad = w.integrity === 'retraction' || w.integrity === 'expression_of_concern';
        const I = w.integrity === 'retraction' ? Prohibit : Warning;
        return (
          <li key={w.doi} className={`card notice ${bad ? 'n-bad' : 'n-warn'}`}>
            <I size={22} weight="bold" aria-hidden="true" />
            <div>
              <span className="n-kind">{INTEGRITY_LABEL[w.integrity!]}</span>
              <span className="n-title">{w.title}</span>
              <span className="tl-meta">{w.year} · {w.position} author{w.position !== 'first' && w.position !== 'last' ? ' (contributing author)' : ''}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
