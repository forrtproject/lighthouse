// ─────────────────────────────────────────────────────────────────────────────
// Key signals: the answers to a researcher's first questions about a paper,
// derived from the same evidence as the trust model. The hero tiles, the
// section rail's status markers and each section's answer-first heading all
// read from here, so they can never disagree.
// ─────────────────────────────────────────────────────────────────────────────
import type { Paper, PracticeStatus, ReplicationOutcome } from '../data/types';
import { fmt, plural, pool } from './format';

/** Never shown by colour alone: every tone has an icon and a word. */
export type Tone = 'good' | 'warn' | 'bad' | 'none';

export interface Answer {
  tone: Tone;
  /** One or two words, e.g. "No", "Partly", "Not tested". */
  verdict: string;
  /** One sentence that justifies the verdict. */
  text: string;
}

export interface Signal extends Answer {
  key: 'replication' | 'effect' | 'integrity' | 'statistics' | 'transparency' | 'pubpeer';
  label: string;
  value: string;
  caption: string;
  target: string;           // section id the tile links to
}

const lastYears = (p: Paper, n: number) => p.citations.slice(-n);

export function replicationAnswer(p: Paper): Answer & { counts: Record<ReplicationOutcome, number> } {
  const reps = p.replications;
  const counts = { success: 0, mixed: 0, inconclusive: 0, failed: 0 } as Record<ReplicationOutcome, number>;
  for (const r of reps) counts[r.outcome]++;
  if (!reps.length) return { tone: 'none', verdict: 'Not tested', text: 'No replication is on record yet. That is not evidence that it replicates.', counts };
  const share = counts.success / reps.length;
  const tone: Tone = share >= 2 / 3 ? 'good' : share >= 1 / 3 ? 'warn' : 'bad';
  const pooled = pool(reps.map(r => r.effect));
  const kept = pooled ? pooled.value / p.originalEffect.value : null;
  const verdict = tone === 'good' ? 'Yes' : tone === 'warn' ? 'Partly' : 'No';
  const parts = [`${counts.success} of ${reps.length} replications succeeded`];
  if (counts.failed) parts.push(`${counts.failed} failed`);
  const shrink = kept != null ? `, and the pooled replication effect is ${Math.round(kept * 100)}% of the original` : '';
  return { tone, verdict, text: `${parts.join(', ')}${shrink}.`, counts };
}

export function statisticsAnswer(p: Paper): Answer & { states: ('ok' | 'minor' | 'decision')[] } {
  const states = p.statChecks.map(c => c.decisionError ? 'decision' as const
    : Math.abs(c.reportedP - c.recomputedP) > 0.005 && Math.abs(c.reportedP - c.recomputedP) / c.recomputedP > 0.25 ? 'minor' as const : 'ok' as const);
  if (!states.length) return { tone: 'none', verdict: 'Not checked', text: 'No reported test could be re-checked.', states };
  const bad = states.filter(s => s !== 'ok').length, flips = states.filter(s => s === 'decision').length;
  const tone: Tone = flips ? 'bad' : bad ? 'warn' : 'good';
  return {
    tone, verdict: tone === 'good' ? 'Sound' : tone === 'warn' ? 'Minor issues' : 'Errors',
    text: bad ? `${bad} of ${states.length} re-checked tests are inconsistent${flips ? `, and ${flips} would change significance` : ''}.` : `All ${states.length} re-checked tests are consistent.`,
    states,
  };
}

export function transparencyAnswer(p: Paper): Answer & { statuses: PracticeStatus[]; met: number; known: number } {
  const statuses = p.practices.map(x => x.status);
  const known = statuses.filter(s => s !== 'unknown').length;
  const met = statuses.filter(s => s === 'yes').length;
  const share = known ? met / known : 0;
  const tone: Tone = !known ? 'none' : share >= 0.6 ? 'good' : share >= 0.3 ? 'warn' : 'bad';
  const prereg = p.practices.find(x => x.key === 'preregistration')?.status === 'yes';
  const data = p.practices.find(x => x.key === 'open_data')?.status;
  return {
    tone, statuses, met, known,
    verdict: tone === 'good' ? 'Open' : tone === 'warn' ? 'Partly open' : tone === 'bad' ? 'Closed' : 'Unknown',
    text: `${met} of ${known} checked practices met. ${prereg ? 'Preregistered' : 'Not preregistered'}; data ${data === 'yes' ? 'shared' : data === 'partial' ? 'partly shared' : 'not shared'}.`,
  };
}

