// Drawing primitives. Every function takes the canvas context first and an
// options object last; all sizes are in pixels of the 1920×1080 frame.
import { clamp, ease, lerp, rgba } from './util.js';
import { C, FONT } from './theme.js';
import { tex, drawTex, TexRef } from './tex.js';

// ---------------- text ----------------
export function font(size, weight = 400, family = 'sans') {
  return `${weight} ${size}px ${FONT[family] || family}`;
}

export function text(ctx, s, x, y, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002 || !s) return 0;
  ctx.save();
  ctx.font = font(o.size || 32, o.weight || 400, o.family || 'sans');
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.letter) ctx.letterSpacing = o.letter + 'px';
  if (o.shadow) {
    ctx.shadowColor = rgba('#000000', 0.6 * a);
    ctx.shadowBlur = o.shadow;
  }
  if (o.stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = o.stroke;
    ctx.strokeStyle = rgba(o.strokeColor || C.bg0, a);
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = rgba(o.color || C.text, a);
  ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

export function measure(ctx, s, size = 32, weight = 400, family = 'sans') {
  ctx.save();
  ctx.font = font(size, weight, family);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

// A line of mixed Chinese text and TeX: parts = ['标准差 ', tex(...), ...].
// Strings use the sans font; TeX parts sit on the same baseline at texScale×size.
export function rich(ctx, parts, x, y, o = {}) {
  const size = o.size || 32;
  const ts = (o.texScale || 1.12) * size;
  const widths = parts.map((p) => (p instanceof TexRef ? p.width(ts) : measure(ctx, p, size, o.weight || 400)));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  const a = o.alpha === undefined ? 1 : o.alpha;
  // baseline: put the text's middle at y, then align TeX baseline with text baseline
  const base = y + size * 0.36;
  parts.forEach((p, i) => {
    if (p instanceof TexRef) {
      drawTex(ctx, p, cx, base, ts, { align: 'l', valign: 'b', color: o.texColor || o.color || C.text, alpha: a, colors: o.colors, write: o.write });
    } else {
      text(ctx, p, cx, y, { ...o, align: 'left', alpha: a });
    }
    cx += widths[i];
  });
  return total;
}
export function richWidth(ctx, parts, o = {}) {
  const size = o.size || 32;
  const ts = (o.texScale || 1.12) * size;
  return parts.map((p) => (p instanceof TexRef ? p.width(ts) : measure(ctx, p, size, o.weight || 400))).reduce((a, b) => a + b, 0);
}

// Numbers in the math font, so axis labels and counters match the formulas.
const NUMCH = '0123456789.−+%=,()';
let numRefs = null;
function numGlyphs() {
  if (!numRefs) {
    numRefs = {};
    for (const ch of NUMCH) {
      const src = ch === '−' ? '{-}' : ch === '%' ? '\\%' : ch === '+' ? '{+}' : ch === '=' ? '{=}' : '\\mathrm{' + ch + '}';
      numRefs[ch] = tex(src, { inline: true });
    }
  }
  return numRefs;
}
numGlyphs(); // register at load so the build step converts them

export function num(ctx, s, x, y, size, o = {}) {
  if (typeof s === 'number') s = String(s);
  s = s.replace(/-/g, '−');
  const g = numGlyphs();
  const ws = [...s].map((ch) => (g[ch] ? g[ch].width(size) * (ch === '−' ? 0.82 : 1) : size * 0.3));
  const total = ws.reduce((a, b) => a + b, 0);
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return total;
  const base = o.valign === 'b' ? y : y + size * 0.35;
  [...s].forEach((ch, i) => {
    if (g[ch]) drawTex(ctx, g[ch], cx + (ch === '−' ? -ws[i] * 0.1 : 0), base, size, { align: 'l', valign: 'b', color: o.color || C.text, alpha: a });
    cx += ws[i];
  });
  return total;
}
export function numWidth(s, size) {
  s = String(s).replace(/-/g, '−');
  const g = numGlyphs();
  return [...s].map((ch) => (g[ch] ? g[ch].width(size) * (ch === '−' ? 0.82 : 1) : size * 0.3)).reduce((a, b) => a + b, 0);
}

// ---------------- shapes ----------------
export function line(ctx, x1, y1, x2, y2, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return;
  const p = o.progress === undefined ? 1 : o.progress;
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = rgba(o.color || C.text, a);
  ctx.lineWidth = o.width || 2;
  ctx.lineCap = o.cap || 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  if (o.from === 'center') {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.moveTo(lerp(mx, x1, p), lerp(my, y1, p));
    ctx.lineTo(lerp(mx, x2, p), lerp(my, y2, p));
  } else {
    ctx.moveTo(x1, y1);
    ctx.lineTo(lerp(x1, x2, p), lerp(y1, y2, p));
  }
  ctx.stroke();
  ctx.restore();
}

export function arrow(ctx, x1, y1, x2, y2, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return;
  const p = o.progress === undefined ? 1 : o.progress;
  const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p);
  const len = Math.hypot(ex - x1, ey - y1);
  if (len < 0.5) return;
  const w = o.width || 3;
  const head = Math.min(o.head || w * 4.2, len * 0.6);
  const ux = (ex - x1) / len, uy = (ey - y1) / len;
  const nx = -uy, ny = ux;
  const hw = head * 0.52;
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle = rgba(o.color || C.text, a);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  // shaft stops inside the head so the tip stays sharp
  const sx = ex - ux * head * 0.7, sy = ey - uy * head * 0.7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ux * head + nx * hw, ey - uy * head + ny * hw);
  ctx.quadraticCurveTo(ex - ux * head * 0.72, ey - uy * head * 0.72, ex - ux * head - nx * hw, ey - uy * head - ny * hw);
  ctx.closePath();
  ctx.fill();
  if (o.both) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * head + nx * hw, y1 + uy * head + ny * hw);
    ctx.quadraticCurveTo(x1 + ux * head * 0.72, y1 + uy * head * 0.72, x1 + ux * head - nx * hw, y1 + uy * head - ny * hw);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function dot(ctx, x, y, r, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002 || r <= 0) return;
  ctx.save();
  if (o.glow) {
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * (2.6 + o.glow));
    g.addColorStop(0, rgba(o.color || C.data, 0.35 * a * Math.min(1, o.glow)));
    g.addColorStop(1, rgba(o.color || C.data, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * (2.6 + o.glow), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (o.fill !== false) {
    ctx.fillStyle = rgba(o.color || C.data, a);
    ctx.fill();
  }
  if (o.ring) {
    ctx.lineWidth = o.ringWidth || 2;
    ctx.strokeStyle = rgba(o.ring, a);
    ctx.stroke();
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return;
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  r = Math.min(r, w / 2, h / 2);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (o.fill) {
    ctx.fillStyle = rgba(o.fill, a * (o.fillAlpha === undefined ? 1 : o.fillAlpha));
    ctx.fill();
  }
  if (o.stroke) {
    ctx.lineWidth = o.width || 2;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.strokeStyle = rgba(o.stroke, a * (o.strokeAlpha === undefined ? 1 : o.strokeAlpha));
    ctx.stroke();
  }
  ctx.restore();
}

// Curly brace from (x1,y1) to (x2,y2); it bulges to the left of the direction of
// travel (for a left-to-right brace that is upwards; pass side: -1 for downwards).
export function brace(ctx, x1, y1, x2, y2, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const d = Math.min(o.depth || 16, len * 0.35);
  const side = o.side || 1;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const p = o.progress === undefined ? 1 : o.progress;
  ctx.save();
  ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.rotate(ang);
  ctx.scale(1, -side);
  const L = (len / 2) * p;
  const k = d * 0.5;
  // filled, tapered brace (thick in the middle of each arm, thin at the ends)
  const t0 = (o.width || 2.6) * 0.45, t1 = o.width || 2.6;
  ctx.beginPath();
  ctx.moveTo(-L, 0);
  ctx.bezierCurveTo(-L, k, -L + k * 0.6, k, -L + k * 1.2, k);
  ctx.lineTo(-k * 1.2, k);
  ctx.bezierCurveTo(-k * 0.5, k, 0, d - k * 0.3, 0, d);
  ctx.bezierCurveTo(0, d - k * 0.3, k * 0.5, k, k * 1.2, k);
  ctx.lineTo(L - k * 1.2, k);
  ctx.bezierCurveTo(L - k * 0.6, k, L, k, L, 0);
  ctx.strokeStyle = rgba(o.color || C.soft, a);
  ctx.lineWidth = (t0 + t1) / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}
// tip point of a brace (where its label goes)
export function braceTip(x1, y1, x2, y2, depth = 16, side = 1, gap = 14) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const d = Math.min(depth, len * 0.35) + gap;
  const nx = (y2 - y1) / len, ny = -(x2 - x1) / len;
  return [(x1 + x2) / 2 + nx * d * side, (y1 + y2) / 2 + ny * d * side];
}

// Dimension line: |<———>| between x1 and x2 at height y, used for distances.
export function span(ctx, x1, x2, y, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002) return;
  const col = o.color || C.soft;
  const tk = o.tick === undefined ? 9 : o.tick;
  line(ctx, x1, y - tk, x1, y + tk, { color: col, alpha: a, width: o.width || 2 });
  line(ctx, x2, y - tk, x2, y + tk, { color: col, alpha: a, width: o.width || 2 });
  if (Math.abs(x2 - x1) > 4) line(ctx, x1, y, x2, y, { color: col, alpha: a, width: o.width || 2, progress: o.progress, from: 'center' });
}

