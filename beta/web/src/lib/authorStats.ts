// ─────────────────────────────────────────────────────────────────────────────
// Author X-ray statistics.
//
// Fairness rules (BETA_PLAN.md §3.2) are enforced here, not left to the UI:
//  • no score or grade for a person, and nothing that ranks people;
//  • every replication statistic carries its coverage (how many papers have
//    any evidence at all), and verdicts fall back to "Too few tested";
//  • "no evidence" is never presented as good or bad.
// ─────────────────────────────────────────────────────────────────────────────
import type { AuthorProfile, AuthorWork, ReplicationOutcome, WorkReplicationStatus } from '../data/types';
import type { Answer, Tone } from './signals';
import { fmt, plural } from './format';

export const MIN_TESTED = 3;     // below this, no verdict on whether work holds up

export interface AuthorStats {
  works: AuthorWork[];
  original: AuthorWork[];               // papers that are not themselves replications
  replicationsRun: AuthorWork[];
  firstYear: number;
  years: number[];
  perYear: { year: number; first: number; middle: number; last: number }[];
  citations: number;
  hIndex: number;
  i10: number;
  tested: AuthorWork[];
  outcomes: Record<Exclude<WorkReplicationStatus, 'untested'>, number>;
  coverage: number;                     // tested / original
  foundInReplications: Record<ReplicationOutcome, number>;
  openShare: { year: number; oa: number; prereg: number; data: number; code: number; n: number }[];
  recentOpen: { oa: number; prereg: number; data: number; code: number; n: number };
  registeredReports: number;
  notices: AuthorWork[];
  topics: { name: string; n: number; citations: number }[];
  positions: { first: number; middle: number; last: number };
}

const share = (xs: AuthorWork[], f: (w: AuthorWork) => boolean) => (xs.length ? xs.filter(f).length / xs.length : 0);

