import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { AuthorProfile } from '../../data/types';
import { getInstitution } from '../../data';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

/** Co-author network: the author at the centre, co-authors sized by shared papers, linked when they co-publish. */
function CoauthorGraph({ profile }: { profile: AuthorProfile }) {
  const nav = useNavigate();
  const graph = useMemo(() => {
    const shared = new Map<string, number>();
    const pair = new Map<string, number>();
    for (const w of profile.works) {
      w.coauthorIds.forEach(id => shared.set(id, (shared.get(id) ?? 0) + 1));
      for (let i = 0; i < w.coauthorIds.length; i++) for (let j = i + 1; j < w.coauthorIds.length; j++) {
        const k = [w.coauthorIds[i], w.coauthorIds[j]].sort().join('|');
        pair.set(k, (pair.get(k) ?? 0) + 1);
      }
    }
    const nodes = profile.coauthors.filter(c => shared.has(c.id)).map(c => ({ ...c, shared: shared.get(c.id)! }));
    return { nodes, pair, max: Math.max(1, ...nodes.map(n => n.shared)) };
  }, [profile]);

  const build = useCallback((c: Colors) => {
    const top = new Set([...graph.nodes].sort((a, b) => b.shared - a.shared).slice(0, 8).map(n => n.id));
    return {
      ...baseOption(c),
      tooltip: { ...baseOption(c).tooltip, formatter: (p: { dataType: string; data: { name: string; shared?: number; inst?: string; hasProfile?: boolean; value?: number } }) =>
        p.dataType === 'edge' ? `${p.data.value} shared paper${p.data.value === 1 ? '' : 's'}`
          : p.data.shared == null ? `<b>${p.data.name}</b>`
          : `<b>${p.data.name}</b><br/>${p.data.shared} shared paper${p.data.shared === 1 ? '' : 's'}<br/><span style="color:${c.muted}">${p.data.inst}</span>${p.data.hasProfile ? '<br/><i>Select to open their X-ray</i>' : ''}` },
      series: [{
        type: 'graph', layout: 'force', roam: true, draggable: true, cursor: 'pointer',
        force: { repulsion: 340, edgeLength: [90, 180], gravity: 0.1, friction: 0.15 },
        animationDurationUpdate: 600,
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        label: { show: false, position: 'right', color: c.text, fontFamily: c.fontBody, fontSize: 11 },
        lineStyle: { color: c.border, curveness: 0.12, opacity: 0.8 },
        data: [
          { id: profile.author.id, name: profile.author.name, symbolSize: 34, fixed: false,
            itemStyle: { color: c.primary, borderColor: c.raised, borderWidth: 3 }, label: { show: true, fontWeight: 700, position: 'bottom' } },
          ...graph.nodes.map(n => ({
            id: n.id, name: n.name, shared: n.shared, hasProfile: n.hasProfile, inst: getInstitution(n.institutionId)?.name ?? '',
            symbolSize: 8 + (n.shared / graph.max) * 22,
            itemStyle: n.hasProfile ? { color: c.primary, borderColor: c.raised, borderWidth: 2 } : { color: c.faint, borderColor: c.raised, borderWidth: 1 },
            label: { show: top.has(n.id) || n.hasProfile, fontWeight: n.hasProfile ? 700 : 400 },
          })),
        ],
        links: [
          ...graph.nodes.map(n => ({ source: profile.author.id, target: n.id, value: n.shared, lineStyle: { width: 0.6 + (n.shared / graph.max) * 3.5 } })),
          ...[...graph.pair.entries()].map(([k, v]) => { const [a, b] = k.split('|'); return { source: a, target: b, value: v, lineStyle: { width: 0.5, opacity: 0.4 } }; }),
        ],
      }],
    };
  }, [graph, profile]);
  const onClick = useCallback((p: ChartClick) => {
    const d = p.data as { id?: string; hasProfile?: boolean } | undefined;
    if (d?.hasProfile && d.id && d.id !== profile.author.id) nav(`/author/${d.id}`);
  }, [nav, profile]);
  const withProfile = graph.nodes.filter(n => n.hasProfile);
  return (
    <ChartCard className="span-8" title="Co-author network"
      summary={`${graph.nodes.length} co-authors. Node size shows shared papers; lines join co-authors who also published together. ${withProfile.length ? `Maroon nodes have their own X-ray: select one to open it.` : ''} Drag nodes, scroll to zoom.`}
      source="OpenAlex authorships. Placeholder data."
      table={{ caption: 'Co-authors', columns: ['Co-author', 'Shared papers', 'Institution', 'X-ray'],
        rows: [...graph.nodes].sort((a, b) => b.shared - a.shared).map(n => [n.name, n.shared, getInstitution(n.institutionId)?.name ?? '', n.hasProfile ? 'Yes' : '']) }}>
      <Chart build={build} height={380} onClick={onClick} label={`Co-author network with ${graph.nodes.length} co-authors.`} />
    </ChartCard>
  );
}

