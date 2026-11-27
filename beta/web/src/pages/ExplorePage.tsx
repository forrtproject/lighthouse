import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChartScatter, Funnel, GlobeHemisphereWest, Info, Table, Thermometer, X } from '@phosphor-icons/react';
import { listInstitutionProfiles } from '../data';
import type { InstitutionProfile } from '../data/types';
import { COUNTRY_NAME, MIN_TESTED, applyFilters, buildRecords, groupBy, total } from '../lib/aggregates';
import { fmt, pct, plural } from '../lib/format';
import type { Answer, Tone } from '../lib/signals';
import { Shell } from '../components/Shell';
import { SectionRail, type RailItem } from '../components/SectionRail';
import { SectionHeader } from '../components/SectionHeader';
import { ToneIcon } from '../components/Tone';
import { EvidenceLandscape, FieldFlows, NumbersTable, OpenHeatmap, WorldMap, type Metric } from '../components/explore/ExploreCharts';

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<InstitutionProfile[] | null>(null);
  useEffect(() => { listInstitutionProfiles().then(setProfiles); document.title = 'Explore the evidence · Lighthouse Beta'; }, []);
  if (!profiles) return <Shell><div className="page"><div className="skeleton" style={{ height: 380 }} /></div></Shell>;
  return <Shell><Explore profiles={profiles} /></Shell>;
}

