'use strict';
const NS = 'http://www.w3.org/2000/svg';

// ── THEME ──────────────────────────────────────────────────────────────────
const root = document.documentElement;
let darkMode = window.matchMedia('(prefers-color-scheme:dark)').matches;
function applyTheme() {
  root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('icon-sun').style.display = darkMode ? 'none' : 'block';
  document.getElementById('icon-moon').style.display = darkMode ? 'block' : 'none';
}
applyTheme();
document.getElementById('theme-toggle').addEventListener('click', () => {
  darkMode = !darkMode; applyTheme(); draw();
});

// ── PALETTE ────────────────────────────────────────────────────────────────
const DISC_COLORS = [
  '#185FA5','#0F6E56','#7F77DD','#854F0B','#993556',
  '#3B6D11','#BA7517','#5F5E5A','#D85A30','#534AB7',
  '#A32D2D','#0C7A7A','#6B4C9A','#7A5C00','#1A6B3A',
  '#8B4513','#2E4057','#6B6B00','#4A0E4E','#1B4F72','#784212'
];
const discColorMap = {};
let discColorIdx = 0;
function getDiscColor(disc) {
  if (!discColorMap[disc]) discColorMap[disc] = DISC_COLORS[discColorIdx++ % DISC_COLORS.length];
  return discColorMap[disc];
}
function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

const STATUS_COLORS = {
  replicated:'#2d9b5c', not_replicated:'#e05c30', mixed:'#c49a00',
  reversed:'#993556', unknown:'#888780'
};
const TYPE_CONF = {
  foundational: { c:'#185FA5', label:'Foundational', shape:'■' },
  critique:     { c:'#0F6E56', label:'Critique', shape:'●' },
  meta_analysis:{ c:'#534AB7', label:'Meta-analysis', shape:'■' },
  replication:  { c:'#3B6D11', label:'Replication', shape:'◆' },
  reproduction: { c:'#854F0B', label:'Reproduction', shape:'▲' },
  other:        { c:'#888780', label:'Other', shape:'○' },
};

// ── STATE ──────────────────────────────────────────────────────────────────
let state = { level: 0, field: null, disc: null, sub: null, effect: null };
const liveNodes = new Map();  // id → { el, x, y, r, color, data }
let VW = 0, VH = 0;
const svg = document.getElementById('net-svg');
const stage = document.getElementById('stage');
const hint = document.getElementById('hint');
const backBtn = document.getElementById('back-btn');

// ── RESIZE ─────────────────────────────────────────────────────────────────
function resize() {
  const rect = stage.getBoundingClientRect();
  VW = rect.width; VH = rect.height;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.setAttribute('width', VW);
  svg.setAttribute('height', VH);
}
window.addEventListener('resize', () => { resize(); render(); });
resize();

// ── API ────────────────────────────────────────────────────────────────────
async function api(path) {
  const r = await fetch(path);
  return r.json();
}

// ── BREADCRUMB ─────────────────────────────────────────────────────────────
function setBc() {
  const bc = document.getElementById('breadcrumb');
  const parts = [{ txt: 'All fields', action: () => jumpTo(0) }];
  if (state.field) parts.push({ txt: state.field, action: () => jumpTo(1) });
  if (state.disc)  parts.push({ txt: state.disc,  action: () => jumpTo(2) });
  if (state.sub && state.sub !== state.disc) parts.push({ txt: state.sub, action: () => jumpTo(3) });
  bc.innerHTML = '';
  parts.forEach((p, i) => {
    const last = i === parts.length - 1;
    const s = document.createElement('span');
    s.textContent = p.txt; s.className = 'crumb' + (last ? ' active' : '');
    if (!last) s.addEventListener('click', p.action);
    bc.appendChild(s);
    if (!last) { const sep = document.createElement('span'); sep.className='sep'; sep.textContent='›'; bc.appendChild(sep); }
  });
  backBtn.style.display = state.level > 0 ? 'block' : 'none';
}

