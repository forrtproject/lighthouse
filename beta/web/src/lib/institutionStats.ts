// ─────────────────────────────────────────────────────────────────────────────
// Institution and department statistics.
//
// Departments are derived from affiliation strings (lib/departments.ts) and
// every figure can be scoped to one department. Aggregates describe the
// institution or department; individuals are only ever listed alphabetically,
// never ranked (BETA_PLAN.md §3.2).
// ─────────────────────────────────────────────────────────────────────────────
import type { InstitutionProfile, Researcher } from '../data/types';
import { researcherDepartment, type DepartmentMatch, type MatchMethod } from './departments';
import type { Answer, Tone } from './signals';
import { fmt, plural } from './format';

export interface PlacedResearcher extends Researcher { department: string; deptSlug: string; matches: DepartmentMatch[] }

export interface DeptSummary {
  name: string; slug: string; researchers: number; papers: number; citations: number;
  tested: number; outcomes: { success: number; mixed: number; failed: number };
  topics: Map<string, number>;
}

export interface InstitutionStats {
  all: PlacedResearcher[];             // whole institution, departments derived
  scope: PlacedResearcher[];           // the selected department, or everyone
  scopeName: string;                   // institution or department name
  departments: DeptSummary[];
  topics: { name: string; researchers: number }[];
  years: number[];
  perYearByDept: Map<string, number[]>;
  open: { year: number; n: number; oa: number; prereg: number; data: number; code: number }[];
  recentOpen: { oa: number; prereg: number; data: number; code: number; n: number };
  papers: number; citations: number; tested: number; outcomes: { success: number; mixed: number; failed: number };
  replicationsRun: number; notices: number;
  derivation: { method: MatchMethod; n: number }[];
  matches: DepartmentMatch[];
}

const NOW = 2025;

export function placeResearchers(p: InstitutionProfile): PlacedResearcher[] {
  return p.researchers.map(r => {
    const d = researcherDepartment(r.rawAffiliations);
    return { ...r, department: d.department, deptSlug: d.slug, matches: d.matches };
  });
}