function Explore({ profiles }: { profiles: InstitutionProfile[] }) {
  // Filters live in the URL (?country=DE&field=Memory) so any view can be shared.
  const [params, setParams] = useSearchParams();
  const country = params.get('country'), field = params.get('field');
  const setFilter = useCallback((k: 'country' | 'field', v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next);
  }, [params, setParams]);

  const all = useMemo(() => buildRecords(profiles), [profiles]);
  const rs = useMemo(() => applyFilters(all, { country, field }), [all, country, field]);
  // The map always shows every country (filtered by field only), so the selected one stays in context.
  const countries = useMemo(() => groupBy(applyFilters(all, { country: null, field }), 'country'), [all, field]);
  const fieldsAll = useMemo(() => groupBy(applyFilters(all, { country, field: null }), 'field'), [all, country]);
  const t = useMemo(() => total(rs), [rs]);
  const [metric, setMetric] = useState<Metric>('heldUp');
  const [dim, setDim] = useState<'country' | 'institution'>('institution');

  const scopeText = [country && COUNTRY_NAME[country], field].filter(Boolean).join(' · ') || 'All countries and fields';
  const heldTone: Tone = t.heldUp == null ? 'none' : t.heldUp >= 2 / 3 ? 'good' : t.heldUp >= 1 / 3 ? 'warn' : 'bad';
  const held: Answer = t.heldUp == null
    ? { tone: 'none', verdict: 'Too few tested', text: `Only ${fmt(Math.round(t.tested))} tested papers in this selection; fewer than ${MIN_TESTED} is too few to compare.` }
    : { tone: heldTone, verdict: `${pct(t.heldUp)} held up`, text: `${fmt(Math.round(t.tested))} of ${fmt(Math.round(t.papers))} papers have replication evidence (${pct(t.coverage)}); ${pct(t.heldUp)} of those held up.` };
  const countryGroups = countries.filter(g => !g.tooFew && g.heldUp != null).sort((a, b) => b.heldUp! - a.heldUp!);
  const mapAnswer: Answer = { tone: 'none', verdict: plural(countries.length, 'country', 'countries'),
    text: countryGroups.length >= 2
      ? `Among countries with enough tested papers, the share that held up ranges from ${pct(countryGroups[countryGroups.length - 1].heldUp!)} to ${pct(countryGroups[0].heldUp!)}. Coverage is low everywhere, so treat differences with care.`
      : 'Too few countries have enough tested papers to compare.' };
  const fieldsTested = fieldsAll.filter(f => !f.tooFew && f.heldUp != null).sort((a, b) => b.heldUp! - a.heldUp!);
  const fieldAnswer: Answer = fieldsTested.length >= 2
    ? { tone: 'none', verdict: `${fieldsTested.length} comparable fields`, text: `${fieldsTested[0].label} has the highest share held up (${pct(fieldsTested[0].heldUp!)}), ${fieldsTested[fieldsTested.length - 1].label} the lowest (${pct(fieldsTested[fieldsTested.length - 1].heldUp!)}).` }
    : { tone: 'none', verdict: 'Too few tested', text: 'Not enough tested papers per field in this selection to compare fields.' };
  const openTone: Tone = t.open >= 0.5 ? 'good' : t.open >= 0.25 ? 'warn' : 'bad';

  const rail: RailItem[] = [
    { id: 'map', label: 'By country', icon: GlobeHemisphereWest },
    { id: 'fields', label: 'By field', icon: Funnel },
    { id: 'practice', label: 'Practice over time', icon: Thermometer, tone: openTone },
    { id: 'landscape', label: 'Landscape', icon: ChartScatter },
    { id: 'numbers', label: 'All the numbers', icon: Table },
  ];
  const tiles = [
    { label: 'Countries', value: String(new Set(rs.map(r => r.country)).size), caption: 'in the sample', tone: 'none' as Tone, verdict: '' },
    { label: 'Institutions', value: String(t.institutions), caption: 'with researchers here', tone: 'none' as Tone, verdict: '' },
    { label: 'Researchers', value: fmt(t.researchers), caption: 'never ranked', tone: 'none' as Tone, verdict: '' },
    { label: 'Papers', value: fmt(Math.round(t.papers)), caption: `${fmt(Math.round(t.citations))} citations`, tone: 'none' as Tone, verdict: '' },
    { label: 'Held up?', value: t.heldUp == null ? '—' : pct(t.heldUp), caption: `${pct(t.coverage)} of papers tested`, tone: held.tone, verdict: t.heldUp == null ? 'Too few' : held.tone === 'good' ? 'Mostly' : held.tone === 'warn' ? 'Mixed' : 'Mostly not' },
    { label: 'Open science', value: pct(t.open), caption: 'practice use, last 5 years', tone: openTone, verdict: openTone === 'good' ? 'Open' : openTone === 'warn' ? 'Partly' : 'Rarely' },
  ];

  return (
    <div className="page paper-page">
      <section className="hero" aria-label="Aggregate summary">
        <div className="hero-grid">
          <div className="hero-id">
            <span className="eyebrow">Explore the evidence</span>
            <h1 className="hero-title">How research holds up, by country, field and year</h1>
            <p className="hero-venue">{scopeText}</p>
            <div className="scope-row" role="group" aria-label="Active filters">
              {!country && !field && <span className="muted">Select a country on the map or a field in the flow chart to filter everything below.</span>}
              {country && <button type="button" className="filter-chip is-topic" onClick={() => setFilter('country', null)} aria-label={`Remove country filter ${COUNTRY_NAME[country]}`}>Country: {COUNTRY_NAME[country] ?? country} <X size={12} weight="bold" aria-hidden="true" /></button>}
              {field && <button type="button" className="filter-chip is-topic" onClick={() => setFilter('field', null)} aria-label={`Remove field filter ${field}`}>Field: {field} <X size={12} weight="bold" aria-hidden="true" /></button>}
            </div>
            <div className="fair-note" role="note">
              <Info size={18} weight="fill" aria-hidden="true" />
              <p><b>Coverage first.</b> Only a small share of papers anywhere has been replicated, so outcome shares rest on few studies. Groups with fewer than {MIN_TESTED} tested papers are shown in grey and not compared.</p>
            </div>
          </div>
          <aside className="verdict-card" aria-labelledby="agg-title">
            <div className="vc-head"><h2 id="agg-title" className="eyebrow">Replication footprint</h2><span className="vc-meta">{scopeText}</span></div>
            <div className="cov-bar" role="img" aria-label={`${fmt(Math.round(t.tested))} of ${fmt(Math.round(t.papers))} papers tested.`}>
              <span className="cb-seg cb-success" style={{ flexGrow: t.success }} />
              <span className="cb-seg cb-mixed" style={{ flexGrow: t.mixed }} />
              <span className="cb-seg cb-failed" style={{ flexGrow: t.failed }} />
              <span className="cb-seg cb-untested" style={{ flexGrow: Math.max(0, t.papers - t.tested) }} />
            </div>
            <ul className="waffle-legend" aria-hidden="true">
              <li><i className="wf-success" />Held up <b>{fmt(Math.round(t.success))}</b></li>
              <li><i className="wf-mixed" />Mixed <b>{fmt(Math.round(t.mixed))}</b></li>
              <li><i className="wf-failed" />Did not <b>{fmt(Math.round(t.failed))}</b></li>
              <li><i className="wf-untested" />Untested <b>{fmt(Math.round(t.papers - t.tested))}</b></li>
            </ul>
            <p className="vc-pred"><b>{pct(t.coverage)}</b> of {fmt(Math.round(t.papers))} papers have replication evidence.</p>
          </aside>
        </div>
        <ul className="signals" aria-label="Key figures">
          {tiles.map((x, i) => (
            <li key={x.label} style={{ animationDelay: `${150 + i * 70}ms` }}>
              <div className={`signal t-${x.tone}`}>
                <span className="sg-head"><span className="sg-label">{x.label}</span>{x.verdict && <span className="sg-verdict"><ToneIcon tone={x.tone} size={14} />{x.verdict}</span>}</span>
                <span className="sg-value">{x.value}</span>
                <span className="sg-caption">{x.caption}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="paper-layout">
        <SectionRail items={rail} />
        <div className="sections">
          <SectionHeader id="map" question="Where is the evidence?" answer={mapAnswer} />
          <WorldMap countries={countries} metric={metric} setMetric={setMetric} selected={country} onCountry={c => setFilter('country', c)} />

          <SectionHeader id="fields" question="Which fields hold up?" answer={fieldAnswer} />
          <FieldFlows rs={rs} onField={f => setFilter('field', f)} />

          <SectionHeader id="practice" question="How has practice changed?"
            answer={{ tone: openTone, verdict: `${pct(t.open)} open`, text: 'Average use of open access, preregistration, open data and open code in the last five years.' }} />
          <OpenHeatmap rs={rs} />

          <SectionHeader id="landscape" question="Where does evidence rest on little testing?"
            answer={{ tone: 'none', verdict: 'Coverage × outcome', text: 'Bubbles far to the left have little tested work, so their height says little.' }} />
          <EvidenceLandscape rs={rs} dim={dim} setDim={setDim} />

          <SectionHeader id="numbers" question="All the numbers" />
          <NumbersTable rs={rs} />
        </div>
      </div>
    </div>
  );
}
