import type { Colors } from './echarts';
import type {
  EffectSize, IntegrityKind, PracticeKey, PracticeStatus, PubPeerSentiment, PubPeerTopic,
  ReplicationOutcome, ReproductionOutcome,
} from '../data/types';

export const fmt = (n: number) => n.toLocaleString('en');
export const plural = (n: number, one: string, many = one + 's') => `${fmt(n)} ${n === 1 ? one : many}`;
export const pct = (v: number) => `${Math.round(v * 100)}%`;

export function effectText(e: EffectSize): string {
  return `${e.metric} = ${e.value.toFixed(2)} [${e.ciLow.toFixed(2)}, ${e.ciHigh.toFixed(2)}]`;
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Standard error from a 95% CI, for pooling. */
export const seFromCi = (e: EffectSize) => (e.ciHigh - e.ciLow) / (2 * 1.96);

/** Fixed-effect (inverse-variance) pooled estimate. */
export function pool(effects: EffectSize[]): EffectSize | null {
  if (!effects.length) return null;
  let w = 0, wv = 0, n = 0;
  for (const e of effects) { const wi = 1 / seFromCi(e) ** 2; w += wi; wv += wi * e.value; n += e.n; }
  const value = wv / w, se = Math.sqrt(1 / w);
  return { metric: effects[0].metric, value, ciLow: value - 1.96 * se, ciHigh: value + 1.96 * se, n };
}

export const OUTCOME_LABEL: Record<ReplicationOutcome, string> = {
  success: 'Successful', mixed: 'Mixed', inconclusive: 'Inconclusive', failed: 'Failed',
};
export const outcomeColor = (c: Colors, o: ReplicationOutcome) =>
  ({ success: c.success, mixed: c.mixed, inconclusive: c.inconclusive, failed: c.failed })[o];
/** Shapes double-encode outcome, so colour is never the only cue. */
export const OUTCOME_SYMBOL: Record<ReplicationOutcome, string> = {
  success: 'circle', mixed: 'diamond', inconclusive: 'rect', failed: 'triangle',
};

export const REPRO_LABEL: Record<ReproductionOutcome, string> = {
  reproduced: 'Reproduced', partially: 'Partly reproduced', not_reproduced: 'Not reproduced',
};
export const reproColor = (c: Colors, o: ReproductionOutcome) =>
  ({ reproduced: c.success, partially: c.mixed, not_reproduced: c.failed })[o];

export const SENTIMENT_LABEL: Record<PubPeerSentiment, string> = { positive: 'Positive', neutral: 'Neutral', critical: 'Critical' };
export const sentimentColor = (c: Colors, s: PubPeerSentiment) => ({ positive: c.positive, neutral: c.neutral, critical: c.critical })[s];

export const TOPIC_LABEL: Record<PubPeerTopic, string> = {
  statistics: 'Statistics', image: 'Images', data: 'Data', methods: 'Methods',
  interpretation: 'Interpretation', praise: 'Praise', question: 'Question',
};

export const INTEGRITY_LABEL: Record<IntegrityKind, string> = {
  correction: 'Correction', expression_of_concern: 'Expression of concern', retraction: 'Retraction',
};

export const PRACTICE_LABEL: Record<PracticeKey, string> = {
  preregistration: 'Preregistration', registered_report: 'Registered Report', open_data: 'Open data',
  open_code: 'Open code', open_materials: 'Open materials', open_access: 'Open access',
  coi_statement: 'Conflict-of-interest statement', reporting_guideline: 'Reporting guideline',
};
export const STATUS_LABEL: Record<PracticeStatus, string> = { yes: 'Yes', partial: 'Partly', no: 'No', unknown: 'Unknown' };
