// Drawing TeX formulas glyph by glyph on a canvas.
//
// Scenes call tex(String.raw`...`) while they are being built. In Node (build
// step) this only records which formulas are needed; tools/build-tex.mjs then
// converts them with MathJax. In the browser the converted glyph store is loaded
// first, and the same calls return references that can be drawn.
import { clamp, ease, rgba, lerp } from './util.js';
import { FONT } from './theme.js';

let STORE = null;
let PATHS = [];
const requested = new Map();
const layoutCache = new Map();

export function setTexStore(json) {
  STORE = json;
  PATHS = typeof Path2D !== 'undefined' ? json.paths.map((d) => new Path2D(d)) : [];
  layoutCache.clear();
  rankCache.clear();
}
export const texRequests = () => requested;

export function tex(src, opts = {}) {
  const key = (opts.inline ? 'i|' : 'd|') + src;
  if (!requested.has(key)) requested.set(key, { src, display: !opts.inline });
  return new TexRef(key, src);
}

// Geometry of a formula in its own units (1000 units = 1 em, baseline at y = 0, y down).
function layout(ref) {
  let L = layoutCache.get(ref.key);
  if (L) return L;
  const f = STORE && STORE.formulas[ref.key];
  if (!f) {
    // collect mode (build step) or a formula that has not been built yet
    if (!STORE) return { f: { w: 0, h: 0, d: 0 }, items: [], n: 0 };
    throw new Error('TeX not built (run tools/build-tex.mjs): ' + ref.src);
  }
  const items = [];
  for (const g of f.g) {
    const b = STORE.boxes[g.p];
    const m = g.m;
    const xs = [], ys = [];
    for (const [px, py] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) {
      xs.push(m[0] * px + m[2] * py + m[4]);
      ys.push(m[1] * px + m[3] * py + m[5]);
    }
    const sc = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
    items.push({ kind: 'g', p: g.p, m, c: g.c, tags: g.t, tag: g.t[g.t.length - 1] || null, len: STORE.lens[g.p], sc,
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
  }
  for (const t of f.txt) {
    const em = 1000; // MathJax reserves 1 em per CJK character
    const n = [...t.s].length;
    items.push({ kind: 't', s: t.s, size: t.size, m: t.m, tags: t.t, tag: t.t[t.t.length - 1] || null,
      box: [t.m[4], t.m[5] - 0.88 * em * Math.abs(t.m[0]), t.m[4] + n * em * Math.abs(t.m[0]), t.m[5] + 0.12 * em * Math.abs(t.m[0])] });
  }
  // left-to-right writing order
  const order = items.map((it, i) => i).sort((a, b) => (items[a].box[0] + items[a].box[2]) - (items[b].box[0] + items[b].box[2]));
  order.forEach((idx, k) => (items[idx].order = k));
  L = { f, items, n: items.length };
  layoutCache.set(ref.key, L);
  return L;
}

export class TexRef {
  constructor(key, src) {
    this.key = key;
    this.src = src;
  }
  get L() { return layout(this); }
  width(size) { return (this.L.f.w * size) / 1000; }
  ascent(size) { return (this.L.f.h * size) / 1000; }
  descent(size) { return (this.L.f.d * size) / 1000; }
  height(size) { return ((this.L.f.h + this.L.f.d) * size) / 1000; }
  // origin (baseline-left) on screen for a placement
  origin(x, y, size, align = 'c', valign = 'm') {
    const f = this.L.f, s = size / 1000;
    let ox = x, oy = y;
    if (align === 'c') ox = x - (f.w * s) / 2;
    else if (align === 'r') ox = x - f.w * s;
    if (valign === 'm') oy = y + (s * (f.h - f.d)) / 2;
    else if (valign === 't') oy = y + s * f.h;
    else if (valign === 'bottom') oy = y - s * f.d;
    return { ox, oy, s };
  }
  // screen box of all glyphs carrying a tag (or of everything when tag is null)
  box(x, y, size, align = 'c', valign = 'm', tag = null) {
    const { ox, oy, s } = this.origin(x, y, size, align, valign);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const it of this.L.items) {
      if (tag && !it.tags.includes(tag)) continue;
      x0 = Math.min(x0, it.box[0]); y0 = Math.min(y0, it.box[1]);
      x1 = Math.max(x1, it.box[2]); y1 = Math.max(y1, it.box[3]);
    }
    if (x0 === Infinity) return null;
    return { x0: ox + x0 * s, y0: oy + y0 * s, x1: ox + x1 * s, y1: oy + y1 * s,
      get cx() { return (this.x0 + this.x1) / 2; }, get cy() { return (this.y0 + this.y1) / 2; },
      get w() { return this.x1 - this.x0; }, get h() { return this.y1 - this.y0; } };
  }
}

// rank of every glyph among the glyphs sharing each tag (left to right)
const rankCache = new Map();
function tagRanks(ref, L) {
  let r = rankCache.get(ref.key);
  if (r) return r;
  r = {};
  for (const it of L.items) for (const tg of it.tags) (r[tg] = r[tg] || []).push(it);
  for (const tg of Object.keys(r)) {
    const arr = r[tg].sort((a, b) => a.order - b.order);
    r[tg] = { n: arr.length, rank: new Map(arr.map((it, i) => [it, i])) };
  }
  rankCache.set(ref.key, r);
  return r;
}

// Progress of glyph k (0..n-1) within an overall write progress p.
function stagger(p, k, n, win = 0.42) {
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  if (n <= 1) return p;
  const w = Math.max(win, 1.6 / n);
  const start = (k / (n - 1)) * (1 - w);
  return clamp((p - start) / w);
}

function tagValue(map, tags, fallback) {
  if (!map) return fallback;
  for (let i = tags.length - 1; i >= 0; i--) if (map[tags[i]] !== undefined) return map[tags[i]];
  return fallback;
}

function drawItem(ctx, it, color, alpha, q, strokeWrite = true) {
  if (alpha <= 0.002 || q <= 0) return;
  ctx.save();
  ctx.transform(it.m[0], it.m[1], it.m[2], it.m[3], it.m[4], it.m[5]);
  if (it.kind === 't') {
    ctx.scale(1, -1); // undo the formula's y flip for text
    ctx.font = `${it.size * 0.96}px ${FONT.sans}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(color, alpha * ease.out(q));
    let x = 0;
    for (const ch of it.s) {
      ctx.fillText(ch, x + 20, 0);
      x += 1000;
    }
  } else {
    const path = PATHS[it.p];
    if (q < 1 && strokeWrite && it.c !== 'rect') {
      const qs = clamp(q / 0.65);
      const qf = clamp((q - 0.35) / 0.65);
      if (qs > 0 && qf < 1) {
        ctx.lineWidth = 22 / Math.max(0.5, it.sc);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = rgba(color, alpha * (1 - qf * 0.6));
        ctx.setLineDash([it.len * qs, it.len + 1]);
        ctx.stroke(path);
      }
      if (qf > 0) {
        ctx.fillStyle = rgba(color, alpha * ease.inOut(qf));
        ctx.fill(path);
      }
    } else {
      ctx.fillStyle = rgba(color, alpha * (it.c === 'rect' && q < 1 ? ease.out(q) : 1));
      if (it.c === 'rect' && q < 1) {
        // fraction bars grow from the left
        const b = STORE.boxes[it.p];
        ctx.beginPath();
        ctx.rect(b[0], b[1], (b[2] - b[0]) * ease.inOut(q), b[3] - b[1]);
        ctx.fill();
      } else ctx.fill(path);
    }
  }
  ctx.restore();
}

/**
 * Draw a formula.
 * o.align 'l'|'c'|'r', o.valign 'm'|'b'|'t'|'bottom'
 * o.color, o.alpha, o.write (0..1 stroke-then-fill writing), o.colors {tag: color},
 * o.alphas {tag: alpha}, o.shift {tag: [dx, dy]} (in px), o.scale {tag: k}
 */
export function drawTex(ctx, ref, x, y, size, o = {}) {
  const L = ref.L;
  const { ox, oy, s } = ref.origin(x, y, size, o.align || 'c', o.valign || 'm');
  const color = o.color || '#E9ECF2';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  if (alpha <= 0) return;
  const write = o.write === undefined ? 1 : o.write;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  const defA = o.alphas && o.alphas['*'] !== undefined ? o.alphas['*'] : 1;
  // o.writes {tag: progress} writes tagged parts independently (each part staggers on its own)
  const wr = o.writes ? tagRanks(ref, L) : null;
  for (const it of L.items) {
    const a = alpha * tagValue(o.alphas, it.tags, defA);
    if (a <= 0.002) continue;
    let q;
    const wt = o.writes ? it.tags.slice().reverse().find((tg) => o.writes[tg] !== undefined) : undefined;
    if (wt !== undefined) q = stagger(o.writes[wt], wr[wt].rank.get(it), wr[wt].n, o.win);
    else q = stagger(write, it.order, L.n, o.win);
    const col = tagValue(o.colors, it.tags, color);
    const sh = tagValue(o.shift, it.tags, null);
    const sk = tagValue(o.scale, it.tags, null);
    if (sh || sk) {
      ctx.save();
      if (sh) ctx.translate(sh[0] / s, sh[1] / s);
      if (sk) {
        const cx = (it.box[0] + it.box[2]) / 2, cy = (it.box[1] + it.box[3]) / 2;
        ctx.translate(cx, cy); ctx.scale(sk, sk); ctx.translate(-cx, -cy);
      }
      drawItem(ctx, it, col, a, q, o.stroke !== false);
      ctx.restore();
    } else drawItem(ctx, it, col, a, q, o.stroke !== false);
  }
  ctx.restore();
}

// ---------- morphing between two formulas ----------
function lcs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}
const morphCache = new Map();
function matchGlyphs(A, B, tagMap) {
  const key = A.key + '\u0000' + B.key + '\u0000' + JSON.stringify(tagMap || {});
  let r = morphCache.get(key);
  if (r) return r;
  const la = A.L.items, lb = B.L.items;
  const byOrder = (arr) => arr.map((it, i) => i).sort((x, y) => arr[x].order - arr[y].order);
  const oa = byOrder(la), ob = byOrder(lb);
  const usedA = new Set(), usedB = new Set(), pairs = [];
  const sig = (it) => (it.kind === 't' ? 'T' + it.s : it.c + ':' + it.p);
  // 1) explicit tag mapping (tagA -> tagB) and same-named tags
  const tagsA = new Set(la.flatMap((it) => it.tags)), tagsB = new Set(lb.flatMap((it) => it.tags));
  const tpairs = [];
  for (const t of tagsA) if (tagsB.has(t)) tpairs.push([t, t]);
  for (const [ta, tb] of Object.entries(tagMap || {})) tpairs.push([ta, tb]);
  for (const [ta, tb] of tpairs) {
    const ia = oa.filter((i) => la[i].tags.includes(ta) && !usedA.has(i));
    const ib = ob.filter((i) => lb[i].tags.includes(tb) && !usedB.has(i));
    const pp = lcs(ia.map((i) => sig(la[i])), ib.map((i) => sig(lb[i])));
    for (const [x, y] of pp) { pairs.push([ia[x], ib[y], false]); usedA.add(ia[x]); usedB.add(ib[y]); }
    if (tagMap && tagMap[ta] === tb) {
      // leftovers inside explicitly mapped tags cross-fade in place
      const ra = ia.filter((i) => !usedA.has(i)), rb = ib.filter((i) => !usedB.has(i));
      const k = Math.min(ra.length, rb.length);
      for (let q = 0; q < k; q++) { pairs.push([ra[q], rb[q], true]); usedA.add(ra[q]); usedB.add(rb[q]); }
    }
  }
  // 2) everything else by longest common subsequence of glyph shapes
  const ra = oa.filter((i) => !usedA.has(i)), rb = ob.filter((i) => !usedB.has(i));
  const pp = lcs(ra.map((i) => sig(la[i])), rb.map((i) => sig(lb[i])));
  for (const [x, y] of pp) { pairs.push([ra[x], rb[y], false]); usedA.add(ra[x]); usedB.add(rb[y]); }
  r = { pairs, onlyA: oa.filter((i) => !usedA.has(i)), onlyB: ob.filter((i) => !usedB.has(i)) };
  morphCache.set(key, r);
  return r;
}

/**
 * Morph formula A (placed at pa) into formula B (placed at pb); p in [0, 1].
 * pa/pb: {x, y, size, align, valign}. o.colorsA/o.colorsB per-tag colours,
 * o.map {tagA: tagB} to pair differently named parts.
 */
export function drawTexMorph(ctx, A, pa, B, pb, p, o = {}) {
  if (p <= 0) return drawTex(ctx, A, pa.x, pa.y, pa.size, { align: pa.align, valign: pa.valign, colors: o.colorsA, color: o.color, alpha: o.alpha });
  if (p >= 1) return drawTex(ctx, B, pb.x, pb.y, pb.size, { align: pb.align, valign: pb.valign, colors: o.colorsB, color: o.color, alpha: o.alpha });
  const { pairs, onlyA, onlyB } = matchGlyphs(A, B, o.map);
  const ga = A.origin(pa.x, pa.y, pa.size, pa.align || 'c', pa.valign || 'm');
  const gb = B.origin(pb.x, pb.y, pb.size, pb.align || 'c', pb.valign || 'm');
  const la = A.L.items, lb = B.L.items;
  const color = o.color || '#E9ECF2';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const scr = (g, it) => [g.s * it.m[0], g.s * it.m[1], g.s * it.m[2], g.s * it.m[3], g.ox + g.s * it.m[4], g.oy + g.s * it.m[5]];
  const pm = ease.inOut(p);
  const draw = (it, M, col, a) => {
    ctx.save();
    ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix(M)));
    const it2 = { ...it, m: [1, 0, 0, 1, 0, 0] };
    drawItem(ctx, it2, col, a, 1, false);
    ctx.restore();
  };
  for (const [i, j, fade] of pairs) {
    const a = la[i], b = lb[j];
    const MA = scr(ga, a), MB = scr(gb, b);
    // move along a slight arc so crossing glyphs do not collide
    const M = MA.map((v, k) => lerp(v, MB[k], pm));
    const arc = (o.arc || 0) * Math.sin(Math.PI * pm);
    M[5] -= arc;
    const ca = tagValue(o.colorsA, a.tags, color), cb = tagValue(o.colorsB, b.tags, color);
    const col = ca === cb ? ca : mixHex(ca, cb, pm);
    if (fade || a.p !== b.p || a.kind !== b.kind) {
      draw(a, M, col, alpha * (1 - pm));
      draw(b, M.map((v, k) => (k < 4 ? lerp(MA[k], MB[k], pm) : v)), col, alpha * pm);
    } else draw(a, M, col, alpha);
  }
  const fo = clamp(p / 0.55), fi = clamp((p - 0.45) / 0.55);
  for (const i of onlyA) draw(la[i], scr(ga, la[i]), tagValue(o.colorsA, la[i].tags, color), alpha * (1 - ease.inOut(fo)));
  for (const j of onlyB) draw(lb[j], scr(gb, lb[j]), tagValue(o.colorsB, lb[j].tags, color), alpha * ease.inOut(fi));
}

function mixHex(a, b, p) {
  // small local helper to avoid importing mixColor for every glyph
  const pa = hex(a), pb = hex(b);
  return `rgb(${lerp(pa[0], pb[0], p) | 0},${lerp(pa[1], pb[1], p) | 0},${lerp(pa[2], pb[2], p) | 0})`;
}
function hex(c) {
  if (c[0] === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const m = c.match(/\d+(\.\d+)?/g).map(Number);
  return m;
}
