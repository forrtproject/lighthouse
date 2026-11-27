// ─────────────────────────────────────────────────────────────────────────────
// Trust model (draft, for discussion)
//
// The trust score is computed from the evidence records of a paper, never
// entered by hand. It has six dimensions. Each returns a 0–100 score, the
// reasons behind it, and whether there was evidence to score it at all.
// Dimensions without evidence are left out, and the remaining weights are
// rescaled. How much of the total weight was actually assessed is reported as
// "coverage", so a score that rests on little evidence says so.
//
// Weights and rules are placeholders to argue about. They live here, in one
// file, so the methods page and the UI always agree.
// ─────────────────────────────────────────────────────────────────────────────
import type { Paper, Replication, ReplicationOutcome, ReproductionOutcome, PracticeStatus } from '../data/types';

export type DimensionKey =
  | 'replication' | 'reproducibility' | 'integrity' | 'transparency' | 'statistics' | 'community';

export interface Reason {
  text: string;
  /** +1 raises trust, -1 lowers it, 0 is context. */
  direction: 1 | 0 | -1;
}

export interface Dimension {
  key: DimensionKey;
  label: string;
  short: string;
  weight: number;          // nominal weight, sums to 1 across dimensions
  assessed: boolean;
  score: number | null;    // 0–100, null when not assessed
  reasons: Reason[];
  basis: string;           // what the score rests on, e.g. "4 replications, N = 2,850"
}

export interface TrustResult {
  score: number;           // 0–100
  band: 'High' | 'Moderate' | 'Low' | 'Very low';
  confidence: 'High' | 'Moderate' | 'Low';
  coverage: number;        // 0–1, share of the total weight that had evidence
  retracted: boolean;
  capApplied: number;      // points removed by the retraction cap (0 if none)
  dimensions: Dimension[];
  /** Each dimension's points in the final score, for the waterfall. */
  contributions: { key: DimensionKey; label: string; points: number }[];
}

export const WEIGHTS: Record<DimensionKey, number> = {
  replication: 0.30,
  reproducibility: 0.15,
  integrity: 0.15,
  transparency: 0.15,
  statistics: 0.10,
  community: 0.15,
};

export const LABELS: Record<DimensionKey, [label: string, short: string]> = {
  replication: ['Replication', 'Replication'],
  reproducibility: ['Reproducibility & robustness', 'Reproducibility'],
  integrity: ['Research integrity', 'Integrity'],
  transparency: ['Transparency', 'Transparency'],
  statistics: ['Statistical reporting', 'Statistics'],
  community: ['Community review', 'Community'],
};

export const BANDS = [
  { min: 75, label: 'High' as const },
  { min: 50, label: 'Moderate' as const },
  { min: 25, label: 'Low' as const },
  { min: 0, label: 'Very low' as const },
];

export const RETRACTION_CAP = 10;

const OUTCOME_VALUE: Record<ReplicationOutcome, number> = { success: 1, mixed: 0.5, inconclusive: 0.4, failed: 0 };
const KIND_FACTOR: Record<Replication['kind'], number> = { direct: 1, close: 0.9, conceptual: 0.6 };
const REPRO_VALUE: Record<ReproductionOutcome, number> = { reproduced: 1, partially: 0.5, not_reproduced: 0 };
const PRACTICE_VALUE: Record<PracticeStatus, number | null> = { yes: 1, partial: 0.5, no: 0, unknown: null };

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const fmt = (n: number) => n.toLocaleString('en');
const plural = (n: number, one: string, many = one + 's') => `${fmt(n)} ${n === 1 ? one : many}`;

function dim(key: DimensionKey, assessed: boolean, score: number | null, reasons: Reason[], basis: string): Dimension {
  const [label, short] = LABELS[key];
  return { key, label, short, weight: WEIGHTS[key], assessed, score: assessed && score != null ? Math.round(clamp(score)) : null, reasons, basis };
}

/** Weight of one replication: larger, more direct, preregistered studies count more. */
export function replicationWeight(r: Replication): number {
  const design = r.registeredReport ? 1.25 : r.preregistered ? 1.1 : 1;
  return Math.sqrt(r.effect.n) * KIND_FACTOR[r.kind] * design;
}

