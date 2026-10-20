// Pieces shared by several chapters: the five observations, batch icons,
// dot plots and small simulation helpers.
import { C } from '../engine/theme.js';
import { rgba, normalSampler, clamp, lerp, ease } from '../engine/util.js';
import { text } from '../engine/draw.js';

export const DATA = [1.8, -0.2, 2.5, 0.3, 1.1];
export const MEAN = 1.1;

// ---------- batch of products: cartons on a pallet (isometric) ----------
// Drawn once into an offscreen canvas, so fading it never shows overlaps.
const iconCache = new Map();
function iso(s) {
  const c = Math.cos(Math.PI / 6), n = Math.sin(Math.PI / 6);
  return (x, y, z) => [(x - y) * c * s, (x + y) * n * s - z * s];
}
function box(g, P, x, y, z, w, d, h, col) {
  const q = (a, b, c) => P(x + a, y + b, z + c);
  const face = (pts, fill) => {
    g.beginPath();
    g.moveTo(...pts[0]);
    for (const p of pts.slice(1)) g.lineTo(...p);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = 'rgba(10,12,18,0.55)';
    g.lineWidth = 1;
    g.stroke();
  };
  face([q(0, d, 0), q(w, d, 0), q(w, d, h), q(0, d, h)], col.left); // front-left face (y = d)
  face([q(w, 0, 0), q(w, d, 0), q(w, d, h), q(w, 0, h)], col.right); // front-right face (x = w)
  face([q(0, 0, h), q(w, 0, h), q(w, d, h), q(0, d, h)], col.top);
  return q;
}
function renderBatch(s) {
  const pad = 6;
  const P0 = iso(s);
  // bounds of the whole object in iso space
  const W2 = Math.ceil(2.6 * s * 1.2), H2 = Math.ceil(2.4 * s * 1.2);
  const cv = document.createElement('canvas');
  const k = 2; // supersample for crisp edges
  cv.width = (W2 + pad * 2) * k;
  cv.height = (H2 + pad * 2) * k;
  const g = cv.getContext('2d');
  g.scale(k, k);
  const ox = W2 / 2 + pad, oy = H2 * 0.62 + pad;
  const P = (x, y, z) => { const [a, b] = P0(x, y, z); return [a + ox, b + oy]; };
  const pallet = { top: '#5B5347', left: '#3E3830', right: '#4A433A' };
  const kraft = { top: '#B79E79', left: '#7F6B50', right: '#9A8262' };
  // pallet slab
  box(g, P, -1.1, -1.1, -0.2, 2.2, 2.2, 0.2, pallet);
  // four cartons on the pallet (back to front), one on top
  const cw = 1.0, ch = 0.78;
  const items = [[-1.05, -1.05, 0], [0.05, -1.05, 0], [-1.05, 0.05, 0], [0.05, 0.05, 0], [-0.5, -0.5, ch]];
  for (const [x, y, z] of items) {
    const q = box(g, P, x, y, z, cw, cw, ch, kraft);
    // tape along the top centre line
    g.strokeStyle = 'rgba(232,214,170,0.9)';
    g.lineWidth = Math.max(1.4, s * 0.1);
    g.beginPath();
    g.moveTo(...q(0, cw / 2, ch));
    g.lineTo(...q(cw, cw / 2, ch));
    g.lineTo(...q(cw, cw / 2, ch * 0.62));
    g.stroke();
  }
  return { cv, k, ox, oy };
}
export function batchIcon(ctx, x, y, s, a = 1) {
  if (a <= 0.002) return;
  const key = s.toFixed(1);
  let ic = iconCache.get(key);
  if (!ic) iconCache.set(key, (ic = renderBatch(s)));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.drawImage(ic.cv, x - ic.ox, y - ic.oy, ic.cv.width / ic.k, ic.cv.height / ic.k);
  ctx.restore();
}

// small round badge with a check mark (a measurement was taken)
export function checkBadge(ctx, x, y, r, a = 1, col = '#5FD3A5') {
  if (a <= 0.002) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(col, a * 0.18);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(col, a);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.36);
  ctx.lineTo(x + r * 0.5, y - r * 0.34);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---------- dot plots ----------
// Stack values into columns of width `bin`; returns [{v, x (value of column centre), k (level)}]
// in the original order, so dots can land one after another.
export function stackDots(values, bin) {
  const levels = new Map();
  return values.map((v) => {
    const c = Math.round(v / bin);
    const k = levels.get(c) || 0;
    levels.set(c, k + 1);
    return { v, x: c * bin, k };
  });
}

// pick k samples of size n from N(mu, sd) whose means are closest to targets
export function pickSamples(seed, n, mu, sd, targets, tries = 4000) {
  const g = normalSampler(seed);
  const pool = [];
  for (let i = 0; i < tries; i++) {
    const s = Array.from({ length: n }, () => mu + sd * g());
    pool.push({ s, m: s.reduce((a, b) => a + b, 0) / n });
  }
  return targets.map((tg) => {
    let best = null;
    for (const p of pool) if (!p.used && (!best || Math.abs(p.m - tg) < Math.abs(best.m - tg))) best = p;
    best.used = true;
    return best.s;
  });
}

// position along a cubic Bézier
export function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

export { clamp, lerp, ease };