/** Where the author has worked, as a timeline. */
function AffiliationTimeline({ profile }: { profile: AuthorProfile }) {
  const rows = useMemo(() => profile.affiliations.map(a => ({ ...a, inst: getInstitution(a.institutionId), end: a.to ?? 2025 })), [profile]);
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const min = Math.min(...rows.map(r => r.from)) - 1;
    return {
      ...baseOption(c),
      // Institution and role sit above each bar, so the plot keeps the card's full width.
      // Explicit margins: legacy containLabel still reserves space for the hidden category labels.
      grid: { left: 12, right: 20, top: 22, bottom: 26 },
      xAxis: { type: 'value', min, max: 2026, interval: Math.max(2, Math.round((2026 - min) / 5)), ...ax, axisLabel: { ...ax.axisLabel, formatter: (v: number) => String(v) } },
      yAxis: { type: 'category', data: rows.map(r => r.inst?.name ?? r.institutionId), inverse: true, show: false },
      tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { dataIndex: number }) => { const r = rows[p.dataIndex]; return `<b>${r.inst?.name}</b><br/>${r.role}<br/>${r.department}<br/>${r.from}–${r.to ?? 'present'}`; } },
      series: [
        // Absolute years: an invisible bar up to the start year, then the tenure.
        { type: 'bar', stack: 't', silent: true, itemStyle: { color: 'transparent' }, data: rows.map(r => r.from), barWidth: 14 },
        { type: 'bar', stack: 't', barWidth: 14, animationDelay: (i: number) => i * 200, animationDuration: 1000,
          data: rows.map(r => ({ value: r.end - r.from, itemStyle: { color: r.to === null ? c.primary : c.primaryBorder, borderRadius: 4 } })),
          label: { show: true, position: [0, -18], align: 'left', color: c.text, fontSize: 11, fontFamily: c.fontBody,
            formatter: (p: { dataIndex: number }) => { const r = rows[p.dataIndex]; return `{b|${r.inst?.name ?? ''}} {m|${r.from}–${r.to ?? 'now'}}`; },
            rich: { b: { fontWeight: 700, color: c.text, fontSize: 11, fontFamily: c.fontBody }, m: { color: c.muted, fontSize: 10, fontFamily: c.fontBody } } } },
      ],
    };
  }, [rows]);
  return (
    <ChartCard className="span-4" title="Where they have worked"
      summary={`${rows.length} affiliation${rows.length > 1 ? 's' : ''}; the current one is in maroon.`}
      table={{ caption: 'Affiliations', columns: ['Institution', 'Role', 'Department', 'Years'], rows: rows.map(r => [r.inst?.name ?? '', r.role, r.department, `${r.from}–${r.to ?? 'present'}`]) }}>
      <Chart build={build} height={Math.max(150, rows.length * 62 + 50)} label={`Affiliation timeline: ${rows.map(r => `${r.inst?.name} ${r.from} to ${r.to ?? 'present'}`).join('; ')}.`} />
    </ChartCard>
  );
}

export function NetworkSection({ profile }: { profile: AuthorProfile }) {
  return (
    <div className="bento">
      <CoauthorGraph profile={profile} />
      <AffiliationTimeline profile={profile} />
    </div>
  );
}