export function institutionStats(p: InstitutionProfile, deptSlug: string | null): InstitutionStats {
  const all = placeResearchers(p);
  const scope = deptSlug ? all.filter(r => r.deptSlug === deptSlug) : all;
  const scopeName = deptSlug ? (scope[0]?.department ?? 'Department') : p.institution.name;

  const deptMap = new Map<string, DeptSummary>();
  for (const r of all) {
    const d = deptMap.get(r.deptSlug) ?? { name: r.department, slug: r.deptSlug, researchers: 0, papers: 0, citations: 0, tested: 0, outcomes: { success: 0, mixed: 0, failed: 0 }, topics: new Map() };
    d.researchers++; d.papers += r.papers; d.citations += r.citations; d.tested += r.tested;
    d.outcomes.success += r.outcomes.success; d.outcomes.mixed += r.outcomes.mixed; d.outcomes.failed += r.outcomes.failed;
    for (const t of r.topics) d.topics.set(t, (d.topics.get(t) ?? 0) + 1);
    deptMap.set(r.deptSlug, d);
  }
  // Largest first, with the "Unassigned" bucket always last.
  const departments = [...deptMap.values()].sort((a, b) => (a.slug === 'unassigned' ? 1 : b.slug === 'unassigned' ? -1 : b.researchers - a.researchers));

  const topicCount = new Map<string, number>();
  for (const r of scope) for (const t of r.topics) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
  const topics = [...topicCount.entries()].map(([name, researchers]) => ({ name, researchers })).sort((a, b) => b.researchers - a.researchers);

  const first = Math.min(...all.map(r => r.firstYear));
  const years = Array.from({ length: NOW - first + 1 }, (_, i) => first + i);
  const perYearByDept = new Map<string, number[]>();
  for (const r of scope) {
    const arr = perYearByDept.get(r.department) ?? years.map(() => 0);
    for (const y of r.years) { const i = y.year - first; if (i >= 0 && i < arr.length) arr[i] += y.papers; }
    perYearByDept.set(r.department, arr);
  }

  // Open-science share per year (three-year window), summed over researchers.
  const open = years.map(year => {
    let n = 0, oa = 0, prereg = 0, data = 0, code = 0;
    for (const r of scope) for (const y of r.years) if (Math.abs(y.year - year) <= 1) { n += y.papers; oa += y.oa; prereg += y.prereg; data += y.data; code += y.code; }
    return { year, n, oa: n ? oa / n : 0, prereg: n ? prereg / n : 0, data: n ? data / n : 0, code: n ? code / n : 0 };
  });
  let rn = 0, roa = 0, rpre = 0, rdata = 0, rcode = 0;
  for (const r of scope) for (const y of r.years) if (y.year > NOW - 5) { rn += y.papers; roa += y.oa; rpre += y.prereg; rdata += y.data; rcode += y.code; }
  const recentOpen = { n: rn, oa: rn ? roa / rn : 0, prereg: rn ? rpre / rn : 0, data: rn ? rdata / rn : 0, code: rn ? rcode / rn : 0 };

  const outcomes = { success: 0, mixed: 0, failed: 0 };
  for (const r of scope) { outcomes.success += r.outcomes.success; outcomes.mixed += r.outcomes.mixed; outcomes.failed += r.outcomes.failed; }

  const matches = all.flatMap(r => r.matches);
  const methods: MatchMethod[] = ['unit', 'keyword', 'unassigned'];

  return {
    all, scope, scopeName, departments, topics, years, perYearByDept, open, recentOpen,
    papers: scope.reduce((s, r) => s + r.papers, 0), citations: scope.reduce((s, r) => s + r.citations, 0),
    tested: scope.reduce((s, r) => s + r.tested, 0), outcomes,
    replicationsRun: scope.reduce((s, r) => s + r.replicationsRun, 0), notices: scope.reduce((s, r) => s + r.notices, 0),
    derivation: methods.map(method => ({ method, n: matches.filter(m => m.method === method).length })),
    matches,
  };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function instHeldUpAnswer(s: InstitutionStats): Answer {
  const cov = s.papers ? s.tested / s.papers : 0;
  const base = `Replication evidence exists for ${fmt(s.tested)} of ${fmt(s.papers)} papers (${pct(cov)}).`;
  if (s.tested < 5) return { tone: 'none', verdict: 'Too few tested', text: `${base} Too few to say how this research holds up.` };
  const ok = s.outcomes.success / s.tested;
  const tone: Tone = ok >= 2 / 3 ? 'good' : ok >= 1 / 3 ? 'warn' : 'bad';
  return { tone, verdict: tone === 'good' ? 'Mostly held up' : tone === 'warn' ? 'Mixed' : 'Mostly did not',
    text: `${base} Of those, ${s.outcomes.success} held up, ${s.outcomes.mixed} were mixed and ${s.outcomes.failed} did not.` };
}

export function instOpenAnswer(s: InstitutionStats): Answer {
  const r = s.recentOpen;
  const score = (r.oa + r.prereg + r.data + r.code) / 4;
  const tone: Tone = score >= 0.5 ? 'good' : score >= 0.25 ? 'warn' : 'bad';
  return { tone, verdict: tone === 'good' ? 'Open' : tone === 'warn' ? 'Partly open' : 'Rarely open',
    text: `Papers from the last five years: ${pct(r.oa)} open access, ${pct(r.prereg)} preregistered, ${pct(r.data)} with open data, ${pct(r.code)} with open code.` };
}

export function orgAnswer(s: InstitutionStats): Answer {
  const assigned = s.departments.filter(d => d.slug !== 'unassigned');
  const un = s.departments.find(d => d.slug === 'unassigned');
  return { tone: 'none', verdict: plural(assigned.length, 'department'),
    text: `${plural(s.all.length, 'researcher')} across ${plural(assigned.length, 'derived department')}${un ? `; ${un.researchers} could not be placed from their affiliation strings` : ''}.` };
}
