import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import type { InstitutionProfile } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import type { InstitutionStats, PlacedResearcher } from '../../lib/institutionStats';
import type { MatchMethod } from '../../lib/departments';
import { fmt, pct } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

// Departments get a stable colour from the brand ramp plus the evidence-type hues.
const deptColor = (c: Colors, i: number, slug: string) =>
  slug === 'unassigned' ? c.faint : [c.primary, c.foundational, c.critique, c.meta, c.reproduction, c.replication, c.wiki][i % 7];

/** Departments as a treemap (area = researchers); selecting one scopes the page. */
export function DepartmentTreemap({ s, dept, setDept }: { s: InstitutionStats; dept: string | null; setDept: (d: string | null) => void }) {
  const build = useCallback((c: Colors) => ({
    ...baseOption(c),
    tooltip: { ...baseOption(c).tooltip, formatter: (p: { name: string; value: number; data: { papers: number } }) =>
      `<b>${p.name}</b><br/>${p.value} researchers · ${fmt(p.data.papers)} papers<br/><i>Select to show only this department</i>` },
    series: [{
      type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, width: '100%', height: '100%', top: 0, left: 0,
      animationDuration: 900, cursor: 'pointer',
      itemStyle: { borderColor: c.raised, borderWidth: 3, gapWidth: 3, borderRadius: 6 },
      label: { show: true, color: '#fff', fontFamily: c.fontBody, fontWeight: 700, fontSize: 12, formatter: '{b}\n{c} researchers', lineHeight: 16 },
      data: s.departments.map((d, i) => ({
        name: d.name, value: d.researchers, papers: d.papers, slug: d.slug,
        itemStyle: { color: deptColor(c, i, d.slug), opacity: dept && dept !== d.slug ? 0.35 : 1, borderColor: dept === d.slug ? c.text : c.raised },
        label: { color: d.slug === 'unassigned' ? c.text : '#fff' },
      })),
    }],
  }), [s, dept]);
  const onClick = useCallback((p: ChartClick) => {
    const slug = (p.data as { slug?: string } | undefined)?.slug;
    if (slug) setDept(dept === slug ? null : slug);
  }, [dept, setDept]);
  return (
    <ChartCard className="span-7" title="Departments"
      summary="Area shows researchers. Select a department to show only that department across the whole page."
      table={{ caption: 'Departments', columns: ['Department', 'Researchers', 'Papers', 'Citations'], rows: s.departments.map(d => [d.name, d.researchers, fmt(d.papers), fmt(d.citations)]) }}>
      <Chart build={build} height={300} onClick={onClick} label={`Departments by number of researchers: ${s.departments.map(d => `${d.name} ${d.researchers}`).join(', ')}.`} />
    </ChartCard>
  );
}

const METHOD_LABEL: Record<MatchMethod, string> = { unit: 'Named unit', keyword: 'Keyword only', unassigned: 'Could not place' };

