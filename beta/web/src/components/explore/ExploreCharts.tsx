import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CaretDown, CaretUp, DownloadSimple } from '@phosphor-icons/react';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { ensureWorldMap } from '../../lib/worldMap';
import {
  COUNTRY_GEO, MIN_TESTED, groupBy, openByYearField, toCsv, type Dim, type Group, type buildRecords,
} from '../../lib/aggregates';
import { fmt, pct } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

type Recs = ReturnType<typeof buildRecords>;

export type Metric = 'papers' | 'coverage' | 'heldUp' | 'open';
export const METRIC: Record<Metric, { label: string; fmt: (g: Group) => string; value: (g: Group) => number | null }> = {
  papers: { label: 'Papers', fmt: g => fmt(Math.round(g.papers)), value: g => Math.round(g.papers) },
  coverage: { label: 'Share tested', fmt: g => pct(g.coverage), value: g => +(g.coverage * 100).toFixed(1) },
  heldUp: { label: 'Held up when tested', fmt: g => (g.heldUp == null ? 'too few to compare' : pct(g.heldUp)), value: g => (g.heldUp == null ? null : +(g.heldUp * 100).toFixed(0)) },
  open: { label: 'Open science', fmt: g => pct(g.open), value: g => +(g.open * 100).toFixed(0) },
};

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

/** World choropleth for one metric; groups with too few tested papers are greyed for outcome metrics. */
export function WorldMap({ countries, metric, setMetric, selected, onCountry }: {
  countries: Group[]; metric: Metric; setMetric: (m: Metric) => void; selected: string | null; onCountry: (iso: string | null) => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => { ensureWorldMap().then(() => setReady(true)); }, []);
  // A world map is about twice as wide as it is tall: size the chart to the screen instead of a fixed 420px.
  const [height] = useState(() => Math.round(Math.min(440, Math.max(250, (window.innerWidth - 64) * 0.55 + 40))));
  const build = useCallback((c: Colors) => {
    const M = METRIC[metric];
    const vals = countries.map(M.value).filter((v): v is number => v != null);
    return {
      ...baseOption(c),
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { name: string; data?: { g: Group } }) => {
        const g = p.data?.g; if (!g) return `<b>${p.name}</b><br/><span style="color:${c.muted}">No data in the sample</span>`;
        return `<b>${g.label}</b><br/>${M.label}: <b>${M.fmt(g)}</b><br/><span style="color:${c.muted}">${fmt(Math.round(g.papers))} papers · ${fmt(Math.round(g.tested))} tested · ${g.institutions} institution${g.institutions === 1 ? '' : 's'}</span><br/><i>Select to filter the page</i>`;
      } },
      // Horizontal legend below the map, so it never sits on top of a country (narrow screens).
      visualMap: { type: 'continuous', orient: 'horizontal', min: Math.min(...vals, 0), max: Math.max(...vals, 1), left: 8, bottom: 0, itemWidth: 10, itemHeight: 140, calculable: false,
        text: [`More`, `Less ${M.label.toLowerCase()}`], textStyle: { color: c.muted, fontSize: 11 }, inRange: { color: [c.primaryFaint, c.primaryBorder, c.primary] } },
      series: [{
        type: 'map', map: 'world', roam: true, top: 4, bottom: 36, left: 4, right: 4, cursor: 'pointer', selectedMode: false,
        nameProperty: 'name', animationDurationUpdate: 600,
        itemStyle: { areaColor: c.surface, borderColor: c.border, borderWidth: 0.5 },
        emphasis: { label: { show: false }, itemStyle: { areaColor: c.mixed, borderColor: c.text } },
        data: countries.map(g => {
          const v = M.value(g);
          return { name: COUNTRY_GEO[g.key] ?? g.label, value: v ?? 0, g,
            itemStyle: v == null ? { areaColor: c.faint, opacity: 0.6 } : g.key === selected ? { borderColor: c.text, borderWidth: 2 } : undefined,
            visualMap: v != null };
        }),
      }],
    };
  }, [countries, metric, selected]);
  const onClick = useCallback((p: ChartClick) => {
    const g = (p.data as { g?: Group } | undefined)?.g;
    if (g) onCountry(selected === g.key ? null : g.key);
  }, [selected, onCountry]);
  return (
    <ChartCard title="Evidence by country"
      summary={`Switch the metric to compare countries. ${metric === 'heldUp' ? `Countries with fewer than ${MIN_TESTED} tested papers are grey: too few to compare.` : ''} Select a country to filter the page; drag and scroll to pan and zoom.`}
      source="Institution countries (ROR); OpenAlex works; FLoRA replication links. Placeholder data."
      aside={<Seg label="Map metric" value={metric} onChange={setMetric} options={[['papers', 'Papers'], ['coverage', 'Tested'], ['heldUp', 'Held up'], ['open', 'Open']]} />}
      table={{ caption: 'Evidence by country', columns: ['Country', 'Papers', 'Share tested', 'Held up when tested', 'Open science', 'Institutions'],
        rows: countries.map(g => [g.label, fmt(Math.round(g.papers)), pct(g.coverage), METRIC.heldUp.fmt(g), pct(g.open), g.institutions]) }}>
      {ready
        ? <Chart build={build} height={height} onClick={onClick} label={`World map of ${METRIC[metric].label.toLowerCase()} by country: ${countries.map(g => `${g.label} ${METRIC[metric].fmt(g)}`).join(', ')}.`} />
        : <div className="skeleton" style={{ height }} role="status" aria-label="Loading map" />}
    </ChartCard>
  );
}

