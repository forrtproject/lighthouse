// ─────────────────────────────────────────────────────────────────────────────
// Department derivation.
//
// No bibliographic source stores departments as structured data: OpenAlex keeps
// only the raw affiliation string from each paper ("Dept. of Psychology,
// Halden Inst. Technol., Germany"). This module turns those strings into
// canonical departments and records how each match was made, so the UI can
// show the derivation instead of presenting it as fact.
// ─────────────────────────────────────────────────────────────────────────────

export type MatchMethod = 'unit' | 'keyword' | 'unassigned';

export interface DepartmentMatch {
  raw: string;
  department: string;          // canonical name, or 'Unassigned'
  slug: string;
  method: MatchMethod;
  /** The fragment of the raw string the match came from. */
  fragment: string | null;
}

export const UNASSIGNED = 'Unassigned';

/** Canonical departments and the words (several languages) that identify them. Order matters: more specific first. */
const RULES: { name: string; re: RegExp }[] = [
  { name: 'Cognitive Science', re: /cognitive science|kognitionswissenschaft|ci[eê]ncias? cognitivas?/i },
  { name: 'Neuroscience', re: /neuro/i },
  { name: 'Psychology', re: /psycholog|psychologie|psicolog|psykolog|心理/i },
  { name: 'Education', re: /educat|p[äa]dagog|educa[çc][ãa]o|onderwijs|教育/i },
  { name: 'Economics', re: /econom|wirtschaftswiss|volkswirtschaft|economia/i },
  { name: 'Business & Marketing', re: /business|marketing|management|betriebswirt/i },
  { name: 'Sociology', re: /sociolog|soziolog/i },
  { name: 'Health Sciences', re: /health|medic|gesundheit|sa[úu]de/i },
];

/**
 * Words that mark the organisational unit within an affiliation string, in the
 * languages and abbreviations seen in metadata: English, German, Dutch,
 * Portuguese/Spanish, abbreviations ("Fac.", "Sch."), and Japanese unit
 * suffixes (研究科 graduate school, 専攻 programme, 学部 faculty, 学科 department).
 */
const UNIT = new RegExp([
  String.raw`\b(dep(t|artment)\.?|dept|school|sch\.|faculty|fac\.|institute|inst\.|instituto|institut|unit|group|centre|center|lab(oratory)?|college|coll\.|graduate|grad\.)`,
  String.raw`\b(fakult[äa]t|fachbereich|abteilung|lehrstuhl)`,       // German
  String.raw`\b(afdeling|faculteit|vakgroep)`,                        // Dutch
  String.raw`\b(faculdade|facultad|departamento)`,                    // Portuguese / Spanish
  '(研究科|専攻|学部|学科)',                                          // Japanese (no word boundaries)
  String.raw`\bof\b`,
].join('|'), 'i');

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function deriveDepartment(raw: string): DepartmentMatch {
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  // 1. A part that names a unit ("Department of Psychology") and matches a rule.
  for (const part of parts) {
    if (!UNIT.test(part)) continue;
    const rule = RULES.find(r => r.re.test(part));
    if (rule) return { raw, department: rule.name, slug: slugify(rule.name), method: 'unit', fragment: part };
  }
  // 2. Any part that matches a rule, even without a unit word ("Psychology, Halden …").
  for (const part of parts) {
    const rule = RULES.find(r => r.re.test(part));
    if (rule) return { raw, department: rule.name, slug: slugify(rule.name), method: 'keyword', fragment: part };
  }
  // 3. Nothing to go on: the string names only the institution or a place.
  return { raw, department: UNASSIGNED, slug: 'unassigned', method: 'unassigned', fragment: null };
}

/**
 * A researcher's department: the most frequent derived department across all
 * their affiliation strings, ignoring strings that could not be assigned.
 */
export function researcherDepartment(raws: string[]): { department: string; slug: string; matches: DepartmentMatch[] } {
  const matches = raws.map(deriveDepartment);
  const counts = new Map<string, number>();
  for (const m of matches) if (m.method !== 'unassigned') counts.set(m.department, (counts.get(m.department) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const department = best ? best[0] : UNASSIGNED;
  return { department, slug: slugify(department), matches };
}
