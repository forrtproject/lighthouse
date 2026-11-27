import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { listPapers } from '../data';
import type { Paper } from '../data/types';
import { baseOption, type Colors } from '../lib/echarts';
import { computeTrust, type TrustResult } from '../lib/trust';
import { Chart } from '../components/Chart';
import { DoiForm, Shell } from '../components/Shell';

const bandColor = (c: Colors, s: number) => (s >= 75 ? c.success : s >= 50 ? c.inconclusive : s >= 25 ? c.mixed : c.failed);

/** Mini radial bar of the six dimensions, with the score in the middle. */
function MiniTrust({ trust }: { trust: TrustResult }) {
  const build = useCallback((c: Colors) => ({
    ...baseOption(c),
    polar: { radius: ['34%', '92%'] },
    angleAxis: { max: 100, show: false, startAngle: 90 },
    radiusAxis: { type: 'category', data: trust.dimensions.map(d => d.short), show: false },
    tooltip: { ...baseOption(c).tooltip, trigger: 'item', formatter: (p: { name: string; value: number; dataIndex: number }) =>
      trust.dimensions[p.dataIndex].assessed ? `<b>${p.name}</b>: ${p.value}` : `<b>${p.name}</b>: no evidence yet` },
    series: [{
      type: 'bar', coordinateSystem: 'polar', roundCap: true, barWidth: 6,
      showBackground: true, backgroundStyle: { color: c.borderLight },
      animationDelay: (i: number) => 200 + i * 90,
      data: trust.dimensions.map(d => ({ name: d.short, value: d.assessed ? d.score : 0, itemStyle: { color: d.assessed ? bandColor(c, d.score!) : c.borderLight } })),
    }],
    graphic: [{ type: 'text', left: 'center', top: 'middle', silent: true,
      style: { text: String(trust.score), fill: c.text, fontFamily: c.fontDisplay, fontWeight: 700, fontSize: 22, align: 'center' } }],
  }), [trust]);
  return <Chart build={build} height={150} label={`Trust ${trust.score} of 100 across six dimensions.`} />;
}

export default function HomePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  useEffect(() => { listPapers().then(setPapers); document.title = 'Lighthouse Beta'; }, []);
  const trusts = useMemo(() => papers.map(computeTrust), [papers]);
  return (
    <Shell search={false}>
      <section className="home-hero">
        <span className="hero-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="9 12 11 14 15 10" /></svg>
        </span>
        <h1>Can you trust this paper?</h1>
        <p className="lede">Paste a DOI to see its trust score and every piece of evidence behind it: replications, reanalyses, statistical checks, open-science practices, PubPeer discussion and how the field cites it.</p>
        <DoiForm size="large" autoFocus />
      </section>

      <section className="home-section">
        <div className="section-head">
          <span className="eyebrow">Sample papers</span>
          <h2>Three invented papers, three different stories</h2>
          <p>Each ring shows the six trust dimensions; hover for values, select a card for the full profile.</p>
        </div>
        <ul className="sample-grid">
          {papers.map((p, i) => {
            const t = trusts[i];
            return (
              <li key={p.doi} className="sample-card card" style={{ animationDelay: `${i * 120}ms` }}>
                <MiniTrust trust={t} />
                <div className="sc-body">
                  <span className={`band-chip band-${t.band.replace(' ', '-').toLowerCase()}`}>{t.band} trust{t.retracted ? ' · retracted' : ''}</span>
                  <Link to={`/paper/${p.doi}`} className="sc-title">{p.title}</Link>
                  <span className="sc-meta">{p.year} · {p.replications.length} replications · {p.pubpeer.comments.length} PubPeer comments</span>
                  <span className="mono sc-doi">{p.doi}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="home-section">
        <div className="section-head">
          <span className="eyebrow">On every paper page</span>
          <h2>What a researcher needs to judge a finding</h2>
        </div>
        <ul className="feature-grid">
          <li><b>Trust score</b><span>Six dimensions, their weights, and every reason, with how much evidence the score rests on.</span></li>
          <li><b>Evidence timeline</b><span>Publication, replications, reanalyses, critiques, notices and comments on one zoomable timeline.</span></li>
          <li><b>Effect sizes</b><span>Forest plot of the original against each replication, with pooled and meta-analytic estimates.</span></li>
          <li><b>Statistical checks</b><span>Reported p-values recomputed from test statistics, and the original study's power.</span></li>
          <li><b>Transparency</b><span>Preregistration, data, code, materials, open access and conflict-of-interest statements.</span></li>
          <li><b>PubPeer</b><span>Positive, neutral and critical comments over time, by topic, with author replies.</span></li>
          <li><b>Citations</b><span>How often, and how, the paper is cited, before and after failed replications or retraction.</span></li>
          <li><b>Authors</b><span>Each author links to their X-ray: output, replication footprint, open-science practice and network.</span></li>
        </ul>
      </section>
    </Shell>
  );
}
