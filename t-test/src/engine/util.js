// Small math, easing and color helpers shared by every scene.

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, p) => a + (b - a) * p;
export const invLerp = (a, b, x) => (b === a ? 0 : (x - a) / (b - a));
export const remap = (x, a, b, c, d) => lerp(c, d, invLerp(a, b, x));

// Easing curves (input and output in [0, 1]).
export const ease = {
  linear: (p) => p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  outQuint: (p) => 1 - Math.pow(1 - p, 5),
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  smooth: (p) => p * p * p * (p * (p * 6 - 15) + 10),
  outBack: (p) => {
    const c1 = 1.2, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
};

// Progress of an animation that starts at t0 and lasts dur seconds.
export function prog(t, t0, dur = 0.8, fn = ease.inOut) {
  if (dur <= 0) return t >= t0 ? 1 : 0;
  return fn(clamp((t - t0) / dur));
}

// Fade in at t0, fade out at t1 (each fade lasts f seconds). Returns 0..1.
export function win(t, t0, t1, fin = 0.5, fout = fin) {
  if (t < t0 || t > t1 + fout) return 0;
  const a = fin > 0 ? clamp((t - t0) / fin) : 1;
  const b = t1 === Infinity ? 1 : fout > 0 ? 1 - clamp((t - t1) / fout) : t <= t1 ? 1 : 0;
  return ease.inOut(Math.min(a, b));
}

// Piecewise keyframes: keys = [[t, value], ...]; values may be numbers or arrays.
export function keys(t, ks, fn = ease.inOut) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1] = ks[i];
    if (t < t1) {
      const [t0, v0] = ks[i - 1];
      const p = fn(clamp((t - t0) / (t1 - t0)));
      return mix(v0, v1, p);
    }
  }
  return ks[ks.length - 1][1];
}

export function mix(a, b, p) {
  if (typeof a === 'number') return a + (b - a) * p;
  if (Array.isArray(a)) return a.map((x, i) => mix(x, b[i], p));
  if (typeof a === 'string') return mixColor(a, b, p);
  return p < 0.5 ? a : b;
}

// ---------- color ----------
const colorCache = new Map();
export function parseColor(c) {
  if (Array.isArray(c)) return c;
  let v = colorCache.get(c);
  if (v) return v;
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length > 6 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  } else {
    const m = c.match(/rgba?\(([^)]+)\)/);
    const parts = m[1].split(',').map((s) => parseFloat(s));
    v = [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  colorCache.set(c, v);
  return v;
}
export function rgba(c, alpha = 1) {
  const [r, g, b, a] = parseColor(c);
  return `rgba(${r | 0},${g | 0},${b | 0},${+(a * alpha).toFixed(4)})`;
}
export function mixColor(c1, c2, p) {
  const a = parseColor(c1), b = parseColor(c2);
  return `rgba(${lerp(a[0], b[0], p) | 0},${lerp(a[1], b[1], p) | 0},${lerp(a[2], b[2], p) | 0},${lerp(a[3], b[3], p).toFixed(4)})`;
}

// ---------- seeded randomness (simulations must be identical on every frame/run) ----------
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function normalSampler(seed) {
  const u = rng(seed);
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let a, b, s;
    do { a = u() * 2 - 1; b = u() * 2 - 1; s = a * a + b * b; } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    spare = b * m;
    return a * m;
  };
}

// ---------- distributions ----------
export const normPdf = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
export function erf(x) {
  // Abramowitz–Stegun 7.1.26 is too coarse for tail labels; use a series/continued fraction.
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  if (x < 3) {
    let sum = x, term = x, n = 0;
    while (Math.abs(term) > 1e-16 * Math.abs(sum)) {
      n++;
      term *= (-x * x) / n;
      sum += term / (2 * n + 1);
    }
    return sign * (2 / Math.sqrt(Math.PI)) * sum;
  }
  // continued fraction for erfc
  let f = 0;
  for (let k = 60; k >= 1; k--) f = (k / 2) / (x + f);
  const erfc = Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
  return sign * (1 - erfc);
}
export const normCdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));

export function lgamma(x) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export function tPdf(x, nu) {
  if (!isFinite(nu)) return normPdf(x);
  return Math.exp(lgamma((nu + 1) / 2) - lgamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (x * x) / nu));
}
export function chi2Pdf(x, k) {
  if (x <= 0) return 0;
  return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2));
}
// density of s^2/sigma^2 = chi2_nu / nu
export const scaledChi2Pdf = (x, nu) => nu * chi2Pdf(nu * x, nu);

// Simpson integration helper (used for tail areas and mixtures).
export function integrate(f, a, b, n = 400) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

// Format a number the way it is spoken in the narration (minus sign is U+2212).
export function fmt(x, digits = 1) {
  const s = Math.abs(x).toFixed(digits);
  return (x < -1e-12 && +s !== 0 ? '−' : '') + s;
}
