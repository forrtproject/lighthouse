'use strict';

// ── THEME ──────────────────────────────────────────────────────────────────
// Same storage key as the explorer and About page, so the choice is shared.
const root = document.documentElement;
let darkMode = root.getAttribute('data-theme') === 'dark';
function applyTheme() {
  root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch (_) { /* private mode */ }
  document.getElementById('icon-sun').style.display = darkMode ? 'none' : 'block';
  document.getElementById('icon-moon').style.display = darkMode ? 'block' : 'none';
}
applyTheme();
document.getElementById('theme-toggle').addEventListener('click', () => { darkMode = !darkMode; applyTheme(); });

// ── HELPERS ────────────────────────────────────────────────────────────────
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]
  ));
}
async function api(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Request failed (${r.status}): ${path}`);
  return r.json();
}
const fmt = n => Number(n).toLocaleString('en');
const plural = (n, one, many = one + 's') => `${fmt(n)} ${n === 1 ? one : many}`;

// Links into the explorer; it reads these parameters on load.
function exploreUrl({ field, discipline, cluster, effect } = {}) {
  const p = new URLSearchParams();
  if (field) p.set('field', field);
  if (discipline) p.set('discipline', discipline);
  if (cluster) p.set('cluster', cluster);
  if (effect) p.set('effect', effect);
  const qs = p.toString();
  return '/explore' + (qs ? `?${qs}` : '');
}

// Same palette and assignment rule as the explorer's top level (fields in
// alphabetical order), so a field keeps its colour on both pages.
const DISC_COLORS = [
  '#185FA5','#0F6E56','#7F77DD','#854F0B','#993556',
  '#3B6D11','#BA7517','#5F5E5A','#D85A30','#534AB7',
  '#A32D2D','#0C7A7A','#6B4C9A','#7A5C00','#1A6B3A',
  '#8B4513','#2E4057','#6B6B00','#4A0E4E','#1B4F72','#784212'
];

const KINDS = [
  ['foundational', 'Foundational', 'var(--type-foundational)'],
  ['replication', 'Replication', 'var(--type-replication)'],
  ['reproduction', 'Reproduction', 'var(--type-reproduction)'],
  ['meta_analysis', 'Meta-analysis', 'var(--type-meta)'],
  ['critique', 'Critique', 'var(--type-critique)'],
  ['other', 'Other', 'var(--type-other)'],
];

// ── OVERVIEW: numbers, fields, featured effects ───────────────────────────
async function loadOverview() {
  const fieldGrid = document.getElementById('field-grid');
  const effectGrid = document.getElementById('effect-grid');
  let data;
  try {
    data = await api('/api/overview');
  } catch (err) {
    console.error(err);
    const msg = '<p class="load-error">Could not load data. Check your connection and try again.</p>';
    fieldGrid.innerHTML = msg; effectGrid.innerHTML = msg;
    fieldGrid.removeAttribute('aria-busy'); effectGrid.removeAttribute('aria-busy');
    return;
  }

  const t = data.totals;
  document.querySelectorAll('[data-total]').forEach(el => {
    const v = t[el.dataset.total];
    if (v != null) el.textContent = fmt(v);
  });

  // Fields
  const alpha = data.fields.map(f => f.name).sort();
  const maxEffects = Math.max(...data.fields.map(f => f.effect_count), 1);
  fieldGrid.innerHTML = data.fields.map(f => {
    const color = DISC_COLORS[alpha.indexOf(f.name) % DISC_COLORS.length];
    const chips = f.disciplines.map(d => `
      <a class="fc-chip" href="${esc(exploreUrl({ field: f.name, discipline: d.name }))}"
         aria-label="${esc(`${d.name}: ${plural(d.effect_count, 'effect')}`)}">
        ${esc(d.name)} <b>${fmt(d.effect_count)}</b>
      </a>`).join('');
    return `
      <article class="field-card${f.disciplines.length > 4 ? ' wide' : ''}" style="--c:${color}">
        <div class="fc-head">
          <a class="fc-title" href="${esc(exploreUrl({ field: f.name }))}">${esc(f.name)}</a>
          <span class="fc-count">${plural(f.effect_count, 'effect')}</span>
        </div>
        <div class="fc-bar" aria-hidden="true"><span style="width:${Math.max(4, (f.effect_count / maxEffects) * 100)}%"></span></div>
        <div class="fc-discs">${chips}</div>
      </article>`;
  }).join('');
  fieldGrid.removeAttribute('aria-busy');

  // Featured effects
  effectGrid.innerHTML = data.featured.map(e => {
    const present = KINDS.filter(([k]) => e.kinds[k]);
    const bar = present.map(([k, , c]) => `<span style="--c:${c};flex:${e.kinds[k]}"></span>`).join('');
    const legend = present.map(([k, label, c]) =>
      `<span><i style="--c:${c}"></i>${fmt(e.kinds[k])} ${esc(label.toLowerCase())}</span>`).join('');
    return `
      <a class="effect-card" href="${esc(exploreUrl({ field: e.field, discipline: e.discipline, cluster: e.cluster, effect: e.id }))}">
        <span class="ec-where">${esc(e.discipline)} · ${esc(e.cluster)}</span>
        <span class="ec-name">${esc(e.name)}</span>
        <span class="ec-bar" aria-hidden="true">${bar}</span>
        <span class="ec-kinds">${legend}</span>
        <span class="ec-foot">See the evidence (${plural(e.papers, 'paper')})
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </a>`;
  }).join('');
  effectGrid.removeAttribute('aria-busy');
}
loadOverview();

// ── SEARCH (combobox) ──────────────────────────────────────────────────────
const form = document.getElementById('hero-search');
const input = document.getElementById('hero-q');
const list = document.getElementById('hero-results');
const hint = document.getElementById('hero-hint');
const HINT = hint.textContent;
let searchSeq = 0, searchTimer, options = [], active = -1, shownQuery = '';

function closeList() {
  list.classList.remove('open');
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
  active = -1;
}
function setActive(i) {
  options.forEach(o => o.setAttribute('aria-selected', 'false'));
  active = i;
  if (i >= 0 && options[i]) {
    options[i].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', options[i].id);
    options[i].scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
}

function renderResults(payload) {
  const effects = payload.effects || [], clusters = payload.clusters || [];
  if (!effects.length && !clusters.length) {
    list.innerHTML = '<div class="hs-empty">No matching effects or tags</div>';
  } else {
    let html = '', n = 0;
    if (effects.length) {
      html += '<div class="hs-group" role="group" aria-label="Effects"><div class="hs-group-title" aria-hidden="true">Effects</div>';
      html += effects.map(r => `
        <a class="hs-opt" role="option" id="hs-opt-${n++}" aria-selected="false"
           href="${esc(exploreUrl({ field: r.field, discipline: r.discipline, cluster: r.clusters?.[0], effect: r.id }))}">
          <span class="hs-opt-main"><span class="hs-opt-name">${esc(r.name)}</span>
          <span class="hs-opt-meta">${esc(r.discipline)}${r.clusters?.[0] ? ' · ' + esc(r.clusters[0]) : ''}</span></span>
        </a>`).join('');
      html += '</div>';
    }
    if (clusters.length) {
      html += '<div class="hs-group" role="group" aria-label="Tags"><div class="hs-group-title" aria-hidden="true">Tags</div>';
      html += clusters.map(c => `
        <a class="hs-opt" role="option" id="hs-opt-${n++}" aria-selected="false"
           href="${esc(exploreUrl({ field: c.field, discipline: c.discipline, cluster: c.name }))}">
          <span class="hs-opt-main"><span class="hs-opt-name">${esc(c.name)}</span>
          <span class="hs-opt-meta">${esc(c.discipline)} · ${plural(c.effect_count, 'effect')}</span></span>
          <span class="hs-kind">Tag</span>
        </a>`).join('');
      html += '</div>';
    }
    list.innerHTML = html;
  }
  options = [...list.querySelectorAll('.hs-opt')];
  active = -1;
  list.classList.add('open');
  input.setAttribute('aria-expanded', 'true');
  hint.textContent = options.length
    ? `${plural(options.length, 'result')}. Use the arrow keys and Enter to open one.`
    : HINT;
}

async function runSearch(q) {
  const seq = ++searchSeq;
  try {
    const payload = await api(`/api/search?q=${encodeURIComponent(q)}`);
    if (seq !== searchSeq) return false;     // a newer query is in flight
    renderResults(payload);
    shownQuery = q;
    return true;
  } catch (err) {
    console.error(err);
    if (seq !== searchSeq) return false;
    list.innerHTML = '<div class="hs-empty">Search is unavailable right now</div>';
    options = []; list.classList.add('open'); input.setAttribute('aria-expanded', 'true');
    return false;
  }
}

input.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = input.value.trim();
  if (q.length < 2) { ++searchSeq; closeList(); hint.textContent = HINT; return; }
  searchTimer = setTimeout(() => runSearch(q), 220);
});

input.addEventListener('keydown', e => {
  if (!list.classList.contains('open') || !options.length) {
    if (e.key === 'Escape') closeList();
    return;
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % options.length); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active <= 0 ? options.length - 1 : active - 1); }
  else if (e.key === 'Escape') { e.preventDefault(); closeList(); }
});

// Enter / the Search button opens the highlighted result, or the first one.
form.addEventListener('submit', async e => {
  e.preventDefault();
  const q = input.value.trim();
  if (q.length < 2) { hint.textContent = 'Type at least two characters to search.'; input.focus(); return; }
  // Results on screen may be for an earlier query if Enter came quickly.
  if (!list.classList.contains('open') || shownQuery !== q) { clearTimeout(searchTimer); await runSearch(q); }
  const target = options[active >= 0 ? active : 0];
  if (target) location.href = target.href;
});

document.addEventListener('click', e => { if (!form.contains(e.target)) closeList(); });