/** How each department was derived from raw affiliation text. */
export function DerivationPanel({ s }: { s: InstitutionStats }) {
  const [method, setMethod] = useState<MatchMethod | 'all'>('all');
  const [open, setOpen] = useState(false);
  const total = s.matches.length;
  const shown = s.matches.filter(m => method === 'all' || m.method === method);
  // Unique strings only; the same string recurs across papers.
  const unique = [...new Map(shown.map(m => [m.raw, m])).values()];
  return (
    <section className="card span-5 derivation" aria-labelledby="deriv-title">
      <h3 id="deriv-title" className="card-h">How departments were derived</h3>
      <p className="card-summary">{fmt(total)} affiliation strings from papers, matched to departments by rule.</p>
      <div className="deriv-bar" role="img" aria-label={s.derivation.map(d => `${METHOD_LABEL[d.method]}: ${d.n}`).join(', ')}>
        {s.derivation.map(d => <span key={d.method} className={`db-${d.method}`} style={{ flexGrow: d.n }} title={`${METHOD_LABEL[d.method]}: ${d.n}`} />)}
      </div>
      <ul className="deriv-legend">
        {s.derivation.map(d => (
          <li key={d.method}>
            <button type="button" className="filter-chip" aria-pressed={method === d.method} onClick={() => { setMethod(method === d.method ? 'all' : d.method); setOpen(true); }}>
              <i className={`db-${d.method}`} aria-hidden="true" />{METHOD_LABEL[d.method]}<span>{pct(d.n / Math.max(1, total))}</span>
            </button>
          </li>
        ))}
      </ul>
      <dl className="deriv-explain">
        <div><dt>Named unit</dt><dd>A part such as “Department of Psychology” or “Fakultät für Psychologie”.</dd></div>
        <div><dt>Keyword only</dt><dd>A subject word without a unit, e.g. “Psychology, …”. Less certain.</dd></div>
        <div><dt>Could not place</dt><dd>The string names only the institution or a city.</dd></div>
      </dl>
      <details className="deriv-table" open={open} onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Show {fmt(unique.length)} distinct strings{method !== 'all' ? ` (${METHOD_LABEL[method].toLowerCase()})` : ''}</summary>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">Affiliation strings and derived departments</caption>
            <thead><tr><th scope="col">Affiliation text on papers</th><th scope="col">Department</th><th scope="col">How</th></tr></thead>
            <tbody>
              {unique.slice(0, 80).map(m => (
                <tr key={m.raw}><th scope="row" className="raw">{m.raw}</th><td>{m.department}</td><td className={`m-${m.method}`}>{METHOD_LABEL[m.method]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

/** Topic × department heatmap: who works on what. */
export function TopicHeatmap({ s, onCell }: { s: InstitutionStats; onCell: (dept: string, topic: string) => void }) {
  const depts = s.departments.filter(d => d.slug !== 'unassigned');
  const topics = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of depts) for (const [t, n] of d.topics) m.set(t, (m.get(t) ?? 0) + n);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 12);
  }, [depts]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const data: [number, number, number][] = [];
    depts.forEach((d, x) => topics.forEach((t, y) => { const n = d.topics.get(t) ?? 0; if (n) data.push([x, y, n]); }));
    const max = Math.max(1, ...data.map(d => d[2]));
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 8, bottom: 60, containLabel: true },
      xAxis: { type: 'category', data: depts.map(d => d.name), ...ax, splitArea: { show: false }, axisLabel: { ...ax.axisLabel, interval: 0, rotate: depts.length > 3 ? 20 : 0, color: c.text, fontWeight: 600 } },
      yAxis: { type: 'category', data: topics, ...ax, axisLabel: { ...ax.axisLabel, color: c.text } },
      visualMap: { min: 0, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 12, itemHeight: 120,
        inRange: { color: [c.primaryFaint, c.primaryBorder, c.primary] }, textStyle: { color: c.muted, fontSize: 10 }, text: ['More researchers', 'Fewer'] },
      tooltip: { ...baseOption(c).tooltip, formatter: (p: { value: [number, number, number] }) => `<b>${topics[p.value[1]]}</b> in ${depts[p.value[0]].name}<br/>${p.value[2]} researcher${p.value[2] === 1 ? '' : 's'}<br/><i>Select to list them</i>` },
      series: [{
        type: 'heatmap', data, cursor: 'pointer',
        label: { show: true, color: c.text, fontSize: 11, fontWeight: 600 },
        itemStyle: { borderColor: c.raised, borderWidth: 2, borderRadius: 4 },
        emphasis: { itemStyle: { borderColor: c.text, borderWidth: 2 } },
        animationDuration: 800,
      }],
    };
  }, [depts, topics]);
  const onClick = useCallback((p: ChartClick) => {
    const v = p.value as [number, number, number] | undefined;
    if (v) onCell(depts[v[0]].slug, topics[v[1]]);
  }, [depts, topics, onCell]);
  return (
    <ChartCard title="Who works on what"
      summary="Number of researchers per topic in each department. Select a cell to list those researchers."
      table={{ caption: 'Researchers per topic and department', columns: ['Topic', ...depts.map(d => d.name)], rows: topics.map(t => [t, ...depts.map(d => d.topics.get(t) ?? 0)]) }}>
      <Chart build={build} height={Math.max(260, topics.length * 30 + 110)} onClick={onClick} label="Heatmap of researchers by topic and department." />
    </ChartCard>
  );
}