/** Field → outcome flows for tested papers, and how much of each field was tested. */
export function FieldFlows({ rs, onField }: { rs: Recs; onField: (f: string) => void }) {
  const fields = useMemo(() => groupBy(rs, 'field').filter(g => g.tested >= 1).sort((a, b) => b.tested - a.tested).slice(0, 9), [rs]);
  const buildSankey = useCallback((c: Colors) => {
    const out = [{ name: 'Held up', color: c.success }, { name: 'Mixed', color: c.mixed }, { name: 'Did not hold up', color: c.failed }];
    return {
      ...baseOption(c),
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { dataType: string; data: { source?: string; target?: string; value?: number }; name: string; value: number }) =>
        p.dataType === 'edge' ? `${p.data.source} → <b>${p.data.target}</b>: ${p.data.value} tested papers` : `<b>${p.name}</b>: ${Math.round(p.value)} tested papers` },
      series: [{
        type: 'sankey', left: 8, right: 120, top: 8, bottom: 8, nodeWidth: 14, nodeGap: 10, draggable: false, cursor: 'pointer',
        layoutIterations: 32, animationDuration: 1200,
        emphasis: { focus: 'adjacency' },
        label: { color: c.text, fontFamily: c.fontBody, fontSize: 12, fontWeight: 600 },
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
        data: [
          ...fields.map(f => ({ name: f.label, itemStyle: { color: c.primary } })),
          ...out.map(o => ({ name: o.name, itemStyle: { color: o.color }, label: { position: 'right' } })),
        ],
        links: fields.flatMap(f => [
          { source: f.label, target: 'Held up', value: Math.round(f.success) },
          { source: f.label, target: 'Mixed', value: Math.round(f.mixed) },
          { source: f.label, target: 'Did not hold up', value: Math.round(f.failed) },
        ]).filter(l => l.value > 0),
      }],
    };
  }, [fields]);
  const onClick = useCallback((p: ChartClick) => {
    const name = (p as { name?: string; dataType?: string }).name;
    if (name && fields.some(f => f.label === name)) onField(name);
  }, [fields, onField]);

  const buildCoverage = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const sorted = [...fields].sort((a, b) => b.coverage - a.coverage);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 70, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', ...ax, axisLabel: { ...ax.axisLabel, formatter: (v: number) => `${v}%` } },
      yAxis: { type: 'category', data: sorted.map(f => f.label), inverse: true, ...ax, axisTick: { show: false }, axisLabel: { ...ax.axisLabel, color: c.text } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [{ type: 'bar', barWidth: 12, name: 'Share tested', animationDelay: (i: number) => i * 70,
        data: sorted.map(f => ({ value: +(f.coverage * 100).toFixed(1), itemStyle: { color: f.tooFew ? c.faint : c.primary, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: 'right', color: c.muted, fontSize: 11, formatter: (p: { dataIndex: number }) => `${pct(sorted[p.dataIndex].coverage)} · n=${Math.round(sorted[p.dataIndex].tested)}` } }],
    };
  }, [fields]);

  return (
    <div className="bento">
      <ChartCard className="span-7" title="From field to outcome"
        summary="Tested papers flow from their field to what replications found. Hover a field to trace its flows; select one to filter the page."
        source="FLoRA replication links; fields from OpenAlex topics. Placeholder data."
        table={{ caption: 'Replication outcomes by field', columns: ['Field', 'Tested', 'Held up', 'Mixed', 'Did not'],
          rows: fields.map(f => [f.label, Math.round(f.tested), Math.round(f.success), Math.round(f.mixed), Math.round(f.failed)]) }}>
        <Chart build={buildSankey} height={380} onClick={onClick} label="Sankey diagram from field to replication outcome for tested papers." />
      </ChartCard>
      <ChartCard className="span-5" title="How much of each field was tested"
        summary={`Share of each field's papers with any replication evidence; n is the number tested. Grey fields have fewer than ${MIN_TESTED}.`}
        table={{ caption: 'Share tested by field', columns: ['Field', 'Papers', 'Tested', 'Share tested'], rows: fields.map(f => [f.label, fmt(Math.round(f.papers)), Math.round(f.tested), pct(f.coverage)]) }}>
        <Chart build={buildCoverage} height={380} label="Share of papers tested by field." />
      </ChartCard>
    </div>
  );
}

