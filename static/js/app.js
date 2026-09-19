'use strict';
const NS = 'http://www.w3.org/2000/svg';

// ── THEME ──────────────────────────────────────────────────────────────────
const root = document.documentElement;
let darkMode = localStorage.getItem('theme') === 'dark' || (localStorage.getItem('theme') === null && window.matchMedia('(prefers-color-scheme:dark)').matches);
function applyTheme() {
  root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
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

const HUB_COLOR = '#22ABA6';

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
let state = { level: 0, field: null, disc: null, sub: null, cluster: null, effect: null };
const liveNodes = new Map();  // id → { el, x, y, r, color, data }
let VW = 0, VH = 0;
const svg = document.getElementById('net-svg');
const stage = document.getElementById('stage');
const hint = document.getElementById('hint');
const backBtn = document.getElementById('back-btn');

// ── RESIZE ─────────────────────────────────────────────────────────────────
const scroller = document.getElementById('net-scroll');
function setSvgHeight(h) {
  svg.setAttribute('viewBox', `0 0 ${VW} ${h}`);
  svg.setAttribute('width', VW);
  svg.setAttribute('height', h);
}
function resize() {
  // VW/VH are the visible area. The SVG itself may be taller (see
  // drawEffectsLayout), in which case #net-scroll scrolls it.
  VW = scroller.clientWidth; VH = scroller.clientHeight;
  setSvgHeight(VH);
}
let resizeTimer;
window.addEventListener('resize', () => {
  // Debounced: a window drag fires dozens of resize events.
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { resize(); render(); }, 150);
});
resize();