export function pubpeerAnswer(p: Paper): Answer & { pos: number; neu: number; crit: number; replies: number } {
  const cs = p.pubpeer.comments.filter(c => !c.isAuthorResponse);
  const pos = cs.filter(c => c.sentiment === 'positive').length;
  const neu = cs.filter(c => c.sentiment === 'neutral').length;
  const crit = cs.filter(c => c.sentiment === 'critical').length;
  const replies = p.pubpeer.comments.length - cs.length;
  if (!cs.length) return { tone: 'none', verdict: 'Quiet', text: 'No PubPeer discussion yet.', pos, neu, crit, replies };
  const tone: Tone = crit > pos ? 'bad' : crit ? 'warn' : 'good';
  return {
    tone, pos, neu, crit, replies,
    verdict: tone === 'bad' ? 'Mostly critical' : tone === 'warn' ? 'Mixed' : 'Positive',
    text: `${plural(crit, 'critical comment')}, ${pos} positive and ${neu} neutral. The authors replied ${plural(replies, 'time')}.`,
  };
}

export function integrityAnswer(p: Paper): Answer {
  const r = p.integrity.find(e => e.kind === 'retraction');
  if (r) return { tone: 'bad', verdict: 'Retracted', text: `Retracted in ${r.date.slice(0, 4)}. ${r.reason}` };
  const eoc = p.integrity.find(e => e.kind === 'expression_of_concern');
  if (eoc) return { tone: 'bad', verdict: 'Under concern', text: `Expression of concern issued in ${eoc.date.slice(0, 4)}.` };
  const corr = p.integrity.filter(e => e.kind === 'correction').length;
  if (corr) return { tone: 'warn', verdict: 'Corrected', text: `${plural(corr, 'correction')} published; no retraction or expression of concern.` };
  return { tone: 'good', verdict: 'Clean record', text: 'No retraction, expression of concern or correction on record.' };
}

export function citationsAnswer(p: Paper): Answer {
  const recent = lastYears(p, 3);
  const n = recent.reduce((s, y) => s + y.supporting + y.contrasting + y.mentioning, 0);
  const contra = recent.reduce((s, y) => s + y.contrasting, 0);
  const share = n ? contra / n : 0;
  const retraction = p.integrity.find(e => e.kind === 'retraction');
  if (retraction) {
    const after = p.citations.filter(y => y.year > +retraction.date.slice(0, 4)).reduce((s, y) => s + y.supporting + y.contrasting + y.mentioning, 0);
    return { tone: 'bad', verdict: 'Still cited', text: `${fmt(after)} citations since the retraction; ${Math.round(share * 100)}% of recent citations contrast it.` };
  }
  return {
    tone: share > 0.25 ? 'warn' : 'good', verdict: share > 0.25 ? 'Contested' : 'Cited',
    text: `${fmt(n)} citations in the last three years, ${Math.round(share * 100)}% of them contrasting.`,
  };
}

export function keySignals(p: Paper): Signal[] {
  const rep = replicationAnswer(p);
  const pooled = pool(p.replications.map(r => r.effect));
  const kept = pooled ? pooled.value / p.originalEffect.value : null;
  const st = statisticsAnswer(p);
  const tr = transparencyAnswer(p);
  const pp = pubpeerAnswer(p);
  const ig = integrityAnswer(p);
  const keptTone: Tone = kept == null ? 'none' : kept >= 0.6 ? 'good' : kept >= 0.3 ? 'warn' : 'bad';
  return [
    { key: 'replication', label: 'Replicated?', target: 'replication', ...rep,
      value: p.replications.length ? `${rep.counts.success}/${p.replications.length}` : '—',
      caption: p.replications.length ? 'replications succeeded' : 'no replications yet' },
    { key: 'effect', label: 'Effect that survives', target: 'replication', tone: keptTone,
      verdict: keptTone === 'good' ? 'Most' : keptTone === 'warn' ? 'Some' : keptTone === 'bad' ? 'Little' : 'Unknown',
      text: kept == null ? 'No replication estimate yet.' : `Pooled replications find ${Math.round(kept * 100)}% of the original effect.`,
      value: kept == null ? '—' : `${Math.max(0, Math.round(kept * 100))}%`,
      caption: kept == null ? 'needs a replication' : `d ${pooled!.value.toFixed(2)} vs ${p.originalEffect.value.toFixed(2)} originally` },
    { key: 'integrity', label: 'Integrity', target: 'timeline', ...ig, value: String(p.integrity.length),
      caption: p.integrity.length
        ? p.integrity.map(e => `${e.kind === 'expression_of_concern' ? 'concern' : e.kind} ${e.date.slice(0, 4)}`).join(' · ')
        : 'notices on record' },
    { key: 'statistics', label: 'Statistics', target: 'statistics', ...st,
      value: st.states.length ? `${st.states.filter(s => s !== 'ok').length}/${st.states.length}` : '—', caption: 'tests inconsistent' },
    { key: 'transparency', label: 'Open science', target: 'transparency', ...tr, value: `${tr.met}/${tr.known}`, caption: 'practices met' },
    { key: 'pubpeer', label: 'PubPeer', target: 'pubpeer', ...pp, value: String(pp.crit), caption: `critical · ${pp.pos} positive` },
  ];
}
