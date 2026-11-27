import { useCallback } from 'react';
import type { AuthorProfile } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import type { AuthorStats } from '../../lib/authorStats';
import { fmt } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

/** Papers per year by author position, with citations received per year. */
function OutputChart({ profile, s }: { profile: AuthorProfile; s: AuthorStats }) {
  const build = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const cites = new Map(profile.citationsByYear.map(y => [y.year, y.citations]));
    const bar = (name: string, key: 'first' | 'middle' | 'last', color: string, d: number) => ({
      type: 'bar', name, stack: 'p', barMaxWidth: 18, itemStyle: { color }, emphasis: { focus: 'series' },
      animationDelay: (i: number) => d + i * 25, data: s.perYear.map(y => y[key]),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 8, top: 44, bottom: 48, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: s.years.map(String), ...ax },
      yAxis: [
        { type: 'value', name: 'Papers', minInterval: 1, ...ax },
        { type: 'value', name: 'Citations', ...ax, splitLine: { show: false } },
      ],
      dataZoom: [{ type: 'slider', height: 16, bottom: 8, borderColor: c.border, fillerColor: c.primaryFaint, textStyle: { color: c.muted }, handleStyle: { color: c.raised, borderColor: c.primary } }, { type: 'inside' }],
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [
        bar('First author', 'first', c.primary, 0),
        bar('Middle author', 'middle', c.primaryBorder, 120),
        bar('Last author', 'last', c.foundational, 240),
        { type: 'line', name: 'Citations received', yAxisIndex: 1, smooth: true, symbol: 'none', lineStyle: { color: c.text2, width: 2 },
          itemStyle: { color: c.text2 }, areaStyle: { color: c.text, opacity: 0.05 }, animationDuration: 1400, animationDelay: 400,
          data: s.years.map(y => cites.get(y) ?? 0) },
      ],
    };
  }, [profile, s]);
  const shareLast = s.positions.last / Math.max(1, s.works.length);
  return (
    <ChartCard className="span-8" title="Papers and citations per year"
      summary={`${fmt(s.works.length)} papers: ${s.positions.first} as first author, ${s.positions.middle} middle, ${s.positions.last} last${shareLast > 0.35 ? ' (last authorship usually signals a lab lead)' : ''}. Toggle series in the legend; drag to zoom.`}
      source="OpenAlex works and citations. Placeholder data."
      table={{ caption: 'Papers per year by author position', columns: ['Year', 'First', 'Middle', 'Last', 'Citations received'],
        rows: s.perYear.map(y => [y.year, y.first, y.middle, y.last, profile.citationsByYear.find(c => c.year === y.year)?.citations ?? 0]) }}>
      <Chart build={build} height={300} label={`Papers per year by author position, and citations received per year. ${s.works.length} papers in total.`} />
    </ChartCard>
  );
}

/** Topics as a treemap: area = papers, shade = citations. Select a topic to filter the paper list. */
function TopicsTreemap({ s, onTopic }: { s: AuthorStats; onTopic: (t: string) => void }) {
  const build = useCallback((c: Colors) => {
    const maxCites = Math.max(1, ...s.topics.map(t => t.citations / t.n));
    return {
      ...baseOption(c),
      tooltip: { ...baseOption(c).tooltip, formatter: (p: { name: string; value: number; data: { cites: number } }) =>
        `<b>${p.name}</b><br/>${p.value} papers · ${fmt(p.data.cites)} citations<br/><i>Select to filter the paper list</i>` },
      series: [{
        type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, width: '100%', height: '100%', top: 0, left: 0,
        animationDuration: 900, animationEasing: 'cubicOut', cursor: 'pointer',
        itemStyle: { borderColor: c.raised, borderWidth: 3, gapWidth: 3, borderRadius: 6 },
        label: { show: true, color: '#fff', fontFamily: c.fontBody, fontWeight: 700, fontSize: 12, formatter: '{b}\n{c} papers', lineHeight: 16 },
        upperLabel: { show: false },
        emphasis: { itemStyle: { borderColor: c.text } },
        data: s.topics.map(t => ({
          name: t.name, value: t.n, cites: t.citations,
          // Darker = more cited per paper; one hue so the shade reads as an amount.
          itemStyle: { color: c.primary, opacity: 0.45 + 0.55 * (t.citations / t.n / maxCites) },
        })),
      }],
    };
  }, [s]);
  const onClick = useCallback((p: ChartClick) => { if (p.name) onTopic(p.name); }, [onTopic]);
  return (
    <ChartCard className="span-4" title="Topics"
      summary="Area shows papers; darker tiles are cited more per paper. Select a topic to filter the paper list."
      table={{ caption: 'Topics', columns: ['Topic', 'Papers', 'Citations'], rows: s.topics.map(t => [t.name, t.n, fmt(t.citations)]) }}>
      <Chart build={build} height={300} onClick={onClick} label={`Topics by number of papers: ${s.topics.map(t => `${t.name} ${t.n}`).join(', ')}.`} />
    </ChartCard>
  );
}

export function OutputSection({ profile, s, onTopic }: { profile: AuthorProfile; s: AuthorStats; onTopic: (t: string) => void }) {
  return (
    <div className="bento">
      <OutputChart profile={profile} s={s} />
      <TopicsTreemap s={s} onTopic={onTopic} />
    </div>
  );
}
