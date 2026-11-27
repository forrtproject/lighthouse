// ─────────────────────────────────────────────────────────────────────────────
// Aggregates by country, institution, field and year.
//
// Records come from every institution's roster. A researcher with several
// topics contributes their papers split evenly across those topics, so field
// totals add up to the real paper total instead of double-counting.
//
// Small groups mislead: any group with fewer than MIN_TESTED tested papers is
// flagged `tooFew`, and the UI greys it out instead of comparing it.
// ─────────────────────────────────────────────────────────────────────────────
import type { InstitutionProfile } from '../data/types';

export const MIN_TESTED = 10;
const NOW = 2025;

export const COUNTRY_NAME: Record<string, string> = {
  GB: 'United Kingdom', DE: 'Germany', US: 'United States', NL: 'Netherlands', JP: 'Japan', BR: 'Brazil', AT: 'Austria',
};
/** Names as they appear in the Natural Earth geometry. */
export const COUNTRY_GEO: Record<string, string> = { ...COUNTRY_NAME, US: 'United States of America' };

/** One researcher's contribution to one field (weight = 1 / number of their topics). */
interface Rec {
  country: string; institutionId: string; institution: string; field: string; weight: number;
  papers: number; citations: number; tested: number; success: number; mixed: number; failed: number;
  replicationsRun: number; researcher: string;
  years: { year: number; papers: number; oa: number; prereg: number; data: number; code: number }[];
}

export function buildRecords(profiles: InstitutionProfile[]): Rec[] {
  const out: Rec[] = [];
  for (const p of profiles) for (const r of p.researchers) {
    const topics = r.topics.length ? r.topics : ['Other'];
    const w = 1 / topics.length;
    for (const field of topics) {
      out.push({
        country: p.institution.country, institutionId: p.institution.id, institution: p.institution.name, field, weight: w,
        papers: r.papers * w, citations: r.citations * w, tested: r.tested * w,
        success: r.outcomes.success * w, mixed: r.outcomes.mixed * w, failed: r.outcomes.failed * w,
        replicationsRun: r.replicationsRun * w, researcher: r.id, years: r.years,
      });
    }
  }
  return out;
}

export type Dim = 'country' | 'institution' | 'field';
export interface Filters { country: string | null; field: string | null }

export interface Group {
  key: string; label: string;
  researchers: number; institutions: number; papers: number; citations: number;
  tested: number; success: number; mixed: number; failed: number; replicationsRun: number;
  coverage: number;            // tested / papers
  heldUp: number | null;       // success / tested, null when too few
  open: number;                // mean of OA, prereg, data, code shares in the last five years
  tooFew: boolean;
}

export const applyFilters = (rs: Rec[], f: Filters) => rs.filter(r => (!f.country || r.country === f.country) && (!f.field || r.field === f.field));

function recentOpen(rs: Rec[]): number {
  let n = 0, s = 0;
  const seen = new Set<string>();
  for (const r of rs) {
    // Year counts belong to the researcher; weight them like the papers.
    const k = `${r.researcher}|${r.field}`; if (seen.has(k)) continue; seen.add(k);
    for (const y of r.years) if (y.year > NOW - 5) { n += y.papers * r.weight; s += (y.oa + y.prereg + y.data + y.code) / 4 * r.weight; }
  }
  return n ? s / n : 0;
}

function summarise(key: string, label: string, rs: Rec[]): Group {
  const sum = (f: (r: Rec) => number) => rs.reduce((s, r) => s + f(r), 0);
  const tested = sum(r => r.tested), success = sum(r => r.success), papers = sum(r => r.papers);
  const tooFew = tested < MIN_TESTED;
  return {
    key, label,
    researchers: new Set(rs.map(r => r.researcher)).size, institutions: new Set(rs.map(r => r.institutionId)).size,
    papers, citations: sum(r => r.citations), tested, success, mixed: sum(r => r.mixed), failed: sum(r => r.failed),
    replicationsRun: sum(r => r.replicationsRun),
    coverage: papers ? tested / papers : 0, heldUp: tooFew || !tested ? null : success / tested, open: recentOpen(rs), tooFew,
  };
}

export function groupBy(rs: Rec[], dim: Dim): Group[] {
  const m = new Map<string, Rec[]>();
  for (const r of rs) {
    const k = dim === 'country' ? r.country : dim === 'institution' ? r.institutionId : r.field;
    (m.get(k) ?? m.set(k, []).get(k)!).push(r);
  }
  return [...m.entries()].map(([k, list]) => summarise(k,
    dim === 'country' ? (COUNTRY_NAME[k] ?? k) : dim === 'institution' ? list[0].institution : k, list))
    .sort((a, b) => b.papers - a.papers);
}

export const total = (rs: Rec[]) => summarise('all', 'All', rs);

/** Open-science share per year and field (three-year window), for the heatmap. */
export function openByYearField(rs: Rec[], fields: string[], from: number): { years: number[]; cells: [number, number, number, number][] } {
  const years = Array.from({ length: NOW - from + 1 }, (_, i) => from + i);
  const cells: [number, number, number, number][] = [];   // [yearIdx, fieldIdx, share%, papers]
  fields.forEach((f, fi) => {
    const sub = rs.filter(r => r.field === f);
    years.forEach((year, yi) => {
      let n = 0, s = 0;
      for (const r of sub) for (const y of r.years) if (Math.abs(y.year - year) <= 1) { n += y.papers * r.weight; s += (y.oa + y.prereg + y.data + y.code) / 4 * r.weight; }
      if (n >= 3) cells.push([yi, fi, Math.round((s / n) * 100), Math.round(n)]);
    });
  });
  return { years, cells };
}

/** CSV of a grouping, for download. */
export function toCsv(groups: Group[], dim: Dim): string {
  const head = [dim, 'researchers', 'institutions', 'papers', 'citations', 'tested_papers', 'share_tested', 'held_up', 'mixed', 'did_not_hold_up', 'share_held_up', 'open_science_recent', 'too_few_to_compare'];
  const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = groups.map(g => [q(g.label), g.researchers, g.institutions, Math.round(g.papers), Math.round(g.citations), Math.round(g.tested),
    g.coverage.toFixed(3), Math.round(g.success), Math.round(g.mixed), Math.round(g.failed), g.heldUp == null ? '' : g.heldUp.toFixed(3), g.open.toFixed(3), g.tooFew]);
  return [head.join(','), ...rows.map(r => r.join(','))].join('\n');
}