// ── ESCAPING ───────────────────────────────────────────────────────────────
// All spreadsheet text goes through esc() before it is put into innerHTML.
// Summaries routinely contain "<" and "&" (e.g. "p<.05", "Smith & Jones").
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]
  ));
}
function cleanDoi(v) {
  let doi = String(v ?? '').trim();
  try { doi = decodeURIComponent(doi); } catch (_) { /* keep as is */ }
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : '';   // drops "not available" etc.
}
const doiHref = doi => `https://doi.org/${encodeURI(doi)}`;
const safeUrl = v => (/^https?:\/\//i.test(String(v ?? '').trim()) ? String(v).trim() : '');

// ── API ────────────────────────────────────────────────────────────────────
async function api(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Request failed (${r.status}): ${path}`);
  return r.json();
}
const LOAD_ERROR = 'Could not load data. Check your connection and try again.';

// ── BREADCRUMB ─────────────────────────────────────────────────────────────
function setBc() {
  const bc = document.getElementById('breadcrumb');
  const parts = [{ txt: 'All fields', action: () => jumpTo(0) }];
  if (state.field) parts.push({ txt: state.field, action: () => jumpTo(1) });
  if (state.disc)  parts.push({ txt: state.disc,  action: () => jumpTo(2) });
  if (state.cluster) parts.push({ txt: state.cluster, action: () => jumpTo(3) });
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
  if (lvl <= 0) { state = { level:0, field:null, disc:null, sub:null, cluster:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 1 && state.field) { state = { ...state, level:1, disc:null, sub:null, cluster:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 2 && state.disc)  { state = { ...state, level:2, sub:null, cluster:null, effect:null }; closeTimeline(); render(); }
  else if (lvl === 3 && state.cluster)   { state = { ...state, level:3, effect:null }; closeTimeline(); render(); }
  else if (lvl === 4 && state.effect) { state = { ...state, level:4 }; closeTimeline(); render(); }
  else if (lvl > 0 && lvl < state.level) jumpTo(lvl - 1);  // target level has no state: keep going up rather than dead-end
}

backBtn.addEventListener('click', () => jumpTo(state.level - 1));

// ── SVG HELPERS ────────────────────────────────────────────────────────────
function makeSvgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
  return el;
}

function makeNode({ id, x, y, r, color, lines, fs=12, kind='normal', onClick, boxWidth, boxHeight }) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'lh-node' + (kind==='anchor'?' lh-anchor':''));
  g.setAttribute('transform', `translate(${x},${y})`);

  const dark = darkMode;
  const fillColor = dark ? hexAlpha(color, 0.35) : hexAlpha(color, 0.18);
  const strokeColor = color;

  // Rounded rectangle: width driven by longest label line, height by r
  const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
  const rw = boxWidth || Math.max(r * 2, longestLine.length * fs * 0.62 + 14);
  const rh = boxHeight || r * 2;
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
    // Treat a touch as a tap only if the finger barely moved, so dragging to
    // scroll a long list does not open whatever node the finger started on.
    let touchStart = null;
    g.addEventListener('touchstart', e => {
      const t = e.touches[0]; touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    g.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      const moved = !touchStart || Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 10;
      touchStart = null;
      if (moved) return;
      e.preventDefault(); onClick();
    });
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
// Every render() gets a sequence number. Renders are async (they await the
// API) and schedule delayed work, so an older render must stop touching the
// SVG once a newer one has started. Otherwise views stack on top of each other.
let renderSeq = 0;
const isStale = seq => seq !== renderSeq;
function later(seq, fn, ms) {
  setTimeout(() => { if (!isStale(seq)) fn(); }, ms);
}

async function render() {
  const seq = ++renderSeq;
  scroller.scrollTop = 0;
  resize(); setBc(); clearEdges();

  // Remove non-anchor nodes with fade
  liveNodes.forEach((n, id) => {
    n.el.style.transition = 'opacity .25s';
    n.el.style.opacity = '0';
    setTimeout(() => n.el.parentNode?.removeChild(n.el), 260);
  });
  liveNodes.clear();

  try {
    await renderLevel(seq);
  } catch (err) {
    console.error(err);
    if (!isStale(seq)) hint.textContent = LOAD_ERROR;
  }
}

async function renderLevel(seq) {
  if (state.level === 0) {
    hint.textContent = 'Click a field to explore disciplines';
    await renderFields(seq);
  } else if (state.level === 1) {
    hint.textContent = 'Click a discipline';
    await renderDiscs(seq);
  } else if (state.level === 2) {
    hint.textContent = 'Click a cluster to filter effects';
    await renderClusters(seq);
  } else if (state.level === 3) {
    hint.textContent = 'Click an effect to see evidence';
    await renderEffectsByCluster(seq);
  }
}

// Level 0: Fields as big bubbles
async function renderFields(seq) {
  const fields = await api('/api/fields');
  if (isStale(seq)) return;
  const names = Object.keys(fields);
  const cx = VW/2, cy = VH/2;
  const rx = Math.min(VW, VH) * 0.31;
  const ry = Math.min(VW, VH) * 0.26;




  const hub = makeNode({
    id:'__hub__', x:cx, y:cy, r:25,
    color:HUB_COLOR, lines:['All', 'Disciplines'], fs:20, kind:'hub',
    onClick:() => jumpTo(0),
  });
  hub.setAttribute('transform', `translate(${cx},${cy})`);
  hub.style.opacity = '0';
  svg.appendChild(hub);
  setTimeout(() => { hub.style.transition='opacity .3s'; hub.style.opacity='1'; }, 50);
  liveNodes.set('__hub__', { el:hub, x:cx, y:cy, r:18, color:HUB_COLOR });

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
    later(seq, () => makeEdge(cx, cy, tx, ty, color, 0), 80+i*35);
  });
}

// Level 1: Disciplines for selected field
async function renderDiscs(seq) {
  const allDiscs = await api('/api/disciplines');
  if (isStale(seq)) return;
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
  liveNodes.set('__field__', { el:anchor, x:anchorX, y:anchorY, r:36, color, kind:'anchor' });

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
    later(seq, () => makeEdge(anchorX, anchorY, tx, ty, dc, 0), 110+i*40);
  });
}

// Level 2: Clusters for selected discipline
async function renderClusters(seq) {
  const clusters = await api(`/api/clusters/${encodeURIComponent(state.disc)}`);
  if (isStale(seq)) return;
  const cy = VH/2;
  const anchorX = 70, anchorY = cy;

  // Discipline anchor on left
  const color = getDiscColor(state.disc);
  const anchor = makeNode({
    id:'__disc__', x:anchorX, y:anchorY, r:36,
    color, lines:wrap(state.disc,10), fs:10, kind:'anchor',
    onClick:()=>jumpTo(1),
  });
  anchor.setAttribute('transform', `translate(${anchorX},${anchorY})`);
  svg.appendChild(anchor);
  setTimeout(()=>{ anchor.style.transition='opacity .3s'; anchor.style.opacity='1'; },30);
  liveNodes.set('__disc__', { el:anchor, x:anchorX, y:anchorY, r:36, color, kind:'anchor' });

  const n = clusters.length;
  const tlOpen = document.getElementById('timeline-panel').classList.contains('open');
  const rightEdge = tlOpen ? VW - 400 : VW - 20;
  const leftEdge = anchorX + 95;
  const numCols = n > 20 ? 4 : n > 12 ? 3 : n > 6 ? 2 : 1;
  const nodeFs = n > 20 ? 9 : 10;
  const wrapCh = n > 20 ? 11 : 13;
  const baseR = n > 20 ? 26 : n > 12 ? 28 : 30;
  const perCol = Math.ceil(n / numCols);
  const rowSpacing = baseR * 2 + 12;
  const spread = Math.min(VH * 0.85, perCol * rowSpacing);
  const startY = VH / 2 - spread / 2;
  const colW = (rightEdge - leftEdge) / numCols;
  const startX = leftEdge + colW / 2;

  clusters.forEach((c, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const tx = startX + col * colW;
    const ty = perCol === 1 ? cy : startY + (row / (perCol - 1 || 1)) * spread;
    const cc = getDiscColor(c.name); // use cluster name for consistent coloring
    const r = baseR;
    const node = makeNode({
      id:'clust_'+i, x:tx, y:ty, r,
      color:cc, lines:wrap(c.name, wrapCh), fs:nodeFs,
      onClick:()=>{ state.cluster=c.name; state.level=3; render(); },
    });
    const delayStep = Math.max(6, Math.min(18, Math.floor(650 / (n || 1))));
    spawnNode(node, anchorX, anchorY, tx, ty, r, 80 + i * delayStep);
    liveNodes.set('clust_'+i, { el:node, x:tx, y:ty, r, color:cc });
    later(seq, () => makeEdge(anchorX, anchorY, tx, ty, cc, 0), 110 + i * delayStep);
  });
}

// Level 3: Effects for selected cluster
async function renderEffectsByCluster(seq) {
  const effects = await api(`/api/effects?cluster=${encodeURIComponent(state.cluster)}`);
  if (isStale(seq)) return;
  drawEffectsLayout(effects, state.cluster, seq);
}

function drawEffectsLayout(effects, anchorLabel, seq) {
  const discColor = getDiscColor(state.disc||state.field);
  const effectFs = 10;
  const effectBoxSample = 'Better-than-average effect';
  const effectBoxW = Math.ceil(effectBoxSample.length * effectFs * 0.62 + 18);
  const effectBoxH = 60;
  const effectWrapCh = effectBoxSample.length;
  const effectLineHeight = effectFs + 3;
  const effectMaxLines = Math.max(1, Math.floor((effectBoxH - 10) / effectLineHeight));
  const effectR = effectBoxH / 2;

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
  liveNodes.set('__disc__', { el:dAnchor, x:dAnchorX, y:dAnchorY, r:30, color:discColor, kind:'anchor' });

  const tlOpen = document.getElementById('timeline-panel').classList.contains('open');
  const rightEdge = tlOpen ? VW - 400 : VW - 20;
  const leftEdge  = dAnchorX + 90;
  const n = effects.length;

  // Adaptive layout: scale columns, radius, font, and wrap width with effect count
  const preferredCols = n > 100 ? 6 : n > 70 ? 5 : n > 40 ? 4 : n > 20 ? 3 : n > 10 ? 2 : 1;

  // Boxes have a fixed size, so never squeeze more rows or columns in than
  // physically fit. Use extra columns before resorting to vertical scrolling.
  const rowSpacing = effectBoxH + 8;
  const colSpacing = effectBoxW + 10;
  const padY       = 16;
  const maxRows    = Math.max(1, Math.floor((VH - 2 * padY) / rowSpacing));
  const maxCols    = Math.max(1, Math.floor((rightEdge - leftEdge) / colSpacing));
  const numCols    = Math.max(1, Math.min(maxCols, Math.max(preferredCols, Math.ceil(n / maxRows))));

  const effectsPerCol = Math.ceil(n / numCols) || 1;
  const contentH      = effectsPerCol * rowSpacing;
  const fits          = contentH <= VH - 2 * padY;
  if (!fits) setSvgHeight(contentH + 2 * padY);
  const startY = fits ? VH / 2 - (contentH - rowSpacing) / 2 : padY + effectBoxH / 2;

  // Distribute columns evenly across available horizontal space
  const colW   = (rightEdge - leftEdge) / numCols;
  const startX = leftEdge + colW / 2;

  // Stagger spawn so last node appears within ~600 ms regardless of count
  const delayStep = Math.max(4, Math.min(18, Math.floor(600 / (n || 1))));

  effects.forEach((eff, i) => {
    const col = Math.floor(i / effectsPerCol);
    const row = i % effectsPerCol;
    const tx  = startX + col * colW;
    const ty  = startY + row * rowSpacing;
    // const sc  = STATUS_COLORS[eff.status] || STATUS_COLORS.unknown;

    let lines = wrap(eff.name, effectWrapCh);
    if (lines.length > effectMaxLines) {
      lines = lines.slice(0, effectMaxLines);
      lines[effectMaxLines - 1] = lines[effectMaxLines - 1].replace(/.\s*$/, '…');
    }

    const node = makeNode({
      id:'eff_'+i, x:tx, y:ty, r:effectR,
      color:discColor, lines, fs:effectFs,
      boxWidth: effectBoxW, boxHeight: effectBoxH,
      // statusColor:sc,
      onClick:()=>openEffect(eff.id),
    });
    node.dataset.effectId = eff.id;
    // Long names are cut to fit the box; the full name shows on hover.
    const tip = document.createElementNS(NS, 'title'); tip.textContent = eff.name; node.appendChild(tip);
    if (eff.id === state.effect) node.classList.add('lh-selected');
    spawnNode(node, dAnchorX, dAnchorY, tx, ty, effectR, 60 + i * delayStep);
    liveNodes.set('eff_'+i, { el:node, x:tx, y:ty, r:effectR, color:discColor });
    if (i < 60) later(seq, () => makeEdge(dAnchorX, dAnchorY, tx, ty, discColor, 0), 80 + i * delayStep);
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

let openEffectSeq = 0;
async function openEffect(effectId) {
  const seq = ++openEffectSeq;
  let data;
  try {
    data = await api(`/api/effect/${encodeURIComponent(effectId)}`);
  } catch (err) {
    console.error(err);
    if (seq === openEffectSeq) hint.textContent = LOAD_ERROR;
    return;
  }
  if (seq !== openEffectSeq) return;  // a later click won; don't overwrite its panel
  tlTitle.textContent = data.name;
  tlDesc.textContent = data.description || '';
  // const sc = STATUS_COLORS[data.status] || STATUS_COLORS.unknown;
  // const bg = STATUS_BG[data.status] || STATUS_BG.unknown;
  // tlStatus.innerHTML = `<span class="status-badge" style="background:${bg};color:${sc}">${STATUS_LABELS[data.status]||data.status}</span>`;

  tlBody.innerHTML = '';
  const spine = document.createElement('div'); spine.className='tl-spine'; tlBody.appendChild(spine);

  const papers_and_wikis = (data.papers_and_wikis||[]).slice().sort((a,b)=>{
    const ay = a.year ?? -Infinity, by = b.year ?? -Infinity;
    return ay - by;
  });

  if (papers_and_wikis.length === 0) {
    tlBody.innerHTML += '<div style="padding:18px 4px;font-size:12px;color:var(--text3);text-align:center;font-style:italic">No papers on record for this effect.</div>';
  }

  papers_and_wikis.forEach((p, i) => {
    const tc = TYPE_CONF[p.classification] || TYPE_CONF.other;
    const row = document.createElement('div');
    row.className = 'tl-row';
    row.style.animationDelay = (i*45)+'ms';
    if (p.type === 'paper'){
  
      const retraction_badge = `<div class="tl-retraction-badge"><span class="status-badge" style="background:${STATUS_BG.reversed};color:${STATUS_COLORS.reversed}">Retracted</span></div>`;
  
  
      const doi = cleanDoi(p.doi);
      const doiHtml = doi
        ? `<a class="tl-doi" href="${esc(doiHref(doi))}" target="_blank" rel="noopener">doi:${esc(doi)}</a>`
        : '';
      const apaHtml = p.apa && p.apa !== 'nan' && p.apa !== p.doi
        ? `<div class="tl-journal" style="margin-top:3px;font-style:normal;font-size:10px;opacity:.7">${esc(p.apa.substring(0,120))}${p.apa.length>120?'…':''}</div>`
        : '';
  
      row.innerHTML = `
        <div class="tl-year" style="color:${tc.c};opacity:.8">${esc(p.year ?? '—')}</div>
        <div class="tl-dot-wrap">
          <div class="tl-dot" style="border-color:${tc.c};color:${tc.c}">${tc.shape}</div>
        </div>
        <div class="tl-content">
          <div class="tl-type" style="color:${tc.c}">${tc.label}</div>
          <div class="tl-paper-title">${esc(p.title||'Untitled')}</div>
          ${p.retracted ? retraction_badge : ''}
          ${apaHtml}
          <div class="tl-summary">${esc(p.summary||'')}</div>
          ${doiHtml}
        </div>`;
    } else {
      const validation = (p.validation || '').toLowerCase();
      const isMoreGeneral = validation.includes('more general');
      const wikiUrl = safeUrl(p.url);

      const wikiLinkLabel = isMoreGeneral
        ? `Featured in: ${p.title || 'Wikipedia'}`
        : (p.title || 'Wikipedia article');

      const wikiLinkHtml = wikiUrl
        ? `<a class="tl-doi" href="${esc(wikiUrl)}" target="_blank" rel="noopener">${esc(wikiLinkLabel)}</a>`
        : `<div class="tl-journal">${esc(wikiLinkLabel)}</div>`;

      row.innerHTML = `
        <div class="tl-year" style="color:#7a5c00;opacity:.8">${esc(p.year ?? p.wiki_year ?? '—')}</div>
        <div class="tl-dot-wrap">
          <div class="tl-dot" style="border-color:#7a5c00;color:#7a5c00">W</div>
        </div>
        <div class="tl-content">
          <div class="tl-type" style="color:#7a5c00">Wikipedia</div>
          <div class="tl-paper-title">${esc(p.title || 'Untitled wiki entry')}</div>
          ${wikiLinkHtml}
        </div>`;
    }
    tlBody.appendChild(row);
  });

  const fr = data.foundational_retraction;

  if (fr?.retracted) {
    const origDoi = cleanDoi(fr.original_doi), retrDoi = cleanDoi(fr.retraction_doi);
    const originalDoiHtml = origDoi
      ? `<a class="tl-doi" href="${esc(doiHref(origDoi))}" target="_blank" rel="noopener">Original DOI: ${esc(origDoi)}</a>`
      : '';

    const retractionDoiHtml = retrDoi
      ? `<a class="tl-doi" href="${esc(doiHref(retrDoi))}" target="_blank" rel="noopener">Retraction DOI: ${esc(retrDoi)}</a>`
      : '';

    const pubmedId = /^\d+$/.test(String(fr.retraction_pubmed_id ?? '')) ? String(fr.retraction_pubmed_id) : '';
    const pubmedHtml = pubmedId
      ? `<a class="tl-doi" href="https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/" target="_blank" rel="noopener">Retraction PubMed: ${pubmedId}</a>`
      : '';

    const retractionDateHtml = fr.retraction_date
      ? `<div class="tl-retraction-meta">Retraction date: ${esc(fr.retraction_date)}</div>`
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

  const suggest = document.createElement('div');
  suggest.className = 'tl-suggest';
  suggest.innerHTML = `<a href="/about#suggest-a-new-item">Suggest a new item</a>`;
  tlBody.appendChild(suggest);

  const wasOpen = tlPanel.classList.contains('open');
  tlPanel.classList.add('open');
  tlPanel.scrollTop = 0;
  state.effect = effectId;
  svg.querySelectorAll('.lh-selected').forEach(n => n.classList.remove('lh-selected'));
  svg.querySelectorAll('.lh-node').forEach(n => { if (n.dataset.effectId === effectId) n.classList.add('lh-selected'); });
  // The panel covers the right of the map: lay the effects out again beside it.
  if (!wasOpen && state.level === 3) relayoutKeepingScroll();
}

function relayoutKeepingScroll() {
  const top = scroller.scrollTop;
  render().then(() => { scroller.scrollTop = top; });
}

function closeTimeline() {
  const wasOpen = tlPanel.classList.contains('open');
  tlPanel.classList.remove('open');
  state.effect = null;
  svg.querySelectorAll('.lh-selected').forEach(n => n.classList.remove('lh-selected'));
  return wasOpen;
}
document.getElementById('tl-close').addEventListener('click', () => {
  if (closeTimeline() && state.level === 3) relayoutKeepingScroll();
});

// ── SEARCH ─────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout;
let searchSeq = 0;

function colorForTag(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DISC_COLORS.length;
  return DISC_COLORS[idx];
}

function openClusterFromSearch(clusterName, disciplineName, fieldName) {
  // The field must be set too, or Back and the breadcrumb dead-end at the
  // discipline level.
  state.field = fieldName || null;
  state.disc = disciplineName;
  state.sub = disciplineName;
  state.cluster = clusterName;
  state.level = 3;
  closeTimeline();
  render();
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  const seq = ++searchSeq;
  if (q.length < 2) { searchResults.classList.remove('open'); return; }
  searchTimeout = setTimeout(async () => {
    let payload;
    try {
      payload = await api(`/api/search?q=${encodeURIComponent(q)}`);
    } catch (err) {
      console.error(err);
      if (seq !== searchSeq) return;
      searchResults.innerHTML = '<div class="sr-item" style="color:var(--text3)">Search is unavailable right now</div>';
      searchResults.classList.add('open');
      return;
    }
    if (seq !== searchSeq) return;  // a newer query is in flight; drop this answer
    const effects = payload.effects || [];
    const clusters = payload.clusters || [];
    searchResults.innerHTML = '';
    if (effects.length === 0 && clusters.length === 0) {
      searchResults.innerHTML = '<div class="sr-item" style="color:var(--text3)">No results</div>';
    } else {
      if (clusters.length > 0) {
        const section = document.createElement('div');
        section.className = 'sr-section';
        section.innerHTML = '<div class="sr-section-title">Tags</div>';

        const grid = document.createElement('div');
        grid.className = 'sr-tag-grid';

        clusters.forEach(tag => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sr-tag';
          btn.innerHTML = `<span class="sr-tag-name">${esc(tag.name)}</span><span class="sr-tag-sep"> - </span><span class="sr-tag-meta">${esc(tag.discipline)}</span>`;

          const tagColor = colorForTag(tag.name);
          btn.style.borderColor = tagColor;
          btn.style.background = darkMode ? hexAlpha(tagColor, 0.22) : hexAlpha(tagColor, 0.14);

          btn.addEventListener('click', () => {
            searchResults.classList.remove('open');
            searchInput.value = '';
            openClusterFromSearch(tag.name, tag.discipline, tag.field);
          });
          grid.appendChild(btn);
        });

        section.appendChild(grid);
        searchResults.appendChild(section);
      }

      if (effects.length > 0) {
        if (clusters.length > 0) {
          const divider = document.createElement('div');
          divider.className = 'sr-divider';
          searchResults.appendChild(divider);
        }

        effects.forEach(r => {
          const div = document.createElement('div'); div.className = 'sr-item';
          div.innerHTML = `<div class="sr-item-name">${esc(r.name)}</div><div class="sr-item-disc">${esc(r.discipline)}</div>`;
          div.addEventListener('click', () => {
            searchResults.classList.remove('open');
            searchInput.value = '';
            // Show the effect in its place on the map, not over an unrelated view.
            if (r.clusters?.length && !(state.level === 3 && r.clusters.includes(state.cluster))) {
              openClusterFromSearch(r.clusters[0], r.discipline, r.field);
            }
            openEffect(r.id);
          });
          searchResults.appendChild(div);
        });
      }
    }
    searchResults.classList.add('open');
  }, 250);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap')) searchResults.classList.remove('open');
});

// Enter opens the first result
searchInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !searchResults.classList.contains('open')) return;
  const first = searchResults.querySelector('.sr-tag, .sr-item-name');
  if (first) { e.preventDefault(); first.click(); }
});

// Escape closes the topmost thing: tour, then search results, then evidence panel
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (tourState) destroyTour(true);
  else if (searchResults.classList.contains('open')) { searchResults.classList.remove('open'); searchInput.blur(); }
  else if (closeTimeline() && state.level === 3) relayoutKeepingScroll();
});

// ── ONBOARDING TOUR ───────────────────────────────────────────────────────
const TOUR_STORAGE_KEY = 'lighthouse.onboarding.v1';
const TOUR_STEPS = [
  {
    title: 'Welcome to Lighthouse',
    body: 'This map lets you browse effects by field, discipline, and cluster. Click Next for a quick walkthrough.',
    selector: '#logo-wrap',
    placement: 'bottom',
  },
  {
    title: 'Home and About',
    body: 'Use Home to reset to the main map and About to read project context and suggest updates.',
    selector: '#home-link',
    placement: 'bottom',
  },
  {
    title: 'Search Effects and Tags',
    body: 'Search supports both effects and tags. Tag results are clickable and open the matching cluster view.',
    selector: '#search-wrap',
    placement: 'bottom',
  },
  {
    title: 'Explore the Map',
    body: 'Click nodes in the center map to drill down from disciplines to clusters and effects.',
    selector: '#stage',
    placement: 'bottom',
  },
  {
    title: 'Theme Toggle',
    body: 'Switch between light and dark mode at any time.',
    selector: '#theme-toggle',
    placement: 'bottom',
  },
];

let tourState = null;
let tourResizeHandler = null;

function clearTourTarget() {
  if (tourState?.targetEl) {
    tourState.targetEl.classList.remove('tour-target');
    tourState.targetEl = null;
  }
}

function destroyTour(markSeen) {
  clearTourTarget();
  if (tourResizeHandler) {
    window.removeEventListener('resize', tourResizeHandler);
    tourResizeHandler = null;
  }
  if (tourState?.backdrop) tourState.backdrop.remove();
  if (tourState?.card) tourState.card.remove();
  if (markSeen) localStorage.setItem(TOUR_STORAGE_KEY, '1');
  tourState = null;
}

function placeTourCard(card, targetEl, placement) {
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardRect = card.getBoundingClientRect();
  let left = (vw - cardRect.width) / 2;
  let top = (vh - cardRect.height) / 2;

  if (targetEl) {
    const tr = targetEl.getBoundingClientRect();
    const placeAbove = placement === 'top';
    top = placeAbove ? tr.top - cardRect.height - margin : tr.bottom + margin;
    left = tr.left + (tr.width - cardRect.width) / 2;

    if (top < margin) top = tr.bottom + margin;
    if (top + cardRect.height > vh - margin) top = Math.max(margin, tr.top - cardRect.height - margin);
  }

  left = Math.max(margin, Math.min(left, vw - cardRect.width - margin));
  top = Math.max(margin, Math.min(top, vh - cardRect.height - margin));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function showTourStep(stepIndex) {
  if (!tourState) return;
  const total = TOUR_STEPS.length;
  if (stepIndex < 0) return;
  if (stepIndex >= total) {
    destroyTour(true);
    return;
  }

  const step = TOUR_STEPS[stepIndex];
  tourState.stepIndex = stepIndex;
  clearTourTarget();

  const targetEl = step.selector ? document.querySelector(step.selector) : null;
  if (targetEl) {
    targetEl.classList.add('tour-target');
    tourState.targetEl = targetEl;
  }

  tourState.title.textContent = step.title;
  tourState.body.textContent = step.body;
  tourState.meta.textContent = `Step ${stepIndex + 1} of ${total}`;
  tourState.backBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
  tourState.nextBtn.textContent = stepIndex === total - 1 ? 'Finish' : 'Next';

  placeTourCard(tourState.card, targetEl, step.placement || 'bottom');
}

function startTour(force = false) {
  if (tourState) return;
  if (!force && localStorage.getItem(TOUR_STORAGE_KEY)) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'tour-backdrop';

  const card = document.createElement('div');
  card.className = 'tour-card';
  card.innerHTML = `
    <div class="tour-title"></div>
    <div class="tour-body"></div>
    <div class="tour-meta"></div>
    <div class="tour-actions">
      <button type="button" class="tour-btn" data-tour-action="skip">Skip</button>
      <button type="button" class="tour-btn" data-tour-action="back">Back</button>
      <button type="button" class="tour-btn primary" data-tour-action="next">Next</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(card);

  const title = card.querySelector('.tour-title');
  const body = card.querySelector('.tour-body');
  const meta = card.querySelector('.tour-meta');
  const skipBtn = card.querySelector('[data-tour-action="skip"]');
  const backBtn = card.querySelector('[data-tour-action="back"]');
  const nextBtn = card.querySelector('[data-tour-action="next"]');

  tourState = { backdrop, card, title, body, meta, skipBtn, backBtn, nextBtn, targetEl: null, stepIndex: 0 };

  skipBtn.addEventListener('click', () => destroyTour(true));
  backBtn.addEventListener('click', () => showTourStep(tourState.stepIndex - 1));
  nextBtn.addEventListener('click', () => showTourStep(tourState.stepIndex + 1));
  tourResizeHandler = () => {
    if (!tourState) return;
    const step = TOUR_STEPS[tourState.stepIndex] || TOUR_STEPS[0];
    placeTourCard(tourState.card, tourState.targetEl, step.placement || 'bottom');
  };
  window.addEventListener('resize', tourResizeHandler);

  showTourStep(0);
}

document.getElementById('tour-btn')?.addEventListener('click', () => startTour(true));

// ── INIT ───────────────────────────────────────────────────────────────────
function draw() { /* refresh color fills on theme change */
  liveNodes.forEach(n => {
    if (!n.el) return;
    const c = n.el.querySelector('.nbg');
    if (c && n.color) {
      c.setAttribute('fill', darkMode ? hexAlpha(n.color,.35) : hexAlpha(n.color,.18));
    }
    const t = n.el.querySelector('text');
    if (t && n.color) t.setAttribute('fill', darkMode ? '#e0ddd5' : (n.kind==='anchor' ? hexAlpha(n.color,0.7) : n.color));
  });
}

render();
setTimeout(() => startTour(false), 700);