function jumpTo(lvl) {
  if (lvl <= 0) { state = { level:0, field:null, disc:null, sub:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 1 && state.field) { state = { ...state, level:1, disc:null, sub:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 2 && state.disc)  { state = { ...state, level:2, sub:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 3 && state.sub)   { state = { ...state, level:3, effect:null }; closeTimeline(); render(); }
}

backBtn.addEventListener('click', () => jumpTo(state.level - 1));

// ── SVG HELPERS ────────────────────────────────────────────────────────────
function makeSvgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
  return el;
}

function makeNode({ id, x, y, r, color, lines, fs=12, kind='normal', onClick }) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'lh-node' + (kind==='anchor'?' lh-anchor':''));
  g.setAttribute('transform', `translate(${x},${y})`);

  const dark = darkMode;
  const fillColor = dark ? hexAlpha(color, 0.35) : hexAlpha(color, 0.18);
  const strokeColor = color;

  // Rounded rectangle: width driven by longest label line, height by r
  const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
  const rw = Math.max(r * 2, longestLine.length * fs * 0.62 + 14);
  const rh = r * 2;
  const cornerR = Math.round(r * 0.35);

  const rect = makeSvgEl('rect', {
    class:'nbg', x:-rw/2, y:-rh/2, width:rw, height:rh, rx:cornerR,
    fill: fillColor, stroke: strokeColor,
    'stroke-width': kind==='anchor' ? '1.2' : '1.5',
    'fill-opacity': kind==='anchor' ? '0.6' : '1',
  });
  g.appendChild(rect);

  // // Status ring (outer rounded rect)
  // if (statusColor && kind !== 'anchor') {
  //   const pad = 5;
  //   const ring = makeSvgEl('rect', {
  //     x:-(rw/2+pad), y:-(rh/2+pad), width:rw+pad*2, height:rh+pad*2, rx:cornerR+pad,
  //     fill: 'none', stroke: statusColor, 'stroke-width': '2',
  //     'stroke-opacity': '0.5', 'stroke-dasharray': '4 3',
  //   });
  //   g.insertBefore(ring, rect);
  // }

  const lh = (fs + 3.5);
  const startY = -((lines.length - 1) * lh) / 2;
  const txt = makeSvgEl('text', {
    class:'nlabel', 'text-anchor':'middle', 'dominant-baseline':'central',
    fill: dark ? '#e0ddd5' : (kind==='anchor' ? hexAlpha(color,0.7) : color),
    'font-size': fs, 'font-weight': kind==='anchor' ? '400' : '500',
  });
  lines.forEach((line, i) => {
    const tspan = makeSvgEl('tspan', { x: '0', y: startY + i * lh });
    tspan.textContent = line;
    txt.appendChild(tspan);
  });
  g.appendChild(txt);

  if (onClick) {
    g.addEventListener('click', onClick);
    g.addEventListener('touchend', e => { e.preventDefault(); onClick(); });
  }
  return g;
}

function makeEdge(x1, y1, x2, y2, color, delay=0) {
  const line = makeSvgEl('line', {
    class:'lh-edge', x1, y1, x2, y2,
    stroke: color, 'stroke-width':'1',
    'stroke-opacity':'0', 'stroke-linecap':'round',
  });
  svg.insertBefore(line, svg.firstChild);
  setTimeout(() => {
    line.style.transition = 'stroke-opacity .35s ease, x2 .5s ease, y2 .5s ease';
    line.setAttribute('stroke-opacity', '0.22');
  }, delay);
  return line;
}