/** Researcher directory: alphabetical, filterable, never ranked. */
export function PeopleDirectory({ s, topic, setTopic, dept }: { s: InstitutionStats; topic: string | null; setTopic: (t: string | null) => void; dept: string | null }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const people = useMemo(() => s.scope.filter(r => (!topic || r.topics.includes(topic)) && (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()))), [s, topic, q]);
  const visible = all ? people : people.slice(0, 18);
  return (
    <section className="card people" aria-labelledby="people-title">
      <header className="papers-head">
        <div>
          <h3 id="people-title" className="card-h">Researchers{dept ? ` in ${s.scopeName}` : ''}</h3>
          <p className="card-summary">Listed alphabetically. Lighthouse does not rank researchers; open an X-ray for the evidence behind someone's work.</p>
        </div>
        <label className="search-field">
          <MagnifyingGlass size={16} aria-hidden="true" />
          <span className="visually-hidden">Search names</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search names" type="search" />
        </label>
      </header>
      {topic && (
        <div className="filter-row">
          <button type="button" className="filter-chip is-topic" onClick={() => setTopic(null)} aria-label={`Remove topic filter ${topic}`}>Topic: {topic} <X size={12} weight="bold" aria-hidden="true" /></button>
        </div>
      )}
      <p className="card-summary" aria-live="polite">Showing {visible.length} of {people.length}.</p>
      {people.length ? (
        <ul className="people-grid">
          {visible.map((r: PlacedResearcher) => (
            <li key={r.id} className={`person${r.profileId ? ' has-xray' : ''}`}>
              <span className="avatar" aria-hidden="true">{r.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
              <div className="p-body">
                <span className="p-name">{r.name}</span>
                <span className="p-dept">{r.department}{r.department === 'Unassigned' ? ' (could not be placed)' : ''}</span>
                <span className="p-meta">Since {r.firstYear} · {fmt(r.papers)} papers</span>
                <span className="p-topics">{r.topics.map(t => <button key={t} type="button" className="mini-chip" onClick={() => setTopic(t)}>{t}</button>)}</span>
              </div>
              {r.profileId && <Link to={`/author/${r.profileId}`} className="pr-go" aria-label={`Open the X-ray for ${r.name}`}>X-ray <ArrowRight size={13} aria-hidden="true" /></Link>}
            </li>
          ))}
        </ul>
      ) : <div className="empty"><p>No researchers match.</p></div>}
      {!all && people.length > 18 && <button type="button" className="btn-secondary show-all" onClick={() => setAll(true)}>Show all {people.length}</button>}
    </section>
  );
}

/** Replication evidence by department, with coverage on every bar. */
export function DeptHeldUp({ s, dept }: { s: InstitutionStats; dept: string | null }) {
  const depts = s.departments.filter(d => d.slug !== 'unassigned');
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const ser = (name: string, key: 'success' | 'mixed' | 'failed', color: string, d: number) => ({
      type: 'bar', name, stack: 'o', barWidth: 16, itemStyle: { color }, emphasis: { focus: 'series' },
      animationDelay: (i: number) => d + i * 90,
      data: depts.map(x => ({ value: x.outcomes[key], itemStyle: { opacity: dept && dept !== x.slug ? 0.3 : 1 } })),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 90, top: 40, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 14, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'value', minInterval: 1, name: 'Tested papers', ...ax },
      yAxis: { type: 'category', data: depts.map(d => d.name), inverse: true, ...ax, axisTick: { show: false }, axisLabel: { ...ax.axisLabel, color: c.text, fontWeight: 600 } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [
        ser('Held up', 'success', c.success, 0), ser('Mixed', 'mixed', c.mixed, 120),
        { ...ser('Did not hold up', 'failed', c.failed, 240),
          // Coverage beside every bar: the tested share is the context for the outcomes.
          label: { show: true, position: 'right', color: c.muted, fontSize: 11, formatter: (p: { dataIndex: number }) => { const d = depts[p.dataIndex]; return `${pct(d.tested / Math.max(1, d.papers))} tested`; } } },
      ],
    };
  }, [depts, dept]);
  return (
    <ChartCard title="Replication evidence by department"
      summary="Outcomes of tested papers per department; the label gives the share of the department's papers that were tested at all."
      source="FLoRA replication links. Placeholder data."
      table={{ caption: 'Replication evidence by department', columns: ['Department', 'Papers', 'Tested', 'Held up', 'Mixed', 'Did not'],
        rows: depts.map(d => [d.name, fmt(d.papers), `${d.tested} (${pct(d.tested / Math.max(1, d.papers))})`, d.outcomes.success, d.outcomes.mixed, d.outcomes.failed]) }}>
      <Chart build={build} height={Math.max(200, depts.length * 52 + 70)} label="Replication outcomes of tested papers by department, with the share tested." />
    </ChartCard>
  );
}

