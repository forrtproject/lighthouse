/**
 * Normalise a DOI typed in any common form:
 * "https://doi.org/10.x/Y", "doi:10.x/y", " 10.X/Y " → "10.x/y".
 * DOIs are case-insensitive, so the key is lower-cased.
 */
export function normalizeDoi(input: string): string {
  let s = (input ?? '').trim();
  try { s = decodeURIComponent(s); } catch { /* keep as typed */ }
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  return s.toLowerCase();
}

/** True when the string looks like a DOI after normalisation. */
export function looksLikeDoi(input: string): boolean {
  return /^10\.\d{4,9}\/\S+$/.test(normalizeDoi(input));
}