/** Year × field heatmap of open-science practice. */
export function OpenHeatmap({ rs }: { rs: Recs }) {
  const { fields, years, cells } = useMemo(() => {
    const fs = groupBy(rs, 'field').slice(0, 10).map(g => g.key);
    const r = openByYearField(rs, fs, 2005);
    return { fields: fs, ...r };
  }, [rs]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 8, bottom: 56, containLabel: true },
      xAxis: { type: 'category', data: years.map(String), ...ax, axisLabel: { ...ax.axisLabel, interval: 1 } },
      yAxis: { type: 'category', data: fields, ...ax, axisLabel: { ...ax.axisLabel, color: c.text } },
      visualMap: { min: 0, max: 100, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 12, itemHeight: 160, calculable: false,
        text: ['100% open', '0%'], textStyle: { color: c.muted, fontSize: 10 }, inRange: { color: [c.surface, c.primaryBorder, c.primary] } },
      tooltip: { ...baseOption(c).tooltip, formatter: (p: { value: [number, number, number, number] }) =>
        `<b>${fields[p.value[1]]}</b>, ${years[p.value[0]]}<br/>Open-science practice: <b>${p.value[2]}%</b><br/><span style="color:${c.muted}">${p.value[3]} papers (three-year window)</span>` },
      series: [{ type: 'heatmap', data: cells, itemStyle: { borderColor: c.raised, borderWidth: 1, borderRadius: 2 },
        emphasis: { itemStyle: { borderColor: c.text, borderWidth: 1.5 } }, progressive: 0, animationDuration: 900 }],
    };
  }, [fields, years, cells]);
  return (
    <ChartCard title="Open-science practice by field and year"
      summary="Average use of open access, preregistration, open data and open code, per field and year. Darker is more open; empty cells have too few papers."
      source="Unpaywall, OSF, Registered Reports list. Placeholder data."
      table={{ caption: 'Open-science practice by field and year', columns: ['Field', 'Year', 'Open-science practice', 'Papers'],
        rows: cells.map(([yi, fi, v, n]) => [fields[fi], years[yi], `${v}%`, n]) }}>
      <Chart build={build} height={Math.max(300, fields.length * 30 + 90)} label="Heatmap of open-science practice by field and year." />
    </ChartCard>
  );
}

