// TeX -> glyph data, using MathJax 4 (New Computer Modern font) in Node.
// Each formula becomes a list of glyph outlines with absolute transforms, so the
// browser can draw, move, recolour and morph individual glyphs on a canvas.
import { mathjax } from '@mathjax/src/mjs/mathjax.js';
import { TeX } from '@mathjax/src/mjs/input/tex.js';
import { SVG } from '@mathjax/src/mjs/output/svg.js';
import { liteAdaptor } from '@mathjax/src/mjs/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/mjs/handlers/html.js';
import '@mathjax/src/mjs/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/mjs/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/mjs/input/tex/html/HtmlConfiguration.js';
import '@mathjax/src/mjs/input/tex/cancel/CancelConfiguration.js';
import { MathJaxNewcmFont } from '@mathjax/mathjax-newcm-font/mjs/svg.js';

mathjax.asyncLoad = (name) => import(name);
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: ['base', 'ams', 'html', 'cancel'] });
const svg = new SVG({ fontCache: 'none', fontData: MathJaxNewcmFont, linebreaks: { inline: false } });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

// ---- 2D affine matrices [a, b, c, d, e, f] (SVG convention) ----
const I = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
function parseTransform(s) {
  let m = I;
  if (!s) return m;
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let r;
  while ((r = re.exec(s))) {
    const v = r[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let t = I;
    if (r[1] === 'translate') t = [1, 0, 0, 1, v[0], v[1] || 0];
    else if (r[1] === 'scale') t = [v[0], 0, 0, v.length > 1 ? v[1] : v[0], 0, 0];
    else if (r[1] === 'matrix') t = v;
    else if (r[1] === 'rotate') {
      const a = (v[0] * Math.PI) / 180;
      t = [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
    }
    m = mul(m, t);
  }
  return m;
}

// Bounding box of a path from its coordinates (control points included: a safe over-estimate).
function pathBBox(d) {
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) || [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  // MathJax paths use absolute commands with x y pairs (M L C Q Z), so pairs work.
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

// Approximate outline length (used for the stroke-drawing "write" effect).
function pathLength(d) {
  const toks = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, len = 0;
  const num = () => +toks[i++];
  while (i < toks.length) {
    if (/[MCLZ]/.test(toks[i])) cmd = toks[i++];
    if (cmd === 'M') { x = sx = num(); y = sy = num(); cmd = 'L'; }
    else if (cmd === 'L') { const nx = num(), ny = num(); len += Math.hypot(nx - x, ny - y); x = nx; y = ny; }
    else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      let px = x, py = y;
      for (let k = 1; k <= 8; k++) {
        const t = k / 8, u = 1 - t;
        const qx = u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
        const qy = u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
        len += Math.hypot(qx - px, qy - py); px = qx; py = qy;
      }
      x = x3; y = y3;
    } else if (cmd === 'Z') { len += Math.hypot(sx - x, sy - y); x = sx; y = sy; cmd = ''; }
    else i++;
  }
  return Math.round(len);
}

const round = (x) => Math.round(x * 100) / 100;

export class GlyphStore {
  constructor() {
    this.paths = [];
    this.pathIndex = new Map();
    this.pathBoxes = [];
    this.pathLens = [];
    this.formulas = {};
  }
  pathId(d) {
    let id = this.pathIndex.get(d);
    if (id === undefined) {
      id = this.paths.length;
      this.paths.push(d);
      this.pathBoxes.push(pathBBox(d).map(round));
      this.pathLens.push(pathLength(d));
      this.pathIndex.set(d, id);
    }
    return id;
  }
  async add(key, src, display = true) {
    if (this.formulas[key]) return this.formulas[key];
    const node = await doc.convertPromise(src, { display });
    const svgNode = adaptor.firstChild(node);
    const vb = adaptor.getAttribute(svgNode, 'viewBox').split(/\s+/).map(Number);
    const glyphs = [], rects = [], texts = [];
    const walk = (n, m, tags) => {
      if (adaptor.kind(n) === '#text') return;
      const kind = adaptor.kind(n);
      const tr = adaptor.getAttribute(n, 'transform');
      let mm = tr && kind !== 'text' ? mul(m, parseTransform(tr)) : m;
      const cls = adaptor.getAttribute(n, 'class');
      let tg = tags;
      if (cls) {
        const own = cls.split(/\s+/).filter((c) => c && !c.startsWith('mjx') && c !== 'MathJax');
        if (own.length) tg = [...tags, ...own];
      }
      if (kind === 'path') {
        const d = adaptor.getAttribute(n, 'd');
        if (d && d.trim()) {
          glyphs.push({ p: this.pathId(d), m: mm.map(round), c: adaptor.getAttribute(n, 'data-c') || '', t: tg });
        }
      } else if (kind === 'rect') {
        const x = +adaptor.getAttribute(n, 'x') || 0, y = +adaptor.getAttribute(n, 'y') || 0;
        const w = +adaptor.getAttribute(n, 'width'), h = +adaptor.getAttribute(n, 'height');
        const d = `M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`;
        glyphs.push({ p: this.pathId(d), m: mm.map(round), c: 'rect', t: tg });
      } else if (kind === 'line') {
        const g = (k) => +adaptor.getAttribute(n, k) || 0;
        const sw = +adaptor.getAttribute(n, 'stroke-width') || 60;
        const [x1, y1, x2, y2] = [g('x1'), g('y1'), g('x2'), g('y2')];
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = (-(y2 - y1) / len) * (sw / 2), ny = ((x2 - x1) / len) * (sw / 2);
        const d = `M${x1 + nx} ${y1 + ny}L${x2 + nx} ${y2 + ny}L${x2 - nx} ${y2 - ny}L${x1 - nx} ${y1 - ny}Z`;
        glyphs.push({ p: this.pathId(d), m: mm.map(round), c: 'line', t: tg });
      } else if (kind === 'text') {
        const size = +adaptor.getAttribute(n, 'font-size').replace('px', '');
        const str = adaptor.textContent(n);
        // the text element flips itself back with scale(1,-1); keep the outer matrix
        texts.push({ s: str, size, m: mm.map(round), t: tg });
      }
      for (const ch of adaptor.childNodes(n)) walk(ch, mm, tg);
    };
    walk(svgNode, I, []);
    const f = { src, w: round(vb[2]), h: round(-vb[1]), d: round(vb[3] + vb[1]), x0: round(vb[0]), g: glyphs, txt: texts };
    this.formulas[key] = f;
    return f;
  }
  toJSON() {
    return { paths: this.paths, boxes: this.pathBoxes, lens: this.pathLens, formulas: this.formulas };
  }
}