// ── ANIMATION ──────────────────────────────────────────────────────────────
function animate(el, props, dur=520, delay=0, onDone) {
  const ease = t => t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  const start = performance.now() + delay;
  const from = {};
  for (const k in props) from[k] = props[k][0];
  function step(now) {
    const t = Math.max(0, Math.min(1, (now - start) / dur));
    const e = ease(t);
    for (const k in props) {
      const v = props[k][0] + (props[k][1] - props[k][0]) * e;
      if (k === 'tx') el.setAttribute('transform', `translate(${v},${tyCur(el)})`);
      else if (k === 'ty') el.setAttribute('transform', `translate(${txCur(el)},${v})`);
      else if (k === 'r') el.querySelector('.nbg')?.setAttribute('r', v);
      else if (k === 'opacity') el.style.opacity = v;
    }
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

function txCur(el) {
  const m = (el.getAttribute('transform')||'').match(/translate\(([^,)]+)/);
  return m ? parseFloat(m[1]) : 0;
}
function tyCur(el) {
  const m = (el.getAttribute('transform')||'').match(/translate\([^,]+,([^)]+)/);
  return m ? parseFloat(m[1]) : 0;
}

// ── CLEAR / TRANSITION ─────────────────────────────────────────────────────
function clearEdges() {
  svg.querySelectorAll('.lh-edge').forEach(e => {
    e.style.transition = 'stroke-opacity .2s';
    e.setAttribute('stroke-opacity','0');
    setTimeout(() => e.parentNode?.removeChild(e), 220);
  });
}

function spawnNode(nodeEl, fromX, fromY, toX, toY, toR, delay) {
  nodeEl.setAttribute('transform', `translate(${fromX},${fromY})`);
  nodeEl.style.opacity = '0';
  svg.appendChild(nodeEl);
  setTimeout(() => {
    nodeEl.style.transition = 'opacity .25s';
    nodeEl.style.opacity = '1';
    animate(nodeEl, { tx:[fromX,toX], ty:[fromY,toY] }, 540, 0);
    // Scale shape from tiny to full size
    const c = nodeEl.querySelector('.nbg');
    if (c) {
      const ease = t => t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      const s = performance.now();
      (function step(now) {
        const tt = Math.min(1,(now-s)/540); const e=ease(tt);
        const sc = 0.1 + 0.9*e;
        c.setAttribute('transform', `scale(${sc})`);
        if(tt<1) requestAnimationFrame(step);
        else c.removeAttribute('transform');
      })(s);
    }
  }, delay);
}

// ── WRAPTEXT ───────────────────────────────────────────────────────────────
function wrap(label, maxCh=14) {
  const words = label.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur+' '+w : w;
    if (test.length > maxCh && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── RENDER STATE MACHINE ───────────────────────────────────────────────────
async function render() {
  resize(); setBc(); clearEdges();

  // Remove non-anchor nodes with fade
  liveNodes.forEach((n, id) => {
    n.el.style.transition = 'opacity .25s';
    n.el.style.opacity = '0';
    setTimeout(() => n.el.parentNode?.removeChild(n.el), 260);
  });
  liveNodes.clear();

  if (state.level === 0) {
    hint.textContent = 'Click a field to explore disciplines';
    await renderFields();
  } else if (state.level === 1) {
    hint.textContent = 'Click a discipline';
    await renderDiscs();
  } else if (state.level === 2) {
    hint.textContent = 'Click an effect to see evidence';
    await renderEffects();
  } else if (state.level === 3) {
    hint.textContent = 'Click an effect to see evidence';
    await renderEffectsInSub();
  }
}

// Level 0: Fields as big bubbles
async function renderFields() {
  const fields = await api('/api/fields');
  const names = Object.keys(fields);
  const cx = VW/2, cy = VH/2;
  const rx = Math.min(VW, VH) * 0.31;
  const ry = Math.min(VW, VH) * 0.26;




  const hub = makeNode({
    id:'__hub__', x:cx, y:cy, r:25,
    color:'22ABA6', lines:['All', 'Disciplines'], fs:20, kind:'hub',
    onClick:() => jumpTo(0),
  });
  hub.setAttribute('transform', `translate(${cx},${cy})`);
  hub.style.opacity = '0';
  svg.appendChild(hub);
  setTimeout(() => { hub.style.transition='opacity .3s'; hub.style.opacity='1'; }, 50);
  liveNodes.set('__hub__', { el:hub, x:cx, y:cy, r:18 });

  names.forEach((name, i) => {
    const a = (i/names.length)*Math.PI*2 - Math.PI/2;
    const tx = cx + rx*Math.cos(a), ty = cy + ry*Math.sin(a);
    const color = getDiscColor(name);
    const r = Math.min(54, Math.max(40, 680/names.length));
    const node = makeNode({
      id:'field_'+i, x:tx, y:ty, r,
      color, lines:wrap(name, 12), fs:11,
      onClick:() => { state.field=name; state.level=1; render(); },
    });
    spawnNode(node, cx, cy, tx, ty, r, 60+i*35);
    liveNodes.set('field_'+i, { el:node, x:tx, y:ty, r, color });
    setTimeout(() => makeEdge(cx, cy, tx, ty, color, 0), 80+i*35);
  });
}

// Level 1: Disciplines for selected field
async function renderDiscs() {
  const allDiscs = await api('/api/disciplines');
  const discs = allDiscs.filter(d => d.field === state.field);
  const cx = VW*0.32, cy = VH/2;
  const anchorX = 70, anchorY = cy;

  // Field anchor on left
  const color = getDiscColor(state.field);
  const anchor = makeNode({
    id:'__field__', x:anchorX, y:anchorY, r:36,
    color, lines:wrap(state.field,10), fs:10, kind:'anchor',
    onClick:()=>jumpTo(0),
  });
  anchor.setAttribute('transform', `translate(${anchorX},${anchorY})`);
  svg.appendChild(anchor);
  setTimeout(()=>{ anchor.style.transition='opacity .3s'; anchor.style.opacity='1'; },30);
  liveNodes.set('__field__', { el:anchor, x:anchorX, y:anchorY, r:36, color });

  const n = discs.length;
  const spread = Math.min(VH*0.82, n*84);
  const startY = cy - spread/2;

  discs.forEach((d, i) => {
    const tx = cx + (i%2===0 ? 0 : 55);
    const ty = n===1 ? cy : startY + (i/(n-1))*spread;
    const dc = getDiscColor(d.name);
    const r = 42;
    const node = makeNode({
      id:'disc_'+i, x:tx, y:ty, r,
      color:dc, lines:wrap(d.name,12), fs:11,
      onClick:()=>{ state.disc=d.name; state.sub=d.name; state.level=2; render(); },
    });
    spawnNode(node, anchorX, anchorY, tx, ty, r, 80+i*40);
    liveNodes.set('disc_'+i, { el:node, x:tx, y:ty, r, color:dc });
    setTimeout(()=>makeEdge(anchorX, anchorY, tx, ty, dc, 0), 110+i*40);
  });
}

// Level 2: Effects for selected discipline (flat, since sub == disc)
async function renderEffects() {
  const effects = await api(`/api/effects?discipline=${encodeURIComponent(state.disc)}`);
  drawEffectsLayout(effects, state.disc);
}
async function renderEffectsInSub() {
  const effects = await api(`/api/effects?sub_discipline=${encodeURIComponent(state.sub)}`);
  drawEffectsLayout(effects, state.sub);
}

function drawEffectsLayout(effects, anchorLabel) {
  const discColor = getDiscColor(state.disc||state.field);

  // Discipline anchor
  const dAnchorX = 65, dAnchorY = VH/2;
  const dAnchor = makeNode({
    id:'__disc__', x:dAnchorX, y:dAnchorY, r:30,
    color:discColor, lines:wrap(anchorLabel,10), fs:10, kind:'anchor',
    onClick:()=>jumpTo(state.level-1),
  });
  dAnchor.setAttribute('transform', `translate(${dAnchorX},${dAnchorY})`);
  svg.appendChild(dAnchor);
  setTimeout(()=>{ dAnchor.style.transition='opacity .3s'; dAnchor.style.opacity='1'; },20);
  liveNodes.set('__disc__', { el:dAnchor, x:dAnchorX, y:dAnchorY, r:30, color:discColor });

  const tlOpen = document.getElementById('timeline-panel').classList.contains('open');
  const rightEdge = tlOpen ? VW - 400 : VW - 20;
  const leftEdge  = dAnchorX + 90;
  const n = effects.length;

  // Adaptive layout: scale columns, radius, font, and wrap width with effect count
  const numCols = n > 100 ? 6 : n > 70 ? 5 : n > 40 ? 4 : n > 20 ? 3 : n > 10 ? 2 : 1;
  const baseR   = n > 100 ? 14 : n > 70 ? 15 : n > 40 ? 18 : n > 20 ? 22 : n > 10 ? 26 : 30;
  const nodeFs  = n > 70  ? 8  : n > 30  ? 9  : 10;
  const wrapCh  = n > 70  ? 9  : n > 30  ? 11 : 13;
  const lh      = nodeFs + 3;
  // Max lines that can fit inside baseR without overflow
  const maxLines = Math.max(1, Math.floor((baseR * 2 - 6) / lh));

  const effectsPerCol = Math.ceil(n / numCols);
  const rowSpacing    = baseR * 2 + 8;
  const spread        = Math.min(VH * 0.9, effectsPerCol * rowSpacing);
  const startY        = VH / 2 - spread / 2;

  // Distribute columns evenly across available horizontal space
  const colW   = (rightEdge - leftEdge) / numCols;
  const startX = leftEdge + colW / 2;

  // Stagger spawn so last node appears within ~600 ms regardless of count
  const delayStep = Math.max(4, Math.min(18, Math.floor(600 / (n || 1))));

  effects.forEach((eff, i) => {
    const col = Math.floor(i / effectsPerCol);
    const row = i % effectsPerCol;
    const tx  = startX + col * colW;
    const ty  = effectsPerCol === 1 ? VH / 2
      : startY + (row / (effectsPerCol - 1 || 1)) * spread;
    // const sc  = STATUS_COLORS[eff.status] || STATUS_COLORS.unknown;

    let lines = wrap(eff.name, wrapCh);
    let r;
    if (n <= 10) {
      // Small count: expand circle to fit all text
      const rFromText = Math.ceil(lines.length * lh / 2) + 5;
      r = Math.max(baseR, rFromText);
    } else {
      // Larger count: fixed radius, truncate overflow with ellipsis
      r = baseR;
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1].replace(/.\s*$/, '…');
      }
    }

    const node = makeNode({
      id:'eff_'+i, x:tx, y:ty, r,
      color:discColor, lines, fs:nodeFs,
      // statusColor:sc,
      onClick:()=>openEffect(eff.id),
    });
    spawnNode(node, dAnchorX, dAnchorY, tx, ty, r, 60 + i * delayStep);
    liveNodes.set('eff_'+i, { el:node, x:tx, y:ty, r, color:discColor });
    if (i < 60) setTimeout(()=>makeEdge(dAnchorX, dAnchorY, tx, ty, discColor, 0), 80 + i * delayStep);
  });

  if (n === 0) hint.textContent = 'No effects found for this discipline';
}

// ── EFFECT DETAIL / TIMELINE ───────────────────────────────────────────────
const tlPanel = document.getElementById('timeline-panel');
const tlTitle = document.getElementById('tl-title');
const tlDesc  = document.getElementById('tl-desc');
const tlStatus = document.getElementById('tl-status-badge');
const tlBody  = document.getElementById('tl-body');

const STATUS_LABELS = {
  replicated: 'Replicated', not_replicated: 'Not replicated',
  reversed: 'Reversed', mixed: 'Mixed evidence', unknown: 'Unknown',
};
const STATUS_BG = {
  replicated:'#2d9b5c22', not_replicated:'#e05c3022', reversed:'#99355622', mixed:'#c49a0022', unknown:'#88878022'
};

async function openEffect(effectId) {
  const data = await api(`/api/effect/${effectId}`);
  tlTitle.textContent = data.name;
  tlDesc.textContent = data.description || '';
  // const sc = STATUS_COLORS[data.status] || STATUS_COLORS.unknown;
  // const bg = STATUS_BG[data.status] || STATUS_BG.unknown;
  // tlStatus.innerHTML = `<span class="status-badge" style="background:${bg};color:${sc}">${STATUS_LABELS[data.status]||data.status}</span>`;

  tlBody.innerHTML = '';
  const spine = document.createElement('div'); spine.className='tl-spine'; tlBody.appendChild(spine);

  const papers = (data.papers||[]).slice().sort((a,b)=>{
    const ay = a.year ?? -Infinity, by = b.year ?? -Infinity;
    return ay - by;
  });

  if (papers.length === 0) {
    tlBody.innerHTML += '<div style="padding:18px 4px;font-size:12px;color:var(--text3);text-align:center;font-style:italic">No papers on record for this effect.</div>';
  }

  papers.forEach((p, i) => {
    const tc = TYPE_CONF[p.classification] || TYPE_CONF.other;
    const row = document.createElement('div');
    row.className = 'tl-row';
    row.style.animationDelay = (i*45)+'ms';

    const retraction_badge = `<div id="tl-status-badge"><span class="status-badge" style="background:${STATUS_BG.reversed};color:${STATUS_COLORS.reversed}">Retracted</span></div>`;


    const doiHtml = p.doi && p.doi !== 'nan'
      ? `<a class="tl-doi" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">doi:${p.doi}</a>`
      : '';
    const apaHtml = p.apa && p.apa !== 'nan' && p.apa !== p.doi
      ? `<div class="tl-journal" style="margin-top:3px;font-style:normal;font-size:10px;opacity:.7">${p.apa.substring(0,120)}${p.apa.length>120?'…':''}</div>`
      : '';

    row.innerHTML = `
      <div class="tl-year" style="color:${tc.c};opacity:.8">${p.year ?? '—'}</div>
      <div class="tl-dot-wrap">
        <div class="tl-dot" style="border-color:${tc.c};color:${tc.c}">${tc.shape}</div>
      </div>
      <div class="tl-content">
        <div class="tl-type" style="color:${tc.c}">${tc.label}</div>
        <div class="tl-paper-title">${p.title||'Untitled'}</div>
        ${p.retracted ? retraction_badge : ''}
        ${apaHtml}
        <div class="tl-summary">${p.summary||''}</div>
        ${doiHtml}
      </div>`;
    tlBody.appendChild(row);
  });

  const fr = data.foundational_retraction;

  if (fr?.retracted) {
    const originalDoiHtml = fr.original_doi
      ? `<a class="tl-doi" href="https://doi.org/${fr.original_doi}" target="_blank" rel="noopener">Original DOI: ${fr.original_doi}</a>`
      : '';

    const retractionDoiHtml = fr.retraction_doi
      ? `<a class="tl-doi" href="https://doi.org/${fr.retraction_doi}" target="_blank" rel="noopener">Retraction DOI: ${fr.retraction_doi}</a>`
      : '';

    const pubmedHtml = fr.retraction_pubmed_id
      ? `<a class="tl-doi" href="https://pubmed.ncbi.nlm.nih.gov/${fr.retraction_pubmed_id}/" target="_blank" rel="noopener">Retraction PubMed: ${fr.retraction_pubmed_id}</a>`
      : '';

    const retractionDateHtml = fr.retraction_date
      ? `<div class="tl-retraction-meta">Retraction date: ${fr.retraction_date}</div>`
      : '';

    const footer = document.createElement('div');
    footer.className = 'tl-retraction-footer';
    footer.innerHTML = `
      <div class="tl-retraction-title">Foundational Paper Retracted</div>
      ${retractionDateHtml}
      ${originalDoiHtml}
      ${retractionDoiHtml}
      ${pubmedHtml}
    `;
    tlBody.appendChild(footer);
  }

  tlPanel.classList.add('open');
}

function closeTimeline() {
  tlPanel.classList.remove('open');
}
document.getElementById('tl-close').addEventListener('click', closeTimeline);

// ── SEARCH ─────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.classList.remove('open'); return; }
  searchTimeout = setTimeout(async () => {
    const results = await api(`/api/search?q=${encodeURIComponent(q)}`);
    searchResults.innerHTML = '';
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="sr-item" style="color:var(--text3)">No results</div>';
    } else {
      results.forEach(r => {
        const div = document.createElement('div'); div.className = 'sr-item';
        div.innerHTML = `<div class="sr-item-name">${r.name}</div><div class="sr-item-disc">${r.discipline}</div>`;
        div.addEventListener('click', () => {
          searchResults.classList.remove('open');
          searchInput.value = '';
          openEffect(r.id);
        });
        searchResults.appendChild(div);
      });
    }
    searchResults.classList.add('open');
  }, 250);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap')) searchResults.classList.remove('open');
});

// ── INIT ───────────────────────────────────────────────────────────────────
function draw() { /* refresh color fills on theme change */
  liveNodes.forEach(n => {
    if (!n.el) return;
    const c = n.el.querySelector('.nbg');
    if (c && n.color) {
      c.setAttribute('fill', darkMode ? hexAlpha(n.color,.35) : hexAlpha(n.color,.18));
    }
    const t = n.el.querySelector('text');
    if (t) t.setAttribute('fill', darkMode ? '#e0ddd5' : n.color);
  });
}

render();