function scoreReplication(p: Paper): Dimension {
  const reps = p.replications;
  if (!reps.length) {
    return dim('replication', false, null,
      [{ text: 'No replication on record. This is not evidence that the finding replicates.', direction: 0 }],
      'No replications');
  }
  let wSum = 0, vSum = 0;
  for (const r of reps) { const w = replicationWeight(r); wSum += w; vSum += w * OUTCOME_VALUE[r.outcome]; }
  const count = (o: ReplicationOutcome) => reps.filter(r => r.outcome === o).length;
  const totalN = reps.reduce((s, r) => s + r.effect.n, 0);
  const largest = [...reps].sort((a, b) => b.effect.n - a.effect.n)[0];
  const reasons: Reason[] = [];
  const parts = [
    count('success') && `${count('success')} successful`,
    count('mixed') && `${count('mixed')} mixed`,
    count('inconclusive') && `${count('inconclusive')} inconclusive`,
    count('failed') && `${count('failed')} failed`,
  ].filter(Boolean).join(', ');
  reasons.push({ text: `${plural(reps.length, 'replication')} with ${fmt(totalN)} participants: ${parts}.`, direction: count('failed') > count('success') ? -1 : 1 });
  reasons.push({
    text: `Largest study: ${largest.label} (N = ${fmt(largest.effect.n)}${largest.labs > 1 ? `, ${largest.labs} labs` : ''}) ${largest.outcome === 'success' ? 'succeeded' : largest.outcome === 'failed' ? 'failed' : `was ${largest.outcome}`}.`,
    direction: largest.outcome === 'success' ? 1 : largest.outcome === 'failed' ? -1 : 0,
  });
  const rr = reps.filter(r => r.registeredReport).length;
  if (rr) reasons.push({ text: `${plural(rr, 'replication')} ${rr === 1 ? 'was a Registered Report' : 'were Registered Reports'}, which carry extra weight.`, direction: 0 });
  // Shrinkage: replications much smaller than the original effect.
  const mean = reps.reduce((s, r) => s + r.effect.value * r.effect.n, 0) / totalN;
  if (mean < p.originalEffect.value * 0.5) {
    reasons.push({ text: `Replication effects average ${mean.toFixed(2)}, less than half the original ${p.originalEffect.value.toFixed(2)}.`, direction: -1 });
  }
  return dim('replication', true, 100 * vSum / wSum, reasons, `${plural(reps.length, 'replication')}, N = ${fmt(totalN)}`);
}

function scoreReproducibility(p: Paper): Dimension {
  const rs = p.reproductions;
  if (!rs.length) {
    return dim('reproducibility', false, null, [{ text: 'No computational reproduction or robustness reanalysis on record.', direction: 0 }], 'No reanalyses');
  }
  const reasons: Reason[] = rs.map(r => ({
    text: `${r.label} (${r.kind}): ${r.outcome.replace('_', ' ')}. ${r.note}`,
    direction: r.outcome === 'reproduced' ? 1 : r.outcome === 'not_reproduced' ? -1 : 0,
  }));
  const score = 100 * rs.reduce((s, r) => s + REPRO_VALUE[r.outcome], 0) / rs.length;
  return dim('reproducibility', true, score, reasons, plural(rs.length, 'reanalysis', 'reanalyses'));
}

function scoreIntegrity(p: Paper): Dimension {
  const reasons: Reason[] = [];
  const retraction = p.integrity.find(e => e.kind === 'retraction');
  const eoc = p.integrity.filter(e => e.kind === 'expression_of_concern').length;
  const corrections = p.integrity.filter(e => e.kind === 'correction').length;
  const dataConcerns = p.pubpeer.comments.filter(c => !c.isAuthorResponse && c.sentiment === 'critical'
    && c.topics.some(t => t === 'data' || t === 'image')).length;

  let score = 100;
  if (retraction) {
    reasons.push({ text: `Retracted on ${retraction.date}: ${retraction.reason}`, direction: -1 });
    score = 0;
  } else {
    if (eoc) { score -= 40 * eoc; reasons.push({ text: `${plural(eoc, 'expression of concern', 'expressions of concern')} issued.`, direction: -1 }); }
    if (corrections) { score -= 10 * corrections; reasons.push({ text: `${plural(corrections, 'correction')} published. Corrections are normal and can signal care; each is noted.`, direction: 0 }); }
    if (dataConcerns) { score -= Math.min(30, 10 * dataConcerns); reasons.push({ text: `${plural(dataConcerns, 'PubPeer comment')} raising data or image concerns.`, direction: -1 }); }
    if (!eoc && !corrections && !dataConcerns) reasons.push({ text: 'No retraction, expression of concern or correction on record.', direction: 1 });
  }
  return dim('integrity', true, score, reasons, `${plural(p.integrity.length, 'notice')}, ${plural(dataConcerns, 'data concern')}`);
}

function scoreTransparency(p: Paper): Dimension {
  const known = p.practices.filter(x => PRACTICE_VALUE[x.status] != null);
  if (!known.length) return dim('transparency', false, null, [{ text: 'No open-science practices could be checked.', direction: 0 }], 'Not checked');
  const met = known.filter(x => x.status === 'yes').length;
  const partial = known.filter(x => x.status === 'partial').length;
  const score = 100 * known.reduce((s, x) => s + (PRACTICE_VALUE[x.status] as number), 0) / known.length;
  const reasons: Reason[] = [
    { text: `${met} of ${known.length} checked practices met${partial ? `, ${partial} partly` : ''}.`, direction: met >= known.length / 2 ? 1 : -1 },
  ];
  const noData = p.practices.find(x => x.key === 'open_data' && x.status === 'no');
  if (noData) reasons.push({ text: `Data not shared${noData.note ? `: ${noData.note}` : '.'}`, direction: -1 });
  const prereg = p.practices.find(x => x.key === 'preregistration');
  if (prereg?.status === 'no') reasons.push({ text: 'Not preregistered.', direction: -1 });
  return dim('transparency', true, score, reasons, `${known.length} practices checked`);
}

