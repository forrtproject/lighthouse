import { useCallback, useMemo } from 'react';
import { Check, CircleHalf, Question, X } from '@phosphor-icons/react';
import type { Paper, PracticeStatus } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { PRACTICE_LABEL, STATUS_LABEL } from '../../lib/format';
import { Chart } from '../Chart';
import { ChartCard } from '../ChartCard';

const status = (c: { decisionError: boolean; reportedP: number; recomputedP: number }) =>
  c.decisionError ? 'decision' : Math.abs(c.reportedP - c.recomputedP) > 0.005 && Math.abs(c.reportedP - c.recomputedP) / c.recomputedP > 0.25 ? 'minor' : 'ok';

/** Reported vs recomputed p-values: dots off the diagonal are reporting errors. */
export function StatChecks({ paper }: { paper: Paper }) {
  const checks = paper.statChecks;
  // Fit the log axis to the data (a decade below the smallest p), so points are not crammed in a corner.
  const LOG_MIN = useMemo(() => {
    const m = Math.min(...checks.flatMap(x => [x.reportedP, x.recomputedP]), 0.05);
    return Math.pow(10, Math.floor(Math.log10(m)));
  }, [checks]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const groups = [
      { key: 'ok', name: 'Consistent', color: c.success, symbol: 'circle' },
      { key: 'minor', name: 'Inconsistent', color: c.mixed, symbol: 'diamond' },
      { key: 'decision', name: 'Changes significance', color: c.failed, symbol: 'triangle' },
    ];
    const logAxis = (name: string) => ({ type: 'log', min: LOG_MIN, max: 1, logBase: 10, name, nameLocation: 'middle', nameGap: 30, ...ax,
      axisLabel: { ...ax.axisLabel, formatter: (v: number) => (v < 0.01 ? v.toExponential(0) : String(v)) } });
    return {
      ...baseOption(c),
      // Room for a two-line legend in a half-width card.
      grid: { left: 12, right: 24, top: 70, bottom: 44, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 14, itemWidth: 14, textStyle: { color: c.text2, fontFamily: c.fontBody, fontSize: 11 }, inactiveColor: c.faint },
      xAxis: logAxis('Reported p'),
      yAxis: logAxis('Recomputed p'),
      dataZoom: [{ type: 'inside', xAxisIndex: 0 }, { type: 'inside', yAxisIndex: 0 }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'item',
        formatter: (p: { value: [number, number, string] }) => `<b>${p.value[2]}</b><br/>Reported p = ${p.value[0]}<br/>Recomputed p = ${p.value[1].toFixed(4)}` },
      series: [
        ...groups.map((g, gi) => ({
          type: 'scatter', name: g.name, symbol: g.symbol, symbolSize: g.key === 'ok' ? 12 : 16,
          itemStyle: { color: g.color, borderColor: c.raised, borderWidth: 1.5 },
          emphasis: { scale: 1.6, label: { show: true, position: 'right', formatter: (p: { value: [number, number, string] }) => p.value[2], color: c.text, fontSize: 11 } },
          animationDelay: (i: number) => 300 + gi * 200 + i * 80,
          animationEasing: 'backOut',
          data: checks.filter(x => status(x) === g.key).map(x => [Math.max(LOG_MIN, x.reportedP), Math.max(LOG_MIN, x.recomputedP), x.label]),
        })),
        {
          type: 'line', silent: true, symbol: 'none', name: 'Perfect agreement',
          lineStyle: { color: c.muted, type: 'dashed', width: 1 }, itemStyle: { color: c.muted }, animationDuration: 800,
          data: [[LOG_MIN, LOG_MIN], [1, 1]],
          markLine: { symbol: 'none', silent: true, lineStyle: { color: c.primaryBorder, type: 'dotted' },
            label: { color: c.muted, fontSize: 10, formatter: 'α = .05', position: 'insideEndTop' },
            data: [{ xAxis: 0.05 }, { yAxis: 0.05 }] },
          markArea: { silent: true, itemStyle: { color: c.primaryFaint, opacity: 0.6 },
            data: [[{ xAxis: LOG_MIN, yAxis: 0.05 }, { xAxis: 0.05, yAxis: 1 }]] },
        },
      ],
    };
  }, [checks, LOG_MIN]);

  const bad = checks.filter(x => status(x) !== 'ok').length;
  const flips = checks.filter(x => x.decisionError).length;
  if (!checks.length) {
    return (
      <section className="card"><div className="empty"><p><b>No reported tests could be re-checked.</b> Checks need test statistics with degrees of freedom in the text.</p></div></section>
    );
  }
  return (
    <ChartCard
      title="Statistical consistency"
      summary={bad ? `${bad} of ${checks.length} reported tests do not match their test statistics${flips ? `; ${flips} would change significance (shaded area: reported significant, actually not)` : ''}.`
        : `All ${checks.length} reported tests match the p-values recomputed from their test statistics.`}
      source="statcheck-style recomputation from reported test statistics. Placeholder data."
      table={{ caption: 'Re-checked statistical tests', columns: ['Test', 'Reported p', 'Recomputed p', 'Result'],
        rows: checks.map(x => [x.label, x.reportedP, x.recomputedP.toFixed(4), status(x) === 'ok' ? 'Consistent' : x.decisionError ? 'Changes significance' : 'Inconsistent']) }}
    >
      <Chart build={build} height={300} label={`Reported against recomputed p-values for ${checks.length} tests.`} />
    </ChartCard>
  );
}

