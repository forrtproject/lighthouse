import { useCallback, useMemo, useState } from 'react';
import type { Paper, PubPeerSentiment, PubPeerTopic } from '../../data/types';
import { axisStyle, baseOption, type Colors } from '../../lib/echarts';
import { SENTIMENT_LABEL, TOPIC_LABEL, formatDate, plural } from '../../lib/format';
import { Chart, type ChartClick } from '../Chart';
import { ChartCard } from '../ChartCard';

type Filter = { sentiment: PubPeerSentiment | 'all' | 'author'; topic: PubPeerTopic | null; year: number | null };

export function PubPeerSection({ paper }: { paper: Paper }) {
  const comments = paper.pubpeer.comments;
  const [f, setF] = useState<Filter>({ sentiment: 'all', topic: null, year: null });

  const years = useMemo(() => {
    if (!comments.length) return [];
    const ys = comments.map(c => +c.date.slice(0, 4));
    const out: number[] = [];
    for (let y = Math.min(...ys, paper.year); y <= Math.max(...ys); y++) out.push(y);
    return out;
  }, [comments, paper.year]);

  // Diverging bars per year: positive and neutral above zero, critical below, author replies as markers.
  const buildYears = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const count = (y: number, s: PubPeerSentiment) => comments.filter(x => !x.isAuthorResponse && x.sentiment === s && +x.date.slice(0, 4) === y).length;
    const replies = years.map(y => comments.filter(x => x.isAuthorResponse && +x.date.slice(0, 4) === y).length);
    const dim = (y: number) => (f.year != null && f.year !== y ? 0.3 : 1);
    const bar = (name: string, s: PubPeerSentiment, color: string, sign: 1 | -1, delay: number) => ({
      type: 'bar', name, stack: sign > 0 ? 'up' : 'down', barMaxWidth: 26, cursor: 'pointer',
      animationDelay: (i: number) => delay + i * 50,
      emphasis: { focus: 'series' },
      itemStyle: { color, borderRadius: sign > 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] },
      data: years.map(y => ({ value: sign * count(y, s), itemStyle: { opacity: dim(y) } })),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: c.text2, fontFamily: c.fontBody }, inactiveColor: c.faint },
      xAxis: { type: 'category', data: years.map(String), ...ax, axisLabel: { ...ax.axisLabel, interval: years.length > 12 ? 1 : 0 } },
      yAxis: { type: 'value', minInterval: 1, ...ax, axisLabel: { ...ax.axisLabel, formatter: (v: number) => String(Math.abs(v)) }, name: '← critical · positive →', nameLocation: 'middle', nameGap: 28 },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } },
        formatter: (ps: { axisValue: string; seriesName: string; value: number; color: string }[]) =>
          `<b>${ps[0].axisValue}</b><br/>` + ps.filter(p => p.value).map(p => `<span style="color:${p.color}">●</span> ${p.seriesName}: ${Math.abs(p.value)}`).join('<br/>')
          + '<br/><i>Select to filter comments</i>' },
      series: [
        bar('Positive', 'positive', c.positive, 1, 0),
        bar('Neutral', 'neutral', c.neutral, 1, 150),
        bar('Critical', 'critical', c.critical, -1, 300),
        { type: 'scatter', name: 'Author reply', symbol: 'roundRect', symbolSize: 12, itemStyle: { color: c.primary, borderColor: c.raised, borderWidth: 1.5 },
          animationDelay: (i: number) => 600 + i * 50,
          data: years.map((_, i) => (replies[i] ? 0 : '-')),
          label: { show: true, position: 'right', color: c.primary, fontSize: 10, formatter: (p: { dataIndex: number }) => (replies[p.dataIndex] > 1 ? `×${replies[p.dataIndex]}` : '') } },
      ],
    };
  }, [comments, years, f.year]);

  // What the comments are about, split by sentiment.
  const topics = useMemo(() => (Object.keys(TOPIC_LABEL) as PubPeerTopic[])
    .map(t => ({ t, n: comments.filter(c => !c.isAuthorResponse && c.topics.includes(t)).length }))
    .filter(x => x.n).sort((a, b) => a.n - b.n), [comments]);
  const buildTopics = useCallback((c: Colors) => {
    const ax = axisStyle(c);
    const s = (sent: PubPeerSentiment, color: string, d: number) => ({
      type: 'bar', name: SENTIMENT_LABEL[sent], stack: 't', barWidth: 14, cursor: 'pointer',
      animationDelay: (i: number) => d + i * 70, emphasis: { focus: 'series' },
      itemStyle: { color },
      data: topics.map(x => ({ value: comments.filter(cm => !cm.isAuthorResponse && cm.sentiment === sent && cm.topics.includes(x.t)).length,
        itemStyle: { opacity: f.topic && f.topic !== x.t ? 0.3 : 1 } })),
    });
    return {
      ...baseOption(c),
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', minInterval: 1, ...ax },
      yAxis: { type: 'category', data: topics.map(x => TOPIC_LABEL[x.t]), ...ax, axisTick: { show: false }, axisLabel: { ...ax.axisLabel, color: c.text } },
      tooltip: { ...baseOption(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: c.primaryFaint } } },
      series: [s('positive', c.positive, 0), s('neutral', c.neutral, 100), s('critical', c.critical, 200)],
    };
  }, [topics, comments, f.topic]);

  const onYear = useCallback((p: ChartClick) => {
    const y = p.dataIndex != null ? years[p.dataIndex] : null;
    if (y != null) setF(cur => ({ ...cur, year: cur.year === y ? null : y }));
  }, [years]);
  const onTopic = useCallback((p: ChartClick) => {
    const t = p.dataIndex != null ? topics[p.dataIndex]?.t : null;
    if (t) setF(cur => ({ ...cur, topic: cur.topic === t ? null : t }));
  }, [topics]);

  const shown = comments.filter(c =>
    (f.sentiment === 'all' || (f.sentiment === 'author' ? c.isAuthorResponse : !c.isAuthorResponse && c.sentiment === f.sentiment))
    && (!f.topic || c.topics.includes(f.topic))
    && (f.year == null || +c.date.slice(0, 4) === f.year));

  const n = (s: PubPeerSentiment) => comments.filter(c => !c.isAuthorResponse && c.sentiment === s).length;
  const replies = comments.filter(c => c.isAuthorResponse).length;

  if (!comments.length) {
    return <section className="card"><div className="empty"><p><b>No PubPeer comments yet.</b> PubPeer hosts public post-publication review.</p><a className="btn-secondary" href="https://pubpeer.com" target="_blank" rel="noopener">Open PubPeer</a></div></section>;
  }
  return (
    <div className="pubpeer">
      <div className="grid-2 wide-left">
        <ChartCard
          title="PubPeer comments over time"
          summary={`${plural(comments.length - replies, 'comment')}: ${n('positive')} positive, ${n('neutral')} neutral, ${n('critical')} critical. The authors replied ${plural(replies, 'time')}. Select a year to filter the comments below.`}
          source="PubPeer. Sentiment and topics are machine-coded and reviewed. Placeholder data."
          table={{ caption: 'PubPeer comments per year', columns: ['Year', 'Positive', 'Neutral', 'Critical', 'Author replies'],
            rows: years.map(y => [y, ...(['positive', 'neutral', 'critical'] as const).map(s => comments.filter(c => !c.isAuthorResponse && c.sentiment === s && +c.date.slice(0, 4) === y).length),
              comments.filter(c => c.isAuthorResponse && +c.date.slice(0, 4) === y).length]) }}
        >
          <Chart build={buildYears} height={260} onClick={onYear} label="PubPeer comments per year by sentiment. Select a year to filter the comment list." />
        </ChartCard>
        <ChartCard
          title="What the comments are about"
          summary="Select a topic to filter the comments."
          table={{ caption: 'PubPeer comment topics', columns: ['Topic', 'Comments'], rows: [...topics].reverse().map(x => [TOPIC_LABEL[x.t], x.n]) }}
        >
          <Chart build={buildTopics} height={260} onClick={onTopic} label="Number of PubPeer comments per topic, split by sentiment." />
        </ChartCard>
      </div>

      <section className="card comments" aria-labelledby="comments-title">
        <header className="card-head">
          <div className="card-titles">
            <h3 id="comments-title">Comments</h3>
            <p className="card-summary" aria-live="polite">
              Showing {shown.length} of {comments.length}
              {f.year != null && <> from <b>{f.year}</b></>}
              {f.topic && <> about <b>{TOPIC_LABEL[f.topic].toLowerCase()}</b></>}.
              {(f.year != null || f.topic || f.sentiment !== 'all') && (
                <button type="button" className="link-btn" onClick={() => setF({ sentiment: 'all', topic: null, year: null })}>Clear filters</button>
              )}
            </p>
          </div>
          <div className="seg" role="group" aria-label="Filter by sentiment">
            {(['all', 'positive', 'neutral', 'critical', 'author'] as const).map(s => (
              <button key={s} type="button" aria-pressed={f.sentiment === s} onClick={() => setF(cur => ({ ...cur, sentiment: s }))}>
                {s === 'all' ? 'All' : s === 'author' ? 'Author replies' : SENTIMENT_LABEL[s]}
              </button>
            ))}
          </div>
        </header>
        {shown.length ? (
          <ol className="comment-list">
            {shown.map((c, i) => (
              <li key={c.id} className={`comment s-${c.isAuthorResponse ? 'author' : c.sentiment}`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="c-meta">
                  <span className="c-badge">{c.isAuthorResponse ? 'Author reply' : SENTIMENT_LABEL[c.sentiment]}</span>
                  <span className="c-who">{c.commenter}</span>
                  <time dateTime={c.date}>{formatDate(c.date)}</time>
                </div>
                <p>“{c.excerpt}”</p>
                <div className="c-topics">{c.topics.map(t => <span key={t}>{TOPIC_LABEL[t]}</span>)}</div>
              </li>
            ))}
          </ol>
        ) : <div className="empty"><p>No comments match these filters.</p></div>}
        <footer className="card-source">Excerpts only. Read the full thread on <a href={paper.pubpeer.url}>PubPeer</a>.</footer>
      </section>
    </div>
  );
}