export function authorStats(p: AuthorProfile): AuthorStats {
  const works = p.works;
  const original = works.filter(w => !w.replicates);
  const replicationsRun = works.filter(w => w.replicates);
  const firstYear = Math.min(...works.map(w => w.year));
  const lastYear = Math.max(...works.map(w => w.year), 2025);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const perYear = years.map(year => {
    const ws = works.filter(w => w.year === year);
    return { year, first: ws.filter(w => w.position === 'first').length, middle: ws.filter(w => w.position === 'middle').length, last: ws.filter(w => w.position === 'last').length };
  });
  const cites = works.map(w => w.citations).sort((a, b) => b - a);
  const hIndex = cites.filter((c, i) => c >= i + 1).length;
  const tested = original.filter(w => w.replication.status !== 'untested');
  const outcomes = { success: 0, mixed: 0, failed: 0 };
  for (const w of tested) outcomes[w.replication.status as 'success' | 'mixed' | 'failed']++;
  const foundInReplications = { success: 0, mixed: 0, inconclusive: 0, failed: 0 } as Record<ReplicationOutcome, number>;
  for (const w of replicationsRun) foundInReplications[w.replicates!.outcome]++;

  // Open-science practice per year, smoothed over three years so single years with one paper do not swing the line.
  const openShare = years.map(year => {
    const ws = works.filter(w => Math.abs(w.year - year) <= 1);
    return { year, n: ws.length, oa: share(ws, w => w.openAccess), prereg: share(ws, w => w.preregistered), data: share(ws, w => w.openData), code: share(ws, w => w.openCode) };
  });
  const recent = works.filter(w => w.year > lastYear - 5);
  const recentOpen = { n: recent.length, oa: share(recent, w => w.openAccess), prereg: share(recent, w => w.preregistered), data: share(recent, w => w.openData), code: share(recent, w => w.openCode) };

  const topicMap = new Map<string, { n: number; citations: number }>();
  for (const w of works) { const t = topicMap.get(w.topic) ?? { n: 0, citations: 0 }; t.n++; t.citations += w.citations; topicMap.set(w.topic, t); }

  return {
    works, original, replicationsRun, firstYear, years, perYear,
    citations: cites.reduce((s, c) => s + c, 0), hIndex, i10: cites.filter(c => c >= 10).length,
    tested, outcomes, coverage: original.length ? tested.length / original.length : 0, foundInReplications,
    openShare, recentOpen, registeredReports: works.filter(w => w.registeredReport).length,
    notices: works.filter(w => w.integrity),
    topics: [...topicMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.n - a.n),
    positions: { first: works.filter(w => w.position === 'first').length, middle: works.filter(w => w.position === 'middle').length, last: works.filter(w => w.position === 'last').length },
  };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function heldUpAnswer(s: AuthorStats): Answer {
  const n = s.tested.length;
  const cov = `Replication evidence exists for ${n} of ${fmt(s.original.length)} papers (${pct(s.coverage)}).`;
  if (n < MIN_TESTED) return { tone: 'none', verdict: 'Too few tested', text: `${cov} That is too few to say how this body of work holds up, either way.` };
  const ok = s.outcomes.success / n;
  const tone: Tone = ok >= 2 / 3 ? 'good' : ok >= 1 / 3 ? 'warn' : 'bad';
  return {
    tone, verdict: tone === 'good' ? 'Mostly held up' : tone === 'warn' ? 'Mixed' : 'Mostly did not',
    text: `${cov} Of those, ${s.outcomes.success} held up, ${s.outcomes.mixed} mixed and ${s.outcomes.failed} did not. Untested papers are neither good nor bad news.`,
  };
}

export function replicatorAnswer(s: AuthorStats): Answer {
  const n = s.replicationsRun.length;
  if (!n) return { tone: 'none', verdict: 'None on record', text: 'No replications or reanalyses of other people\'s work are on record for this author.' };
  const f = s.foundInReplications;
  return { tone: 'good', verdict: `${n} run`, text: `${plural(n, 'replication or reanalysis', 'replications or reanalyses')} of others' work: ${f.success} supported the original, ${f.mixed + f.inconclusive} were mixed and ${f.failed} did not.` };
}

export function openAnswer(s: AuthorStats): Answer {
  const r = s.recentOpen;
  if (!r.n) return { tone: 'none', verdict: 'No recent papers', text: 'Nothing published in the last five years.' };
  const score = (r.oa + r.prereg + r.data + r.code) / 4;
  const first = s.openShare.find(x => x.n >= 2);
  const then = first ? (first.oa + first.prereg + first.data + first.code) / 4 : score;
  const trend = score - then > 0.15 ? ' Practice has become much more open over time.' : '';
  const tone: Tone = score >= 0.5 ? 'good' : score >= 0.25 ? 'warn' : 'bad';
  return {
    tone, verdict: tone === 'good' ? 'Open' : tone === 'warn' ? 'Partly open' : 'Rarely open',
    text: `In the last five years: ${pct(r.oa)} open access, ${pct(r.prereg)} preregistered, ${pct(r.data)} with open data, ${pct(r.code)} with open code.${trend}`,
  };
}

export function integrityAnswerAuthor(s: AuthorStats): Answer {
  const r = s.notices.filter(w => w.integrity === 'retraction').length;
  const e = s.notices.filter(w => w.integrity === 'expression_of_concern').length;
  const c = s.notices.filter(w => w.integrity === 'correction').length;
  if (!s.notices.length) return { tone: 'good', verdict: 'Clean record', text: `No retraction, expression of concern or correction across ${plural(s.works.length, 'paper')}.` };
  const parts = [r && plural(r, 'retraction'), e && plural(e, 'expression of concern', 'expressions of concern'), c && plural(c, 'correction')].filter(Boolean).join(', ');
  return { tone: r || e ? 'bad' : 'warn', verdict: r ? 'Retraction' : e ? 'Concern' : 'Corrected', text: `${parts} across ${plural(s.works.length, 'paper')}. Corrections are routine; each notice is listed below.` };
}

export function outputAnswer(s: AuthorStats): Answer {
  const span = 2025 - s.firstYear + 1;
  return { tone: 'none', verdict: `${fmt(s.works.length)} papers`, text: `Publishing since ${s.firstYear}, about ${(s.works.length / span).toFixed(1)} papers a year. ${fmt(s.citations)} citations, h-index ${s.hIndex}. Main topics: ${s.topics.slice(0, 3).map(t => t.name.toLowerCase()).join(', ')}.` };
}