// Polyline through points [[x,y],...]; progress draws a prefix of it.
export function poly(ctx, pts, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.002 || pts.length < 2) return;
  const p = o.progress === undefined ? 1 : o.progress;
  const n = Math.max(2, Math.floor(pts.length * p));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (p < 1 && n < pts.length) {
    const f = pts.length * p - (n - 1);
    const [x0, y0] = pts[n - 1], [x1, y1] = pts[Math.min(n, pts.length - 1)];
    ctx.lineTo(lerp(x0, x1, clamp(f)), lerp(y0, y1, clamp(f)));
  }
  if (o.fill) {
    ctx.fillStyle = rgba(o.fill, a * (o.fillAlpha === undefined ? 1 : o.fillAlpha));
    ctx.fill();
  }
  if (o.color !== null) {
    ctx.strokeStyle = rgba(o.color || C.text, a);
    ctx.lineWidth = o.width || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------- axes ----------------
// A horizontal number line mapping values v0..v1 to pixels x0..x1 at height y.
export class Axis {
  constructor({ x0, x1, y, v0, v1 }) {
    Object.assign(this, { x0, x1, y, v0, v1 });
  }
  X(v) {
    return this.x0 + ((v - this.v0) / (this.v1 - this.v0)) * (this.x1 - this.x0);
  }
  V(x) {
    return this.v0 + ((x - this.x0) / (this.x1 - this.x0)) * (this.v1 - this.v0);
  }
  get unit() {
    return (this.x1 - this.x0) / (this.v1 - this.v0);
  }
  draw(ctx, o = {}) {
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0.002) return;
    const p = o.progress === undefined ? 1 : o.progress;
    const col = o.color || C.axis;
    line(ctx, this.x0, this.y, this.x1, this.y, { color: col, alpha: a * 0.9, width: o.width || 2.5, progress: p, from: o.from || 'center' });
    if (o.arrow !== false) {
      // small arrow at the right end
      const ex = this.x1 + 14;
      if (p >= 0.99) arrow(ctx, this.x1 - 2, this.y, ex, this.y, { color: col, alpha: a * 0.9 * clamp((p - 0.9) * 10), width: o.width || 2.5, head: 13 });
    }
    const ticks = o.ticks || [];
    const tl = o.tickLen || 10;
    ticks.forEach((v, i) => {
      const x = this.X(v);
      const mid = (this.x0 + this.x1) / 2;
      const reach = Math.abs(x - mid) / ((this.x1 - this.x0) / 2);
      const ta = a * clamp((p - reach * 0.9) * 5);
      if (ta <= 0) return;
      line(ctx, x, this.y - tl / 2, x, this.y + tl / 2, { color: col, alpha: ta, width: 2 });
      const lab = o.labels ? o.labels[i] : null;
      if (lab !== null && lab !== undefined && lab !== false)
        num(ctx, String(lab), x, this.y + (o.labelGap || 34), o.labelSize || 26, { color: o.labelColor || C.dim, alpha: ta });
    });
  }
}