/** Open-science practice over time for the current scope. */
export function InstOpenTrend({ s }: { s: InstitutionStats }) {
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const years = s.open.filter(y => y.n >= 5);
    const line = (name: string, key: 'oa' | 'prereg' | 'data' | 'code', color: string, type: unknown, d: number) => ({
      type: 'line', name, smooth: 0.3, showSymbol: false, lineStyle: { color, width: 2.5, type }, itemStyle: { color },
      emphasis: { focus: 'series' }, animationDuration: 1300, animationDelay: d, data: years.map(y => Math.round(y[key] * 100)),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: years.map(y => String(y.year)), boundaryGap: false, ...ax },
      yAxis: { type: 'value', min: 0, max: 100, ...ax, axisLabel: { ...ax.axisLabel, formatter: '{value}%' } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', valueFormatter: (v: number) => `${v}%` },
      series: [line('Open access', 'oa', c.success, 'solid', 0), line('Preregistered', 'prereg', c.primary, 'dashed', 150), line('Open data', 'data', c.foundational, 'dotted', 300), line('Open code', 'code', c.meta, [8, 4, 2, 4], 450)],
    };
  }, [s]);
  return (
    <ChartCard title="Open-science practice over time"
      summary={`Share of ${s.scopeName}'s papers using each practice (three-year window).`}
      table={{ caption: 'Open-science practice by year', columns: ['Year', 'Open access', 'Preregistered', 'Open data', 'Open code', 'Papers'],
        rows: s.open.filter(y => y.n >= 5).map(y => [y.year, pct(y.oa), pct(y.prereg), pct(y.data), pct(y.code), y.n]) }}>
      <Chart build={build} height={280} label="Open-science practice over time." />
    </ChartCard>
  );
}

/** Papers per year, stacked by department. */
export function InstOutput({ s }: { s: InstitutionStats }) {
  const names = useMemo(() => [...s.perYearByDept.keys()], [s]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const order = s.departments.map(d => d.name);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 8, top: 44, bottom: 48, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 14, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: s.years.map(String), boundaryGap: false, ...ax },
      yAxis: { type: 'value', name: 'Papers', ...ax },
      dataZoom: [{ type: 'slider', height: 16, bottom: 8, borderColor: c.border, fillerColor: c.primaryFaint, textStyle: { color: c.muted }, handleStyle: { color: c.raised, borderColor: c.primary } }, { type: 'inside' }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis' },
      series: names.map((n, i) => {
        const col = deptColor(c, order.indexOf(n), n === 'Unassigned' ? 'unassigned' : n);
        return { type: 'line', name: n, stack: 'p', smooth: 0.3, showSymbol: false, lineStyle: { width: 1, color: col }, itemStyle: { color: col },
          areaStyle: { color: col, opacity: 0.75 }, emphasis: { focus: 'series' }, animationDuration: 1200, animationDelay: i * 150, data: s.perYearByDept.get(n) };
      }),
    };
  }, [s, names]);
  return (
    <ChartCard title="Papers per year by department"
      summary={`${fmt(s.papers)} papers. Toggle departments in the legend; drag the slider to zoom.`}
      source="OpenAlex works. Placeholder data."
      table={{ caption: 'Papers per year by department', columns: ['Year', ...names], rows: s.years.map((y, i) => [y, ...names.map(n => s.perYearByDept.get(n)![i])]) }}>
      <Chart build={build} height={300} label="Papers per year, stacked by department." />
    </ChartCard>
  );
}

/** Institutions this one co-publishes with; ones with a page are clickable. */
export function Partners({ profile }: { profile: InstitutionProfile }) {
  const nav = useNavigate();
  const ps = profile.partners;
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    return {
      ...baseOption(c),
      grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', name: 'Co-authored papers', ...ax },
      yAxis: { type: 'category', data: ps.map(p => `${p.name} (${p.country})`), inverse: true, ...ax, axisTick: { show: false }, axisLabel: { ...ax.axisLabel, color: c.text } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { dataIndex: number }) => { const x = ps[p.dataIndex]; return `<b>${x.name}</b><br/>${x.papers} co-authored papers${x.institutionId ? '<br/><i>Select to open its page</i>' : ''}`; } },
      series: [{ type: 'bar', barWidth: 14, cursor: 'pointer', animationDelay: (i: number) => i * 90,
        data: ps.map(p => ({ value: p.papers, itemStyle: { color: p.institutionId ? c.primary : c.faint, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: 'right', color: c.text, fontSize: 11, fontWeight: 600 } }],
    };
  }, [ps]);
  const onClick = useCallback((p: ChartClick) => { const x = p.dataIndex != null ? ps[p.dataIndex] : null; if (x?.institutionId) nav(`/institution/${x.institutionId}`); }, [ps, nav]);
  return (
    <ChartCard title="Collaborating institutions"
      summary="Co-authored papers with each partner. Maroon partners have their own page: select one to open it."
      source="OpenAlex authorships. Placeholder data."
      table={{ caption: 'Collaborating institutions', columns: ['Institution', 'Country', 'Co-authored papers'], rows: ps.map(p => [p.name, p.country, p.papers]) }}>
      <Chart build={build} height={Math.max(160, ps.length * 40 + 30)} onClick={onClick} label={`Collaborating institutions: ${ps.map(p => `${p.name} ${p.papers}`).join(', ')}.`} />
    </ChartCard>
  );
}