function scoreStatistics(p: Paper): Dimension {
  const checks = p.statChecks;
  const power = p.design.powerForReplicationEffect;
  if (!checks.length && power == null) {
    return dim('statistics', false, null, [{ text: 'No reported tests could be re-checked.', direction: 0 }], 'Not checked');
  }
  const reasons: Reason[] = [];
  let consistency = 1;
  if (checks.length) {
    const decision = checks.filter(c => c.decisionError).length;
    const minor = checks.filter(c => !c.decisionError && Math.abs(c.reportedP - c.recomputedP) > 0.005
      && Math.abs(c.reportedP - c.recomputedP) / Math.max(c.recomputedP, 1e-6) > 0.25).length;
    consistency = clamp(1 - (decision + 0.5 * minor) / checks.length, 0, 1);
    reasons.push({
      text: decision || minor
        ? `${decision + minor} of ${checks.length} re-checked tests ${decision + minor === 1 ? 'is' : 'are'} inconsistent${decision ? `; ${decision} change${decision === 1 ? 's' : ''} the significance decision` : ''}.`
        : `All ${checks.length} re-checked tests are consistent with their test statistics.`,
      direction: decision ? -1 : minor ? 0 : 1,
    });
  }
  let score = 100 * consistency;
  if (power != null) {
    const ps = Math.min(1, power / 0.8);
    score = 100 * (0.6 * consistency + 0.4 * ps);
    reasons.push({
      text: `The original study had ${Math.round(power * 100)}% power to detect the effect size later found in replications${power < 0.5 ? ', so a significant original result was unlikely to be reliable' : ''}.`,
      direction: power >= 0.8 ? 1 : power < 0.5 ? -1 : 0,
    });
  }
  return dim('statistics', true, score, reasons, `${plural(checks.length, 'test')} re-checked`);
}

function scoreCommunity(p: Paper): Dimension {
  const cs = p.pubpeer.comments.filter(c => !c.isAuthorResponse);
  const pos = cs.filter(c => c.sentiment === 'positive').length;
  const crit = cs.filter(c => c.sentiment === 'critical').length;
  const neu = cs.filter(c => c.sentiment === 'neutral').length;
  const stance = { supports: 1, neutral: 0, questions: -1 } as const;
  let cSum = 0, cW = 0;
  for (const c of p.commentaries) { const w = c.kind === 'meta_analysis' ? 2 : 1; cSum += stance[c.stance] * w; cW += w; }
  const denom = pos + crit + 0.5 * neu + cW;
  if (!denom) return dim('community', false, null, [{ text: 'No post-publication comments, critiques or meta-analyses on record.', direction: 0 }], 'Nothing on record');
  const balance = (pos - crit + cSum) / denom;
  const reasons: Reason[] = [];
  if (cs.length) reasons.push({ text: `PubPeer: ${pos} positive, ${neu} neutral, ${crit} critical comments.`, direction: crit > pos ? -1 : pos > crit ? 1 : 0 });
  const replied = p.pubpeer.comments.filter(c => c.isAuthorResponse).length;
  if (replied) reasons.push({ text: `The authors responded ${plural(replied, 'time')} on PubPeer.`, direction: 1 });
  for (const c of p.commentaries) {
    reasons.push({ text: `${c.kind === 'meta_analysis' ? 'Meta-analysis' : c.kind === 'critique' ? 'Critique' : 'Commentary'} by ${c.label} ${c.stance === 'supports' ? 'supports' : c.stance === 'questions' ? 'questions' : 'is neutral on'} the claim.`, direction: stance[c.stance] as 1 | 0 | -1 });
  }
  return dim('community', true, 50 + 50 * balance, reasons, `${plural(cs.length, 'comment')}, ${plural(p.commentaries.length, 'commentary', 'commentaries')}`);
}

export function bandFor(score: number): TrustResult['band'] {
  return BANDS.find(b => score >= b.min)!.label;
}

export function computeTrust(p: Paper): TrustResult {
  const dimensions = [
    scoreReplication(p), scoreReproducibility(p), scoreIntegrity(p),
    scoreTransparency(p), scoreStatistics(p), scoreCommunity(p),
  ];
  const assessed = dimensions.filter(d => d.assessed);
  const coverage = assessed.reduce((s, d) => s + d.weight, 0);
  const contributions = dimensions.map(d => ({
    key: d.key, label: d.short,
    points: d.assessed ? (d.weight / coverage) * (d.score as number) : 0,
  }));
  let raw = contributions.reduce((s, c) => s + c.points, 0);
  const retracted = p.integrity.some(e => e.kind === 'retraction');
  let capApplied = 0;
  if (retracted && raw > RETRACTION_CAP) { capApplied = raw - RETRACTION_CAP; raw = RETRACTION_CAP; }
  const score = Math.round(raw);

  const reps = p.replications.length;
  const confidence: TrustResult['confidence'] =
    coverage >= 0.85 && reps >= 2 ? 'High' : coverage >= 0.6 && reps >= 1 ? 'Moderate' : 'Low';

  return { score, band: bandFor(score), confidence, coverage, retracted, capApplied, dimensions, contributions };
}