const STATUS_ORDER: PracticeStatus[] = ['yes', 'partial', 'no', 'unknown'];

/** Open-science practices: a radial mix plus a tile per practice. */
export function Transparency({ paper }: { paper: Paper }) {
  const build = useCallback((c: Colors) => {
    const col: Record<PracticeStatus, string> = { yes: c.success, partial: c.mixed, no: c.failed, unknown: c.borderLight };
    const counts = STATUS_ORDER.map(s => ({ s, n: paper.practices.filter(p => p.status === s).length })).filter(x => x.n);
    return {
      ...baseOption(c),
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { name: string; value: number; percent: number }) => `<b>${p.name}</b>: ${p.value} practice${p.value === 1 ? '' : 's'} (${Math.round(p.percent)}%)` },
      series: [{
        type: 'pie', radius: ['58%', '86%'], padAngle: 2, itemStyle: { borderRadius: 4, borderColor: c.raised, borderWidth: 2 },
        animationType: 'expansion', animationDuration: 1000,
        label: { show: false },
        emphasis: { scaleSize: 6, label: { show: true, position: 'center', formatter: '{b}\n{c}', fontFamily: c.fontDisplay, fontWeight: 700, fontSize: 16, color: c.text } },
        data: counts.map(x => ({ name: STATUS_LABEL[x.s], value: x.n, itemStyle: { color: col[x.s] } })),
      }],
      graphic: [{ type: 'text', left: 'center', top: 'middle', silent: true,
        style: { text: `${paper.practices.filter(p => p.status === 'yes').length}/${paper.practices.length}\nmet`, fill: c.text, fontFamily: c.fontDisplay, fontWeight: 700, fontSize: 18, align: 'center', lineHeight: 22 } }],
    };
  }, [paper]);
  const met = paper.practices.filter(p => p.status === 'yes').length;
  return (
    <ChartCard
      title="Transparency and open science"
      summary={`${met} of ${paper.practices.length} practices fully met. Hover the ring for counts; each tile explains one practice.`}
      source="Registered Reports list, OSF and journal metadata, Unpaywall. Placeholder data."
      table={{ caption: 'Open-science practices', columns: ['Practice', 'Status', 'Note'],
        rows: paper.practices.map(p => [PRACTICE_LABEL[p.key], STATUS_LABEL[p.status], p.note ?? '']) }}
    >
      <div className="transparency">
        <div className="ring"><Chart build={build} height={200} label={`${met} of ${paper.practices.length} open-science practices met.`} /></div>
        <ul className="practice-grid">
          {paper.practices.map((p, i) => (
            <li key={p.key} className={`practice s-${p.status}`} style={{ animationDelay: `${i * 60}ms` }} tabIndex={0}>
              <span className="p-icon" aria-hidden="true">{p.status === 'yes' ? <Check size={14} weight="bold" /> : p.status === 'partial' ? <CircleHalf size={14} weight="fill" /> : p.status === 'no' ? <X size={14} weight="bold" /> : <Question size={14} weight="bold" />}</span>
              <span className="p-name">{PRACTICE_LABEL[p.key]}</span>
              <span className="p-status">{STATUS_LABEL[p.status]}</span>
              {p.note && <span className="p-note">{p.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