// A 2D plot area: X(v), Y(v) map data to pixels.
export class Plot {
  constructor({ x, y, w, h, xr, yr }) {
    Object.assign(this, { x, y, w, h, xr, yr });
  }
  X(v) {
    return this.x + ((v - this.xr[0]) / (this.xr[1] - this.xr[0])) * this.w;
  }
  Y(v) {
    return this.y + this.h - ((v - this.yr[0]) / (this.yr[1] - this.yr[0])) * this.h;
  }
  curve(fn, a = this.xr[0], b = this.xr[1], n = 240) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const v = a + ((b - a) * i) / n;
      pts.push([this.X(v), this.Y(fn(v))]);
    }
    return pts;
  }
  // closed polygon under fn between a and b (for shading areas)
  area(fn, a, b, n = 120) {
    const pts = [[this.X(a), this.Y(0)]];
    for (let i = 0; i <= n; i++) {
      const v = a + ((b - a) * i) / n;
      pts.push([this.X(v), this.Y(fn(v))]);
    }
    pts.push([this.X(b), this.Y(0)]);
    return pts;
  }
}

export function fillPoly(ctx, pts, color, alpha = 1) {
  if (alpha <= 0.002 || pts.length < 3) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = rgba(color, alpha);
  ctx.fill();
  ctx.restore();
}

// Soft rounded panel used behind groups of formulas.
export function panel(ctx, x, y, w, h, o = {}) {
  roundRect(ctx, x, y, w, h, o.r || 18, { fill: o.fill || '#151C29', fillAlpha: (o.fillAlpha || 0.72), stroke: o.stroke || '#2A3343', width: 1.5, alpha: o.alpha });
}

// Chinese words followed by a number in the math font, as one centred label: "平均 1.1".
export function labelNum(ctx, words, s, x, y, o = {}) {
  const size = o.size || 26;
  const nsize = size * (o.numScale || 1.08);
  const ww = measure(ctx, words, size, o.weight || 400);
  const gap = size * 0.3;
  const nw = numWidth(s, nsize);
  const total = ww + gap + nw;
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  text(ctx, words, x0, y, { ...o, size, align: 'left' });
  num(ctx, s, x0 + ww + gap, y, nsize, { color: o.color, alpha: o.alpha, align: 'left' });
  return total;
}
