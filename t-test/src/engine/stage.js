// The frame renderer: background, scene layers, chapter marks and subtitles.
// render(ctx, t) is a pure function of t, so any frame can be drawn in any order.
import { W, H, C, FONT } from './theme.js';
import { clamp, ease, rgba, prog, win } from './util.js';
import { text, measure, line, rich, subtitleParts } from './draw.js';

let bgCanvas = null;
function background() {
  if (bgCanvas) return bgCanvas;
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = W;
  bgCanvas.height = H;
  const g = bgCanvas.getContext('2d');
  const grad = g.createRadialGradient(W * 0.5, H * 0.42, 60, W * 0.5, H * 0.5, W * 0.72);
  grad.addColorStop(0, '#141B27');
  grad.addColorStop(0.55, '#0E131C');
  grad.addColorStop(1, '#07090D');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  // fine noise so the gradient does not band after video compression
  const img = g.getImageData(0, 0, W, H);
  let s = 12345;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const n = ((s >> 16) & 7) - 3.5;
    img.data[i] += n * 0.55;
    img.data[i + 1] += n * 0.55;
    img.data[i + 2] += n * 0.6;
  }
  g.putImageData(img, 0, 0);
  // gentle darkening behind the subtitle band
  const sb = g.createLinearGradient(0, H - 190, 0, H);
  sb.addColorStop(0, 'rgba(0,0,0,0)');
  sb.addColorStop(1, 'rgba(0,0,0,0.32)');
  g.fillStyle = sb;
  g.fillRect(0, H - 190, W, 190);
  return bgCanvas;
}

// ---------- subtitles ----------
const SUB = { size: 38, y: H - 58, maxW: 1640 };
function splitLines(ctx, s) {
  if (measure(ctx, s, SUB.size, 500) <= SUB.maxW) return [s];
  // break at the punctuation closest to the middle
  const mid = s.length / 2;
  let best = -1;
  for (let i = 1; i < s.length - 1; i++) if ('，、；：'.includes(s[i]) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  if (best < 0) best = Math.floor(mid);
  return [s.slice(0, best + 1), s.slice(best + 1)];
}
function drawSubtitles(ctx, t, cues, lift = 0) {
  // binary search for the cue at time t
  let lo = 0, hi = cues.length - 1, found = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (cues[m].g0 <= t) { found = m; lo = m + 1; } else hi = m - 1;
  }
  if (found < 0) return;
  const c = cues[found];
  if (t > c.g1 + 0.15) return;
  const a = Math.min(clamp((t - c.g0) / 0.12), clamp((c.g1 + 0.15 - t) / 0.15));
  if (a <= 0) return;
  const lines = splitLines(ctx, c.text);
  lines.forEach((ln, i) => {
    const y = SUB.y - lift - (lines.length - 1 - i) * (SUB.size * 1.32);
    const parts = subtitleParts(ln);
    const st = { size: SUB.size, weight: 500, color: '#F3F5F9', alpha: a, stroke: 5, strokeColor: 'rgba(5,7,10,0.85)', shadow: 10 };
    if (parts.length === 1 && typeof parts[0] === 'string') text(ctx, ln, W / 2, y, { ...st, letter: 0.5 });
    else rich(ctx, parts, W / 2, y, { ...st, texScale: 1.08, bold: 0.9 });
  });
}

// ---------- chapter cards and the corner mark ----------
function drawChapters(ctx, t, chapters) {
  for (const c of chapters) {
    // the corner mark stays on while the chapter runs
    const markIn = c.n === 1 ? c.first + 1.0 : c.first + 0.2;
    const ma = win(t, markIn, c.g1 + 0.6, 0.8, 0.6) * 0.75;
    if (ma > 0) {
      text(ctx, `${c.cn}、${c.title}`, 64, 56, { size: 22, weight: 400, color: C.dim, alpha: ma, align: 'left' });
    }
    if (c.n === 1) continue;
    // centred card in the pause before the chapter
    const t0 = c.g0 + 0.15, t1 = c.first - 0.05;
    if (t < t0 || t > t1 + 0.6) continue;
    const pin = prog(t, t0, 0.7, ease.out);
    const pout = prog(t, t1 - 0.35, 0.8, ease.inOut);
    const a = pin * (1 - pout);
    if (a <= 0) continue;
    const y = H / 2 - 10 - pout * 26;
    text(ctx, c.cn, W / 2, y - 64, { size: 34, weight: 400, color: C.dim, alpha: a, family: 'serif' });
    text(ctx, c.title, W / 2, y + 6, { size: 64, weight: 600, color: C.text, alpha: a, family: 'serif', letter: 2 });
    const lw = 120 * ease.out(pin);
    line(ctx, W / 2 - lw / 2, y + 74, W / 2 + lw / 2, y + 74, { color: C.faint, alpha: a, width: 2 });
  }
}

export function createRenderer({ tl, layers, debug = false }) {
  const sorted = [...layers].sort((a, b) => (a.z || 0) - (b.z || 0));
  // o.scale: device pixels per frame pixel (the player draws at screen resolution);
  // o.subtitles: false hides the burned-in subtitles (the player can toggle them);
  // o.subtitleLift: move the subtitles up by this many frame pixels (above the player's controls).
  return function render(ctx, t, o = {}) {
    const k = o.scale || 1;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.drawImage(background(), 0, 0, W, H);
    for (const L of sorted) {
      if (t < L.t0 || t > L.t1) continue;
      ctx.save();
      L.draw(ctx, t);
      ctx.restore();
    }
    drawChapters(ctx, t, tl.chapters);
    if (o.subtitles !== false) drawSubtitles(ctx, t, tl.cues, o.subtitleLift || 0);
    if (debug) {
      text(ctx, t.toFixed(2) + ' s', W - 40, 40, { size: 20, color: '#666', align: 'right' });
    }
  };
}