/** Coverage vs held-up share, one bubble per country or institution. */
export function EvidenceLandscape({ rs, dim, setDim }: { rs: Recs; dim: 'country' | 'institution'; setDim: (d: 'country' | 'institution') => void }) {
  const nav = useNavigate();
  const groups = useMemo(() => groupBy(rs, dim), [rs, dim]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const maxP = Math.max(1, ...groups.map(g => g.papers));
    const ok = groups.filter(g => !g.tooFew), few = groups.filter(g => g.tooFew);
    const pt = (g: Group, faint: boolean) => ({
      value: [+(g.coverage * 100).toFixed(1), faint ? 50 : +((g.heldUp ?? 0) * 100).toFixed(0)], g,
      symbolSize: 14 + Math.sqrt(g.papers / maxP) * 46,
      itemStyle: { color: faint ? c.faint : c.primary, opacity: faint ? 0.35 : 0.8, borderColor: c.raised, borderWidth: 1.5 },
      label: { show: true, formatter: g.label.length > 18 ? g.label.slice(0, 17) + '…' : g.label, position: 'top', color: faint ? c.muted : c.text, fontSize: 11, fontWeight: 600 },
    });
    return {
      ...baseOption(c),
      grid: { left: 12, right: 24, top: 40, bottom: 40, containLabel: true },
      xAxis: { type: 'value', name: 'Share of papers tested', nameLocation: 'middle', nameGap: 28, ...ax, axisLabel: { ...ax.axisLabel, formatter: '{value}%' } },
      yAxis: { type: 'value', name: 'Held up when tested', min: 0, max: 100, ...ax, axisLabel: { ...ax.axisLabel, formatter: '{value}%' } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { data: { g: Group } }) => { const g = p.data.g;
        return `<b>${g.label}</b><br/>${pct(g.coverage)} of ${fmt(Math.round(g.papers))} papers tested (n=${Math.round(g.tested)})<br/>${g.tooFew ? '<i>Too few tested to compare</i>' : `Held up when tested: <b>${pct(g.heldUp!)}</b>`}${dim === 'institution' ? '<br/><i>Select to open the institution</i>' : ''}`; } },
      series: [
        // Overlapping labels are hidden (the bubble's tooltip and the table still name it).
        { type: 'scatter', name: 'Comparable', cursor: dim === 'institution' ? 'pointer' : 'default', data: ok.map(g => pt(g, false)),
          labelLayout: { hideOverlap: true },
          animationDelay: (i: number) => i * 80, emphasis: { scale: 1.15, itemStyle: { opacity: 1 } } },
        { type: 'scatter', name: 'Too few tested', cursor: dim === 'institution' ? 'pointer' : 'default', data: few.map(g => pt(g, true)),
          labelLayout: { hideOverlap: true },
          animationDelay: (i: number) => 300 + i * 80 },
      ],
      graphic: few.length ? [{ type: 'text', right: 24, top: 8, style: { text: `Grey: fewer than ${MIN_TESTED} tested papers, placed at 50% (not comparable)`, fill: c.muted, fontSize: 11, fontFamily: c.fontBody } }] : [],
    };
  }, [groups, dim]);
  const onClick = useCallback((p: ChartClick) => {
    const g = (p.data as { g?: Group } | undefined)?.g;
    if (g && dim === 'institution') nav(`/institution/${g.key}`);
  }, [dim, nav]);
  return (
    <ChartCard title="Evidence landscape"
      summary={`Each bubble is a ${dim}: how much of its research has been tested (right) and how much of that held up (up). Bubble size shows papers. Low coverage means the vertical position rests on little evidence.`}
      aside={<Seg label="Bubbles show" value={dim} onChange={setDim} options={[['country', 'Countries'], ['institution', 'Institutions']]} />}
      table={{ caption: `Coverage and outcomes by ${dim}`, columns: [dim === 'country' ? 'Country' : 'Institution', 'Papers', 'Tested', 'Share tested', 'Held up when tested'],
        rows: groups.map(g => [g.label, fmt(Math.round(g.papers)), Math.round(g.tested), pct(g.coverage), METRIC.heldUp.fmt(g)]) }}>
      <Chart build={build} height={400} onClick={onClick} label={`Scatter of ${groups.length} ${dim === 'country' ? 'countries' : 'institutions'} by share tested and share held up.`} />
    </ChartCard>
  );
}

type SortKey = 'label' | 'papers' | 'coverage' | 'heldUp' | 'open' | 'researchers';

/** Every number behind the page, sortable, with CSV download. */
export function NumbersTable({ rs }: { rs: Recs }) {
  const [dim, setDim] = useState<Dim>('country');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'papers', dir: -1 });
  const groups = useMemo(() => {
    const gs = groupBy(rs, dim);
    const v = (g: Group) => (sort.key === 'label' ? g.label : sort.key === 'heldUp' ? (g.heldUp ?? -1) : g[sort.key]);
    return [...gs].sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * sort.dir);
  }, [rs, dim, sort]);
  const download = () => {
    const blob = new Blob([toCsv(groups, dim)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lighthouse-beta-by-${dim}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const th = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort-btn" onClick={() => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'label' ? 1 : -1 }))}>
        {label}{sort.key === key && (sort.dir === 1 ? <CaretUp size={12} weight="bold" aria-hidden="true" /> : <CaretDown size={12} weight="bold" aria-hidden="true" />)}
      </button>
    </th>
  );
  return (
    <section className="card numbers" aria-labelledby="numbers-title">
      <header className="papers-head">
        <div>
          <h3 id="numbers-title" className="card-h">All the numbers</h3>
          <p className="card-summary">Sort any column. “Too few” marks groups with fewer than {MIN_TESTED} tested papers, whose outcome share is not comparable.</p>
        </div>
        <div className="card-tools">
          <Seg label="Group by" value={dim} onChange={setDim} options={[['country', 'Country'], ['institution', 'Institution'], ['field', 'Field']]} />
          <button type="button" className="ghost-btn" onClick={download}><DownloadSimple size={16} aria-hidden="true" />CSV</button>
        </div>
      </header>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Aggregates by {dim}</caption>
          <thead><tr>{th('label', dim[0].toUpperCase() + dim.slice(1))}{th('researchers', 'Researchers')}{th('papers', 'Papers')}{th('coverage', 'Share tested')}{th('heldUp', 'Held up when tested')}{th('open', 'Open science')}</tr></thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.key}>
                <th scope="row">{g.label}</th>
                <td>{g.researchers}</td>
                <td>{fmt(Math.round(g.papers))}</td>
                <td>{pct(g.coverage)} <span className="muted">n={Math.round(g.tested)}</span></td>
                <td>{g.heldUp == null ? <span className="muted">Too few</span> : pct(g.heldUp)}</td>
                <td>{pct(g.open)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
