// 二、平均值会偏离多远：推出 σ/√n
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, numWidth, labelNum, line, arrow, dot, Axis, span, brace, braceTip, roundRect, rich, poly, Plot, fillPoly, panel, mixed } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, fmt, normPdf, mixColor } from '../engine/util.js';
import { DATA, MEAN, stackDots, histBars, binCounts, drawGrid, cellCenter, bestSeed } from './common.js';

const T = (s, o) => tex(s, o);

export function build2(N) {
  const S = N.chapter(2);
  const { A, E } = S;
  const layers = [];
  const LB = {
    nRow: mixed('$n$ 行'),
    nCol: mixed('$n$ 列'),
    n5: mixed('（图中 $n=5$）'),
  };

  // =====================================================================
  // 2A  errors and the sample
  // =====================================================================
  const a = {
    start: S.first,
    err: A('叫作误差'),
    errSym: A('记作艾普西隆'),
    pop: A('这五个数是从所有可能的产品中抽出来的'),
    sample: A('叫作样本'),
    xbar: A('它们的平均值叫作样本均值'),
    end: A('假设新工艺无效，每次随机抽五个数'),
  };
  const axA = new Axis({ x0: 300, x1: 1620, y: 620, v0: -2.2, v1: 3.4 });
  const fEps = T(String.raw`\varepsilon_i = x_i - \mu`);
  const epsLab = DATA.map((_, i) => T(`\\varepsilon_${i + 1}`, { inline: true }));
  const fMu = T(String.raw`\mu`, { inline: true });
  const fN5 = T(String.raw`n = 5`, { inline: true });
  const fXbar = T(String.raw`\bar{x} = 1.1`, { inline: true });
  const rank = DATA.map((v, i) => i).sort((p, q) => Math.abs(DATA[p]) - Math.abs(DATA[q]));
  const rowOf = DATA.map((_, i) => rank.indexOf(i));
  const popPts = (() => {
    const pts = [];
    for (let v = axA.v0; v <= axA.v1 + 1e-9; v += 0.02) pts.push([axA.X(v), axA.y - normPdf(v) * 560]);
    return pts;
  })();

  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.4,
    draw(ctx, t) {
      const out = prog(t, a.end - 0.2, 1.0, ease.inOut); // hands over to the simulation
      const A1 = prog(t, a.start - 0.5, 0.7) * (1 - out);
      if (A1 <= 0) return;
      const ax = axA;
      ax.draw(ctx, { alpha: A1, ticks: [-2, -1, 0, 1, 2, 3], labels: ['−2', '−1', '0', '1', '2', '3'] });
      // population: all possible batches (a faint curve behind)
      const pp = prog(t, a.pop + 0.2, 1.4, ease.inOut);
      if (pp > 0) {
        const pa = A1 * pp;
        fillPoly(ctx, [[ax.X(ax.v0), ax.y], ...popPts, [ax.X(ax.v1), ax.y]], C.data, 0.06 * pa);
        poly(ctx, popPts, { color: C.data, width: 1.6, alpha: 0.35 * pa, progress: pp });
        text(ctx, '所有可能的产品', ax.X(-1.35), ax.y - 230, { size: 26, color: C.soft, alpha: pa });
      }
      // true mean μ (red)
      const x0 = ax.X(0);
      line(ctx, x0, ax.y + 12, x0, ax.y - 300, { color: C.mu, width: 3, alpha: A1 });
      drawTex(ctx, fMu, x0, ax.y - 324, 40, { color: C.mu, alpha: A1 });
      // errors: arrows from μ to each observation, stacked by length
      DATA.forEach((v, i) => {
        const pa = prog(t, a.err + 0.1 + rowOf[i] * 0.14, 0.6, ease.out) * A1 * (1 - 0.7 * prog(t, a.pop, 0.8));
        const y = ax.y - 64 - rowOf[i] * 30;
        if (pa > 0) {
          arrow(ctx, x0, y, ax.X(v), y, { color: C.err, width: 3, head: 13, alpha: pa, progress: pa });
          const lx = ax.X(v) + (v >= 0 ? 22 : -22);
          drawTex(ctx, epsLab[i], lx, y, 30, { color: C.err, alpha: pa * prog(t, a.errSym, 0.5), align: v >= 0 ? 'l' : 'r' });
        }
        // the observation itself
        dot(ctx, ax.X(v), ax.y, 9, { color: C.data, alpha: A1, glow: 0.6 });
        num(ctx, fmt(v, 1), ax.X(v), ax.y + 64, 22, { color: C.data, alpha: A1 * 0.0 });
      });
      drawTex(ctx, fEps, 960, 200, 56, { alpha: A1 * prog(t, a.errSym - 0.1, 0.4), write: prog(t, a.errSym - 0.1, 1.0, ease.linear), colors: {} });
      // the five numbers are a sample
      const ps = prog(t, a.sample, 0.7, ease.inOut) * A1;
      if (ps > 0) {
        const xa = ax.X(-0.2), xb = ax.X(2.5), yb = ax.y + 78;
        brace(ctx, xa, yb, xb, yb, { side: -1, depth: 16, color: C.data, alpha: ps * 0.9 });
        rich(ctx, ['样本　', fN5], (xa + xb) / 2, yb + 46, { size: 28, color: C.data, alpha: ps });
      }
      // sample mean x̄ (blue)
      const pb = prog(t, a.xbar + 0.2, 0.8, ease.inOut) * A1;
      if (pb > 0) {
        const xm = ax.X(MEAN);
        line(ctx, xm, ax.y + 12, xm, ax.y - 13, { color: C.xbar, width: 3, alpha: pb });
        line(ctx, xm, ax.y - 30, xm, lerp(ax.y - 30, ax.y - 236, pb), { color: C.xbar, width: 3, alpha: pb });
        rich(ctx, ['样本均值 ', fXbar], xm + 18, ax.y - 260, { size: 28, color: C.xbar, alpha: pb, align: 'left' });
      }
    },
  });

  // =====================================================================
  // 2B  repeated sampling: single values vs. sample means
  // =====================================================================
  const b = {
    start: a.end,
    draw5: A('每次随机抽五个数'),
    calc: A('算一次样本均值'),
    record: A('再把它记在下面这条线上'),
    many: A('重复很多次以后可以看到'),
    narrow: A('样本均值的分布比单个数据的分布窄得多'),
    why: A('这是因为几个数据的误差有正有负'),
    cancel: A('平均的时候会互相抵消一部分'),
    end: A('重复抽样很多次，误差有时为正'),
  };
  const axT = new Axis({ x0: 300, x1: 1620, y: 450, v0: -3, v1: 3 });
  const axB = new Axis({ x0: 300, x1: 1620, y: 850, v0: -3, v1: 3 });
  const g = normalSampler(31);
  const R = 140;
  const rounds = Array.from({ length: R }, () => Array.from({ length: 5 }, () => g()));
  {
    // the first (slow) round should have a mean clearly away from 0, so its mark is visible
    const avg = (r) => r.reduce((p, q) => p + q, 0) / 5;
    const j = rounds.findIndex((r) => avg(r) > 0.45 && avg(r) < 0.7 && Math.min(...r) > -2.2 && Math.max(...r) < 2.2);
    if (j > 0) [rounds[0], rounds[j]] = [rounds[j], rounds[0]];
  }
  const means = rounds.map((r) => r.reduce((p, q) => p + q, 0) / 5);
  const BIN = 0.06;
  const topStack = stackDots(rounds.flat(), BIN);
  const botStack = stackDots(means, BIN);
  // schedule: three slow rounds, then faster and faster
  // round 0 follows the narration: values appear ("每次随机抽五个数"), the mean is
  // marked ("算一次样本均值") and recorded below ("再把它记在下面这条线上")
  const r0a = b.draw5 + 0.2, r0end = b.record + 1.1;
  const rT = [r0a];
  const slow = 1.3;
  rT.push(r0end, r0end + slow);
  const fastEnd = b.narrow + 0.6;
  for (let r = 3; r <= R; r++) rT.push(rT[2] + slow + (fastEnd - rT[2] - slow) * Math.pow((r - 3) / (R - 3), 0.62));
  const dur = (r) => Math.max(0.12, rT[r + 1] - rT[r]);
  // local progress of round r; round 0 is stretched so its stages match the words
  const roundQ = (r, t) => {
    if (r > 0) return clamp((t - rT[r]) / dur(r));
    if (t < b.calc) return 0.34 * clamp((t - r0a) / Math.max(0.3, b.calc - r0a));
    if (t < b.record) return 0.34 + 0.2 * clamp((t - b.calc) / Math.max(0.3, b.record - b.calc));
    return 0.54 + 0.46 * clamp((t - b.record) / (r0end - b.record));
  };
  // one sample whose errors largely cancel
  const demo = [1.3, -0.8, 0.9, -1.2, 0.1];
  const demoSum = demo.reduce((p, q) => p + q, 0);

  function drawPiles(ctx, t, alpha, upTo = Infinity, dim = 1) {
    const dT = BIN * axT.unit;
    for (let r = 0; r < R; r++) {
      if (t < rT[r]) break;
      const q = roundQ(r, t);
      const fastR = dur(r) < 0.5;
      for (let k = 0; k < 5; k++) {
        const sd = topStack[r * 5 + k];
        const px = axT.X(sd.x);
        const py = axT.y - 8 - dT * 0.5 - sd.k * dT;
        if (q >= 1 || fastR) {
          const qq = fastR ? clamp(q * 2.2) : 1;
          const y = lerp(axT.y - 300, py, ease.in(qq));
          dot(ctx, px, y, dT * 0.42, { color: C.data, alpha: alpha * 0.62 * dim * clamp(qq * 4) });
        } else {
          // slow round: value appears on the line, then settles into the pile
          const appear = clamp((q - k * 0.06) / 0.2);
          const settle = ease.inOut(clamp((q - 0.62) / 0.38));
          const x = axT.X(rounds[r][k]);
          dot(ctx, lerp(x, px, settle), lerp(axT.y, py, settle), lerp(9, dT * 0.42, settle), { color: C.data, alpha: alpha * appear, glow: 0.5 * (1 - settle) });
        }
      }
      // the mean of this round
      const sb = botStack[r];
      const mx = axB.X(sb.x), my = axB.y - 8 - dT * 0.5 - sb.k * dT;
      if (q >= 1 || fastR) {
        const qq = fastR ? clamp((q - 0.2) * 2.2) : 1;
        if (qq > 0) dot(ctx, mx, lerp(axT.y + 40, my, ease.inOut(qq)), dT * 0.42, { color: C.xbar, alpha: alpha * dim * clamp(qq * 3) });
      } else {
        const show = clamp((q - 0.36) / 0.12);
        const fall = ease.inOut(clamp((q - 0.55) / 0.42));
        const x0 = axT.X(means[r]);
        if (show > 0) {
          // tick at the mean on the top line
          line(ctx, x0, axT.y - 34, x0, axT.y + 14, { color: C.xbar, width: 3, alpha: alpha * show * (1 - fall) });
          dot(ctx, lerp(x0, mx, fall), lerp(axT.y, my, fall), lerp(8, dT * 0.42, fall), { color: C.xbar, alpha: alpha * show, glow: 0.6 * (1 - fall) });
        }
      }
    }
  }
  b.draw = drawPiles;

  const fSum = T(String.raw`\div 5`, { inline: true });
  layers.push({
    t0: b.start - 0.2,
    t1: b.end + 0.8,
    draw(ctx, t) {
      const pin = prog(t, b.start, 0.9, ease.inOut);
      const out = 1 - prog(t, b.end - 0.6, 0.7, ease.inOut);
      const A2 = pin * out;
      if (A2 <= 0) return;
      // the top line grows out of the previous scene's line
      const ax = axT;
      ax.draw(ctx, { alpha: A2, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3', '−2', '−1', '0', '1', '2', '3'] });
      const pB = prog(t, b.record - 0.4, 0.8, ease.inOut);
      axB.draw(ctx, { alpha: A2 * pB, progress: pB, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3', '−2', '−1', '0', '1', '2', '3'] });
      text(ctx, '单个数据', 272, ax.y, { size: 28, color: C.data, alpha: A2, align: 'right' });
      text(ctx, '样本均值', 272, axB.y, { size: 28, color: C.xbar, alpha: A2 * pB, align: 'right' });
      // μ = 0 through both lines
      const x0 = ax.X(0);
      line(ctx, x0, 120, x0, axB.y + 14, { color: C.mu, width: 2.5, alpha: A2 * 0.9 });
      drawTex(ctx, fMu, x0, 96, 36, { color: C.mu, alpha: A2 });
      text(ctx, '假设新工艺无效', x0 + 26, 96, { size: 24, color: C.mu, alpha: A2 * 0.85, align: 'left' });
      // simulation
      const dim = 1 - 0.88 * prog(t, b.why - 0.3, 0.6);
      drawPiles(ctx, t, A2, Infinity, dim);
      // compare spreads
      const pw = prog(t, b.narrow + 0.2, 0.8, ease.inOut) * (1 - prog(t, b.why - 0.3, 0.5));
      if (pw > 0) {
        span(ctx, ax.X(-1), ax.X(1), ax.y + 70, { color: C.data, alpha: A2 * pw, progress: pw });
        span(ctx, axB.X(-1 / Math.sqrt(5)), axB.X(1 / Math.sqrt(5)), axB.y + 70, { color: C.xbar, alpha: A2 * pw, progress: pw });
        text(ctx, '宽', ax.X(1) + 30, ax.y + 70, { size: 26, color: C.data, alpha: A2 * pw, align: 'left' });
        text(ctx, '窄', axB.X(1 / Math.sqrt(5)) + 30, axB.y + 70, { size: 26, color: C.xbar, alpha: A2 * pw, align: 'left' });
      }
      // why: one sample, errors with both signs, added head to tail
      const pd = prog(t, b.why, 0.6, ease.out);
      if (pd > 0) {
        const chain = prog(t, b.cancel - 0.2, 1.4, ease.inOut);
        const yc = 560;
        let acc = 0;
        demo.forEach((v, k) => {
          const pk = prog(t, b.why + 0.15 + k * 0.12, 0.5, ease.out);
          dot(ctx, ax.X(v), ax.y, 9, { color: C.data, alpha: A2 * pk, glow: 0.7 });
          // arrow: first from μ to the point (stacked above the line), then head to tail
          // in a staircase below the line, so every arrow stays visible
          const yr = ax.y - 52 - k * 24;
          const sx = lerp(x0, ax.X(acc), chain), ex = lerp(ax.X(v), ax.X(acc + v), chain);
          const y = lerp(yr, yc + k * 26, chain);
          arrow(ctx, sx, y, ex, y, { color: C.err, width: 3, head: 12, alpha: A2 * pk, progress: pk });
          if (k > 0 && chain > 0.6) line(ctx, ax.X(acc), yc + (k - 1) * 26, ax.X(acc), y, { color: C.err, width: 1.2, dash: [3, 4], alpha: A2 * (chain - 0.6) * 2 });
          acc += v;
        });
        // resultant sum and its fifth
        const pr = prog(t, b.cancel + 1.25, 0.6, ease.out);
        if (pr > 0) {
          const ys = yc + 5 * 26 + 18;
          arrow(ctx, x0, ys, ax.X(demoSum), ys, { color: C.err, width: 5, head: 16, alpha: A2 * pr, progress: pr });
          text(ctx, '相加：正负抵消', ax.X(demoSum) + 26, ys, { size: 26, color: C.err, alpha: A2 * pr, align: 'left' });
          const pf = prog(t, b.cancel + 2.0, 0.7, ease.inOut);
          if (pf > 0) {
            const m = demoSum / 5;
            drawTex(ctx, fSum, ax.X(demoSum) + 250, ys, 30, { color: C.err, alpha: A2 * pf, align: 'l' });
            dot(ctx, axB.X(m), lerp(ys, axB.y, pf), 9, { color: C.xbar, alpha: A2 * pf, glow: 0.8 });
          }
        }
      }
    },
  });

  // =====================================================================
  // 2C  E[ ]: averages over repeated sampling; E[ε] = 0, E[ε²] = σ²
  // =====================================================================
  const c = {
    start: b.end,
    zero: A('平均下来是 0'),
    eSym: A('画面上用 E 表示'),
    square: A('误差的平方则不同'),
    howBig: A('反映了误差通常有多大'),
    sigma: A('这就是方差'),
    indep: A('另外，我们假设各批数据互不影响'),
    end: A('样本均值的误差，等于各个误差的平均'),
  };
  const NE = 320;
  const drawEps = (seed) => { const gq = normalSampler(seed); return Array.from({ length: NE }, () => gq()); };
  const eps = drawEps(bestSeed((sd) => {
    const x = drawEps(sd);
    const m = x.reduce((p, q) => p + q, 0) / NE, m2 = x.reduce((p, q) => p + q * q, 0) / NE;
    return 3 * Math.abs(m) + Math.abs(m2 - 1);
  }));
  const epsT = [];
  {
    const t0 = c.start + 0.7, slowN = 5, sl = 0.75;
    for (let k = 0; k < slowN; k++) epsT.push(t0 + k * sl);
    const tf = c.howBig + 1.5;
    for (let k = slowN; k < NE; k++) epsT.push(t0 + slowN * sl + (tf - t0 - slowN * sl) * Math.pow((k - slowN) / (NE - slowN), 0.7));
  }
  const runE = [], runE2 = [];
  eps.reduce((s, v, k) => ((runE[k] = (s + v) / (k + 1)), s + v), 0);
  eps.reduce((s, v, k) => ((runE2[k] = (s + v * v) / (k + 1)), s + v * v), 0);
  const axE = new Axis({ x0: 150, x1: 870, y: 640, v0: -3, v1: 3 });
  const axE2 = new Axis({ x0: 1050, x1: 1770, y: 640, v0: 0, v1: 6 });
  const maxE = Math.max(...binCounts(eps, NE, -3, 0.25, 24));
  const maxE2 = Math.max(...binCounts(eps.map((v) => v * v), NE, 0, 0.25, 24));
  const fE0 = T(String.raw`E[\varepsilon] = 0`);
  const fE2 = T(String.raw`E[\varepsilon^2] = \class{s}{\sigma^2}`);
  const fE2q = T(String.raw`E[\varepsilon^2]`);
  const fEdef = T(String.raw`E[\;\cdot\;]`, { inline: true });
  const fEps1 = T(String.raw`\varepsilon`, { inline: true });
  const fEps2 = T(String.raw`\varepsilon^2`, { inline: true });

  layers.push({
    t0: c.start - 0.3,
    t1: c.end + 1.2,
    draw(ctx, t) {
      const A3 = prog(t, c.start - 0.1, 0.8, ease.inOut) * (1 - prog(t, c.end - 0.5, 0.9, ease.inOut));
      if (A3 <= 0) return;
      const k = epsT.findLastIndex((x) => x <= t); // index of the newest draw
      // --- left: ε ---
      axE.draw(ctx, { alpha: A3, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3', '−2', '−1', '0', '1', '2', '3'] });
      rich(ctx, ['误差 ', fEps1], axE.X(-3), 300, { size: 30, color: C.err, alpha: A3, align: 'left' });
      line(ctx, axE.X(0), axE.y + 12, axE.X(0), axE.y - 210, { color: C.mu, width: 2, alpha: A3 * 0.5, dash: [5, 6] });
      const nShown = k + 1;
      const hb = (v) => Math.floor((v + 3) / 0.25);
      histBars(ctx, axE, binCounts(eps, nShown, -3, 0.25, 24), -3, 0.25, maxE, 200, C.err, A3, { hiBin: k >= 0 && t - epsT[k] < 0.3 ? hb(eps[k]) : -1 });
      if (k >= 0) {
        // the newest draw as an arrow from 0
        const v = eps[k];
        const fresh = 1 - prog(t, epsT[k] + 0.25, 0.4);
        arrow(ctx, axE.X(0), axE.y - 240, axE.X(v), axE.y - 240, { color: C.err, width: 3.5, head: 14, alpha: A3 * (0.35 + 0.65 * fresh) });
        // running average
        const m = runE[k];
        const pm = prog(t, epsT[Math.min(k, 3)], 0.4);
        dot(ctx, axE.X(m), axE.y + 66, 7, { color: C.err, alpha: A3 * pm });
        labelNum(ctx, '平均', fmt(m, 2), axE.X(m), axE.y + 100, { size: 24, color: C.err, alpha: A3 * pm });
      }
      // E notation
      const pe = prog(t, c.eSym - 0.1, 0.6);
      if (pe > 0) {
        rich(ctx, [fEdef, '：重复抽样很多次时的平均'], 960, 140, { size: 32, alpha: A3 * pe, texScale: 1.15 });
        drawTex(ctx, fE0, axE.X(0), 220, 50, { alpha: A3 * pe, write: prog(t, c.eSym + 0.4, 0.8, ease.linear), colors: {} });
      }
      // --- right: ε² ---
      const pr = prog(t, c.square, 0.8, ease.inOut);
      if (pr > 0) {
        const ar = A3 * pr;
        axE2.draw(ctx, { alpha: ar, ticks: [0, 1, 2, 3, 4, 5, 6], labels: ['0', '1', '2', '3', '4', '5', '6'] });
        rich(ctx, ['误差的平方 ', fEps2], axE2.X(0), 300, { size: 30, color: C.sigma, alpha: ar, align: 'left' });
        const hb2 = (v) => Math.floor((v * v) / 0.25);
        histBars(ctx, axE2, binCounts(eps.map((v) => v * v), k + 1, 0, 0.25, 24), 0, 0.25, maxE2, 230, C.sigma, ar, { hiBin: k >= 0 && t - epsT[k] < 0.3 ? hb2(eps[k]) : -1 });
        if (k >= 0) {
          // the newest draw as a square of side |ε| (its area is ε²)
          const v = eps[k];
          const side = Math.abs(v) * 62;
          const cx = 1560, cy = 392;
          roundRect(ctx, cx - side / 2, cy - side / 2, side, side, 3, { fill: C.sigma, fillAlpha: 0.22, stroke: C.sigma, width: 2, alpha: ar });
          text(ctx, '这一次的面积', cx, cy + Math.max(side / 2, 20) + 26, { size: 22, color: C.dim, alpha: ar });
          const m2 = runE2[k];
          dot(ctx, axE2.X(m2), axE2.y + 66, 7, { color: C.sigma, alpha: ar });
          labelNum(ctx, '平均', fmt(m2, 2), axE2.X(m2), axE2.y + 100, { size: 24, color: C.sigma, alpha: ar });
        }
        // E[ε²] = σ²
        const ph = prog(t, c.howBig, 0.6);
        drawTexMorph(ctx, fE2q, { x: axE2.X(3), y: 220, size: 50 }, fE2, { x: axE2.X(3), y: 220, size: 50 }, prog(t, c.sigma + 0.2, 0.9), { alpha: A3 * ph, colorsB: { s: C.sigma } });
      }
      // independence
      const pi = prog(t, c.indep, 0.7);
      if (pi > 0) {
        text(ctx, '各批数据互不影响：相互独立', 960, 870, { size: 30, color: C.text, alpha: A3 * pi });
      }
    },
  });

  // =====================================================================
  // facts panel (top right), from the derivation until the end of the grid work
  // =====================================================================
  const d0 = c.end;
  const gridEnd = A('所以总和平均是 n 份西格玛平方');
  const facts = [T(String.raw`E[\varepsilon] = 0`), T(String.raw`E[\varepsilon^2] = \class{s}{\sigma^2}`)];
  const factHi = { // when each fact is used
    0: [A('第二批的误差平均起来仍然是 0') - 0.2, A('乘上第一批的误差以后') + 2.6],
    1: [A('对角线上是误差的平方') - 0.2, A('对角线上是误差的平方') + 3.0],
    2: [A('两批数据互不影响') - 0.2, A('两批数据互不影响') + 2.6],
  };
  layers.push({
    t0: d0 - 1,
    t1: gridEnd + 3,
    z: 2,
    draw(ctx, t) {
      const pa = prog(t, d0 - 0.4, 0.8, ease.inOut) * (1 - prog(t, gridEnd + 1.2, 0.8));
      if (pa <= 0) return;
      const x = 1490, y = 92, w = 380, h = 196;
      panel(ctx, x, y, w, h, { alpha: pa });
      text(ctx, '已知', x + 22, y + 30, { size: 22, color: C.dim, alpha: pa, align: 'left' });
      const hi = (i) => Math.max(...[factHi[i]].map(([s, e]) => win(t, s, e, 0.3, 0.5)));
      facts.forEach((f, i) => {
        const yy = y + 76 + i * 50;
        const h1 = hi(i);
        if (h1 > 0) roundRect(ctx, x + 12, yy - 22, w - 24, 44, 8, { fill: C.hi, fillAlpha: 0.12 * h1, alpha: pa });
        drawTex(ctx, f, x + 26, yy, 34, { align: 'l', alpha: pa, colors: { s: C.sigma } });
      });
      const h2 = hi(2);
      const yy = y + 76 + 100;
      if (h2 > 0) roundRect(ctx, x + 12, yy - 22, w - 24, 44, 8, { fill: C.hi, fillAlpha: 0.12 * h2, alpha: pa });
      text(ctx, '各批数据相互独立', x + 26, yy, { size: 28, alpha: pa, align: 'left' });
    },
  });

  // =====================================================================
  // 2D  the error of the mean, and what remains to be computed
  // =====================================================================
  const dd = {
    start: c.end,
    need: A('需要算的是'),
    isVar: A('这就是样本均值的方差'),
    pull: A('分母的 n 平方以后是 n 平方'),
    rest: A('剩下的就是'),
    end: A('先看只有两个误差的情形'),
  };
  const fD1a = T(String.raw`\bar{x}-\mu=\frac{x_1+\cdots+x_n}{n}-\mu`);
  const fD1m = T(String.raw`\bar{x}-\mu=\frac{(x_1-\mu)+\cdots+(x_n-\mu)}{n}`);
  const fD1b = T(String.raw`\bar{x}-\mu=\class{e}{\frac{\varepsilon_1+\cdots+\varepsilon_n}{n}}`);
  const fD2 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}`);
  const fD3 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}=E\Big[\Big(\frac{\varepsilon_1+\cdots+\varepsilon_n}{\class{n}{n}}\Big)^2\Big]`);
  const fD4 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}=\frac{1}{\class{n}{n^2}}\,\class{q}{E\big[(\varepsilon_1+\cdots+\varepsilon_n)^2\big]}`);
  const fWhy0 = T(String.raw`E[\bar{x}-\mu]=0`, { inline: true });
  const fQ = T(String.raw`=\ ?`, { inline: true });

  layers.push({
    t0: dd.start - 0.5,
    t1: dd.end + 1.0,
    draw(ctx, t) {
      const pa = prog(t, dd.start - 0.3, 0.6) * (1 - prog(t, dd.end - 0.3, 0.7, ease.inOut));
      if (pa <= 0) return;
      const cx = 760;
      // line 1: x̄ − μ in terms of the errors
      // write, move μ into the sum, then name each difference ε
      const w1 = prog(t, dd.start, 1.1, ease.linear);
      const m1 = prog(t, dd.start + 1.25, 0.9, ease.inOut);
      const m2 = prog(t, dd.start + 2.45, 0.85, ease.inOut);
      const P1 = { x: cx, y: 250, size: 52 };
      if (m1 <= 0) drawTex(ctx, fD1a, cx, 250, 52, { alpha: pa, write: w1 });
      else if (m2 <= 0) drawTexMorph(ctx, fD1a, P1, fD1m, P1, m1, { alpha: pa });
      else drawTexMorph(ctx, fD1m, P1, fD1b, P1, m2, { alpha: pa, colorsB: { e: C.err } });
      // line 2: the variance of the sample mean
      const p2 = prog(t, dd.need + 0.3, 0.8, ease.linear);
      const yv = 470;
      const pp = prog(t, dd.pull - 0.2, 1.4, ease.inOut);
      if (p2 > 0) {
        if (pp <= 0) {
          drawTex(ctx, fD2, cx, yv, 54, { alpha: pa, write: p2, colors: { v: C.xbar } });
        }
        // the brace naming it
        const bx = fD2.box(cx, yv, 54, 'c', 'm', 'v');
        const pv = prog(t, dd.isVar, 0.6) * (1 - prog(t, dd.pull - 0.4, 0.5));
        if (bx && pv > 0) {
          brace(ctx, bx.x0, bx.y1 + 10, bx.x1, bx.y1 + 10, { side: -1, depth: 14, color: C.xbar, alpha: pa * pv });
          text(ctx, '样本均值的方差', bx.cx, bx.y1 + 58, { size: 28, color: C.xbar, alpha: pa * pv });
          rich(ctx, ['因为 ', fWhy0], bx.cx, bx.y1 + 104, { size: 24, color: C.dim, alpha: pa * pv });
        }
      }
      // pull 1/n² out of the average
      if (pp > 0) {
        const m3 = prog(t, dd.pull - 0.2, 0.7, ease.inOut);
        const m4 = prog(t, dd.pull + 0.9, 1.0, ease.inOut);
        if (m4 <= 0) drawTexMorph(ctx, fD2, { x: cx, y: yv, size: 54 }, fD3, { x: cx, y: yv, size: 54 }, m3, { alpha: pa, colorsA: { v: C.xbar }, colorsB: { v: C.xbar } });
        else drawTexMorph(ctx, fD3, { x: cx, y: yv, size: 54 }, fD4, { x: cx, y: yv, size: 54 }, m4, { alpha: pa, colorsA: { v: C.xbar, n: C.hi }, colorsB: { v: C.xbar, n: C.hi, q: m4 >= 1 && t > dd.rest ? C.text : C.text }, map: { n: 'n' } });
      }
      // what remains: E[(ε1+…+εn)²] = ?
      const pq = prog(t, dd.rest, 0.6);
      if (pq > 0) {
        const bq = fD4.box(cx, yv, 54, 'c', 'm', 'q');
        roundRect(ctx, bq.x0 - 12, bq.y0 - 12, bq.w + 24, bq.h + 24, 10, { stroke: C.hi, width: 2, alpha: pa * pq });
        drawTex(ctx, fQ, bq.x1 + 24, bq.cy, 54, { color: C.hi, alpha: pa * pq, align: 'l' });
      }
    },
  });


  // =====================================================================
  // 2E  two errors: (ε1 + ε2)² as a 2×2 grid, averaged cell by cell
  // 2F  n errors: the n×n grid
  // =====================================================================
  const e = {
    start: A('先看只有两个误差的情形'),
    expand: A('把两个误差之和的平方展开'),
    grid: A('得到的四项正好可以排成一个方格'),
    diag: A('对角线上是两个误差各自的平方'),
    off: A('另外两格是两个误差的乘积'),
    avg: A('现在逐格求平均'),
    diagS: A('对角线上是误差的平方，平均都是'),
    indep: A('两批数据互不影响'),
    fix: A('不管第一批的误差是多少'),
    zero2: A('第二批的误差平均起来仍然是 0'),
    mult: A('乘上第一批的误差以后'),
    two: A('于是，两个误差之和的平方'),
    end: A('误差多了也是一样'),
  };
  const f = {
    start: e.end,
    nxn: A('展开后是一个 n 行 n 列的方格'),
    diag: A('对角线上有 n 格'),
    rest: A('其余的格子平均都是 0'),
    sum: A('所以总和平均是 n 份'),
    end: A('再除以 n 平方'),
  };
  const fExp = T(String.raw`\class{lhs}{(\varepsilon_1+\varepsilon_2)^2}\class{rhs}{=\class{a}{\varepsilon_1^2}+\class{b}{\varepsilon_1\varepsilon_2}+\class{c}{\varepsilon_2\varepsilon_1}+\class{d}{\varepsilon_2^2}}`);
  const epsT5 = [1, 2, 3, 4, 5].map((i) => T(`\\varepsilon_${i}`, { inline: true }));
  const term = (i, j) => T(i === j ? `\\varepsilon_${i + 1}^2` : `\\varepsilon_${i + 1}\\varepsilon_${j + 1}`, { inline: true });
  const terms5 = [0, 1, 2, 3, 4].map((i) => [0, 1, 2, 3, 4].map((j) => term(i, j)));
  const fSig = T(String.raw`\sigma^2`, { inline: true });
  const fZero = T(String.raw`0`, { inline: true });
  const fTwo = T(String.raw`E\big[(\varepsilon_1+\varepsilon_2)^2\big]=\class{s}{\sigma^2}+\class{z}{0}+\class{z}{0}+\class{s}{\sigma^2}=2\class{s}{\sigma^2}`);
  const fNs = T(String.raw`E\big[(\varepsilon_1+\cdots+\varepsilon_n)^2\big]=n\class{s}{\sigma^2}`);
  const G2 = { x: 1070, y: 350, n: 2, cell: 190 };
  const G5 = { x: 760, y: 300, n: 5, cell: 104 };
  // simulation of (ε1, ε2)
  const NG = 230;
  const drawPairs = (seed) => { const gq = normalSampler(seed); return Array.from({ length: NG }, () => [gq(), gq()]); };
  const pairs = drawPairs(bestSeed((sd) => {
    const x = drawPairs(sd);
    let a2 = 0, b2 = 0, d2 = 0;
    for (const [u, v] of x) { a2 += u * u; b2 += u * v; d2 += v * v; }
    return Math.abs(a2 / NG - 1) + Math.abs(d2 / NG - 1) + 3 * Math.abs(b2 / NG);
  }));
  const gT = [];
  {
    const t0 = e.avg + 0.5, slowN = 5, sl = 0.7, tf = e.two - 0.5;
    for (let k = 0; k < slowN; k++) gT.push(t0 + k * sl);
    for (let k = slowN; k < NG; k++) gT.push(t0 + slowN * sl + (tf - t0 - slowN * sl) * Math.pow((k - slowN) / (NG - slowN), 0.75));
  }
  const run = { a: [], b: [], d: [] };
  {
    let sa = 0, sb = 0, sd = 0;
    pairs.forEach(([u, v], k) => {
      sa += u * u; sb += u * v; sd += v * v;
      run.a[k] = sa / (k + 1); run.b[k] = sb / (k + 1); run.d[k] = sd / (k + 1);
    });
  }
  // fixed-ε1 demonstration
  const drawE2 = (seed) => { const gq = normalSampler(seed); return Array.from({ length: 48 }, () => gq()); };
  const e2s = drawE2(bestSeed((sd) => { const x = drawE2(sd); const m = x.reduce((p, q) => p + q, 0) / 48; const v = x.reduce((p, q) => p + q * q, 0) / 48; return 3 * Math.abs(m) + Math.abs(v - 1); }));
  const fixA = 1.3, fixB = -0.7;
  const fE1lab = T(String.raw`\varepsilon_1`, { inline: true });
  const fE2lab = T(String.raw`\varepsilon_2`, { inline: true });
  const fP13 = T(String.raw`1.3\,\varepsilon_2`, { inline: true }), fP07 = T(String.raw`-0.7\,\varepsilon_2`, { inline: true });
  const axF1 = new Axis({ x0: 260, x1: 780, y: 545, v0: -4, v1: 4 });
  const axF2 = new Axis({ x0: 260, x1: 780, y: 705, v0: -4, v1: 4 });
  const axF3 = new Axis({ x0: 260, x1: 780, y: 865, v0: -4, v1: 4 });

  layers.push({
    t0: e.start - 0.5,
    t1: f.end + 1.0,
    draw(ctx, t) {
      const A5 = prog(t, e.start - 0.3, 0.6) * (1 - prog(t, f.end - 0.4, 0.8, ease.inOut));
      if (A5 <= 0) return;
      // ---------------- the expansion ----------------
      const expA = A5 * (1 - prog(t, e.two - 0.6, 0.6)) ;
      const wl = prog(t, e.start, 1.0, ease.linear), wr = prog(t, e.expand + 0.2, 1.6, ease.linear);
      const fly = (k) => prog(t, e.grid + 0.6 + k * 0.18, 0.9, ease.inOut);
      const hideTerm = { a: fly(0) > 0 ? 0 : 1, b: fly(1) > 0 ? 0 : 1, c: fly(2) > 0 ? 0 : 1, d: fly(3) > 0 ? 0 : 1 };
      const EX = { x: 640, y: 200, size: 50 };
      drawTex(ctx, fExp, EX.x, EX.y, EX.size, { alpha: expA, writes: { lhs: wl, rhs: wr }, alphas: { a: 0.35 + 0.65 * hideTerm.a, b: 0.35 + 0.65 * hideTerm.b, c: 0.35 + 0.65 * hideTerm.c, d: 0.35 + 0.65 * hideTerm.d } });

      // ---------------- the grid: 2×2 growing into 5×5 ----------------
      const clear2 = prog(t, f.start - 0.1, 0.45); // numbers of the 2×2 phase leave first
      const gp = prog(t, f.start + 0.35, 1.3, ease.inOut); // 0: 2×2, 1: 5×5
      const gl = prog(t, e.grid, 0.8, ease.inOut);
      if (gl <= 0) return;
      const G = { x: lerp(G2.x, G5.x, gp), y: lerp(G2.y, G5.y, gp), cell: lerp(G2.cell, G5.cell, gp), n: 2 };
      const simOn = t > e.avg + 0.3 && clear2 < 1;
      const k = gT.findLastIndex((x) => x <= t);
      const cur = k >= 0 ? pairs[k] : [0, 0];
      const diagHi = prog(t, e.diag, 0.6), offHi = prog(t, e.off, 0.6);
      // 5×5 extra cells fade in, diagonal first
      const n5 = gp > 0 ? 5 : 2;
      const cellFill = (i, j) => {
        if (i < 2 && j < 2) {
          if (i === j) return [C.sigma, 0.1 * diagHi + (simOn ? 0.12 * clamp((i === 0 ? cur[0] * cur[0] : cur[1] * cur[1]) / 3) : 0)];
          if (simOn && k >= 0) {
            const v = cur[0] * cur[1];
            return [v >= 0 ? C.pos : C.neg, 0.06 + 0.16 * clamp(Math.abs(v) / 2)];
          }
          return ['#7E9CC4', 0.07 * offHi];
        }
        return null;
      };
      const GG = { ...G, n: 2 };
      drawGrid(ctx, GG, { alpha: A5, lines: gl, fill: cellFill });
      if (gp > 0) {
        // the rest of the 5×5 grid
        const G5now = { x: G.x, y: G.y, cell: G.cell, n: 5 };
        const pd = prog(t, f.diag, 0.7), pr = prog(t, f.rest, 0.7), pz = prog(t, f.rest + 1.4, 0.7);
        const fill5 = (i, j) => {
          if (i < 2 && j < 2 && gp < 1) return null;
          if (i === j) return [C.sigma, 0.14 * pd];
          return [pr > 0 && pz < 1 ? (((i * 7 + j * 3 + Math.floor(t * 12)) % 2) ? C.pos : C.neg) : '#7E9CC4', pr > 0 && pz < 1 ? 0.12 : 0.05 * pz];
        };
        drawGrid(ctx, G5now, { alpha: A5 * gp, fill: fill5 });
      }
      // headers
      const nh = gp > 0.5 ? 5 : 2;
      for (let i = 0; i < 5; i++) {
        const ha = i < 2 ? A5 * gl : A5 * prog(t, f.start + 0.6 + i * 0.12, 0.6);
        if (ha <= 0) continue;
        drawTex(ctx, epsT5[i], G.x - 34, G.y + (i + 0.5) * G.cell, lerp(40, 32, gp), { color: C.err, alpha: ha, align: 'r' });
        drawTex(ctx, epsT5[i], G.x + (i + 0.5) * G.cell, G.y - 30, lerp(40, 32, gp), { color: C.err, alpha: ha });
      }
      // terms in cells
      const sz = lerp(46, 30, gp);
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 5; j++) {
          const [cx, cy] = cellCenter({ ...G }, i, j);
          let ta;
          if (i < 2 && j < 2) {
            const idx = i * 2 + j;
            const pf = fly(idx);
            if (pf <= 0) continue;
            if (pf < 1) {
              // flying from the expansion into its cell
              const src = fExp.box(EX.x, EX.y, EX.size, 'c', 'm', 'abcd'[idx]);
              const x = lerp(src.cx, cx, pf), y = lerp(src.cy, cy, pf) - Math.sin(Math.PI * pf) * 50;
              drawTex(ctx, terms5[i][j], x, y, lerp(EX.size, sz, pf), { alpha: A5 });
              continue;
            }
            ta = A5;
          } else {
            ta = A5 * prog(t, f.start + 1.4 + (Math.abs(i - j) + Math.min(i, j)) * 0.08, 0.5);
          }
          if (ta <= 0) continue;
          // in the 5×5 phase the diagonal turns into σ², the rest into 0
          const toS = i === j ? prog(t, f.diag + 0.3 + i * 0.15, 0.6) : 0;
          const toZ = i !== j ? prog(t, f.rest + 1.4 + ((i + j) % 5) * 0.06, 0.6) : 0;
          const ty = cy - 40 * (simOn ? 1 - clear2 : 0) * prog(t, e.avg + 0.3, 0.5);
          const tc = i === j && diagHi > 0 ? mixColor(C.text, C.sigma, diagHi) : C.text;
          drawTex(ctx, terms5[i][j], cx, ty, sz, { alpha: ta * (1 - toS) * (1 - toZ), color: tc });
          if (toS > 0) drawTex(ctx, fSig, cx, cy, sz * 1.05, { alpha: ta * toS, color: C.sigma });
          if (toZ > 0) drawTex(ctx, fZero, cx, cy, sz, { alpha: ta * toZ * 0.7, color: C.dim });
          // flicker of random products before they settle to 0
          if (i !== j && gp >= 1) {
            const fl = win(t, f.rest + 0.1, f.rest + 1.4, 0.2, 0.3);
            if (fl > 0) {
              const r = Math.sin((i * 13.1 + j * 7.7) * 3.3 + Math.floor(t * 14) * 1.91) * 1.8;
              num(ctx, fmt(r, 1), cx, cy + 30, 22, { color: r >= 0 ? C.pos : C.neg, alpha: ta * fl });
            }
          }
          // current products and running averages (2×2 phase)
          if (simOn && i < 2 && j < 2 && k >= 0) {
            const v = i === j ? (i === 0 ? cur[0] * cur[0] : cur[1] * cur[1]) : cur[0] * cur[1];
            const col = i === j ? C.sigma : v >= 0 ? C.pos : C.neg;
            const sa = A5 * prog(t, e.avg + 0.3, 0.5) * (1 - clear2);
            num(ctx, fmt(v, 2), cx, cy + 10, 30, { color: col, alpha: sa });
            const avg = i === j ? (i === 0 ? run.a[k] : run.d[k]) : run.b[k];
            labelNum(ctx, '平均', fmt(avg, 2), cx, cy + 60, { size: 22, color: i === j ? C.sigma : C.soft, alpha: sa });
          }
        }
      // labels next to the 2×2 grid once the averages are clear
      const lab = A5 * (1 - clear2);
      if (lab > 0) {
        const pS = prog(t, e.diagS + 0.4, 0.6);
        rich(ctx, ['平均 ', fSig], G.x + 2 * G.cell + 30, G.y + 0.5 * G.cell - 34, { size: 26, color: C.sigma, alpha: lab * pS, align: 'left' });
        rich(ctx, ['平均 ', fSig], G.x + 2 * G.cell + 30, G.y + 1.5 * G.cell + 34, { size: 26, color: C.sigma, alpha: lab * pS, align: 'left' });
        const pZ = prog(t, e.mult + 1.2, 0.6);
        text(ctx, '平均 0', G.x + 2 * G.cell + 30, G.y + 0.5 * G.cell + 34, { size: 26, color: C.soft, alpha: lab * pZ, align: 'left' });
        text(ctx, '平均 0', G.x + 2 * G.cell + 30, G.y + 1.5 * G.cell - 34, { size: 26, color: C.soft, alpha: lab * pZ, align: 'left' });
      }
      // n rows, n columns
      const pn = prog(t, f.nxn + 0.3, 0.8) * gp;
      if (pn > 0) {
        const x0 = G.x, y0 = G.y, L = 5 * G.cell;
        brace(ctx, x0 - 82, y0 + L, x0 - 82, y0, { side: 1, depth: 18, color: C.soft, alpha: A5 * pn });
        rich(ctx, LB.nRow, x0 - 150, y0 + L / 2, { size: 30, color: C.soft, alpha: A5 * pn });
        brace(ctx, x0, y0 - 74, x0 + L, y0 - 74, { side: 1, depth: 18, color: C.soft, alpha: A5 * pn });
        rich(ctx, LB.nCol, x0 + L / 2, y0 - 128, { size: 30, color: C.soft, alpha: A5 * pn });
        rich(ctx, LB.n5, x0 + L + 30, y0 + L - 10, { size: 22, color: C.dim, alpha: A5 * pn, align: 'left' });
      }
      // results
      const p2 = prog(t, e.two, 1.3, ease.linear) * (1 - clear2);
      if (p2 > 0) drawTex(ctx, fTwo, 980, 860, 48, { alpha: A5 * clamp(p2 * 3) * (1 - prog(t, e.end - 0.3, 0.5)), write: p2, colors: { s: C.sigma, z: C.soft } });
      const pnS = prog(t, f.sum, 1.2, ease.linear);
      if (pnS > 0) drawTex(ctx, fNs, 1020, 900, 48, { alpha: A5 * clamp(pnS * 3), write: pnS, colors: { s: C.sigma } });

      // ---------------- side panel: fix ε1, look at ε2 and ε1ε2 ----------------
      const sp = win(t, e.fix - 0.3, e.two - 0.4, 0.6, 0.6) * A5;
      if (sp > 0) {
        panel(ctx, 110, 318, 720, 610, { alpha: sp });
        rich(ctx, ['固定第一批的误差 ', fE1lab, '，看乘积的平均'], 470, 372, { size: 28, alpha: sp, color: C.text });
        const st0 = stackDots(e2s, 0.25);
        const rowsF = [
          { ax: axF1, lab: fE2lab, mult: 1, t0: e.zero2 - 0.2, col: C.err },
          { ax: axF2, lab: fP13, mult: fixA, t0: e.mult - 0.1 },
          { ax: axF3, lab: fP07, mult: fixB, t0: e.mult + 1.3 },
        ];
        rowsF.forEach((r, ri) => {
          const pr = prog(t, r.t0, 0.5);
          if (pr <= 0) return;
          r.ax.draw(ctx, { alpha: sp * pr, ticks: [-4, -2, 0, 2, 4], labels: ['−4', '−2', '0', '2', '4'], arrow: false, labelSize: 22, labelGap: 28 });
          drawTex(ctx, r.lab, r.ax.x0 - 26, r.ax.y, 30, { color: ri === 0 ? C.err : C.text, alpha: sp * pr, align: 'r' });
          const st = ri === 0 ? st0 : stackDots(e2s.map((v) => v * r.mult), 0.25);
          e2s.forEach((v, q) => {
            const pq = prog(t, r.t0 + 0.1 + q * 0.025, 0.5, ease.inOut);
            if (pq <= 0) return;
            const d = st[q];
            const to = [r.ax.X(d.x), r.ax.y - 8 - d.k * 13];
            let from;
            if (ri === 0) from = [to[0], to[1] - 60];
            else { const d0 = st0[q]; from = [axF1.X(d0.x), axF1.y - 8 - d0.k * 13]; }
            const val = v * r.mult;
            dot(ctx, lerp(from[0], to[0], pq), lerp(from[1], to[1], pq), 5.5, { color: ri === 0 ? C.err : val >= 0 ? C.pos : C.neg, alpha: sp * 0.9 * clamp(pq * 3) });
          });
          const pm = prog(t, r.t0 + 1.0, 0.5);
          line(ctx, r.ax.X(0), r.ax.y + 8, r.ax.X(0), r.ax.y - 96, { color: C.text, width: 2, dash: [5, 5], alpha: sp * pm });
          text(ctx, ri === 0 ? '平均 0' : '平均还是 0', r.ax.X(0) + 12, r.ax.y - 100, { size: 22, color: C.text, alpha: sp * pm, align: 'left' });
        });
      }
    },
  });

  // =====================================================================
  // 2G  divide by n², take the square root: σ/√n
  // =====================================================================
  const gg = {
    start: f.end,
    var: A('样本均值的方差就是'),
    sd: A('方差开平方叫作标准差'),
    unit: A('它和数据的单位相同'),
    sdx: A('所以样本均值的标准差是'),
    five: A('五批数据，就是'),
    more: A('数据越多，样本均值越稳定'),
    sqrt: A('不过波动是按根号 n 缩小的'),
    four: A('数据要增加到原来的四倍'),
    end: S.g1,
  };
  const fG1 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}=\frac{1}{n^2}\,\class{q}{E\big[(\varepsilon_1+\cdots+\varepsilon_n)^2\big]}`);
  const fG2 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}=\frac{1}{n^2}\cdot\class{q}{n\class{s}{\sigma^2}}`);
  const fG3 = T(String.raw`\class{v}{E\big[(\bar{x}-\mu)^2\big]}=\frac{\class{s}{\sigma^2}}{n}`);
  const fSD = T(String.raw`\sqrt{\frac{\class{s}{\sigma^2}}{n}}=\frac{\class{s}{\sigma}}{\class{r}{\sqrt{n}}}`);
  const fSD5 = T(String.raw`\sqrt{\frac{\class{s}{\sigma^2}}{n}}=\frac{\class{s}{\sigma}}{\class{r}{\sqrt{n}}}\;\xrightarrow{\;n\,=\,5\;}\;\frac{\class{s}{\sigma}}{\sqrt{5}}`);
  const fSigLab = T(String.raw`\pm\sigma`, { inline: true }), fSig5Lab = T(String.raw`\pm\frac{\sigma}{\sqrt{5}}`, { inline: true });
  const fN5b = T(String.raw`n = 5`, { inline: true }), fN20 = T(String.raw`n = 20`, { inline: true });
  const fTimes4 = T(String.raw`n\times 4`, { inline: true }), fHalf = T(String.raw`\frac{\sigma}{\sqrt{4n}}=\frac{1}{2}\cdot\frac{\sigma}{\sqrt{n}}`);
  const axC = new Axis({ x0: 420, x1: 1500, y: 840, v0: -1.6, v1: 1.6 });

  layers.push({
    t0: gg.start - 0.5,
    t1: gg.end + 2.3,
    draw(ctx, t) {
      const A7 = prog(t, gg.start - 0.2, 0.6) * (1 - prog(t, gg.end + 1.2, 0.9, ease.inOut));
      if (A7 <= 0) return;
      // the variance of the mean
      const up = prog(t, gg.sd - 0.3, 0.9, ease.inOut);
      const Y = lerp(420, 170, up), SZ = lerp(60, 46, up);
      const m1 = prog(t, gg.start + 0.1, 1.0, ease.inOut), m2 = prog(t, gg.var + 0.2, 1.0, ease.inOut);
      const P = { x: 960, y: Y, size: SZ };
      const cols = { v: C.xbar, s: C.sigma };
      if (m2 <= 0) drawTexMorph(ctx, fG1, P, fG2, P, m1, { alpha: A7, colorsA: cols, colorsB: cols });
      else drawTexMorph(ctx, fG2, P, fG3, P, m2, { alpha: A7, colorsA: cols, colorsB: cols });
      if (m2 >= 1) {
        const b = fG3.box(960, Y, SZ, 'c', 'm', 'v');
        const pl = prog(t, gg.var + 1.0, 0.5) * (1 - up);
        if (pl > 0) text(ctx, '样本均值的方差', b.cx, b.y1 + 44, { size: 28, color: C.xbar, alpha: A7 * pl });
      }
      // standard deviation
      const ps = prog(t, gg.sd, 0.6) * (1 - prog(t, gg.more - 0.3, 0.6));
      if (ps > 0) {
        text(ctx, '标准差 = 方差开平方', 960, 300, { size: 30, color: C.text, alpha: A7 * ps });
        const pu = prog(t, gg.unit, 0.6);
        text(ctx, '方差的单位：百分点²　　标准差的单位：百分点（和数据相同）', 960, 352, { size: 24, color: C.dim, alpha: A7 * ps * pu });
      }
      const pX = prog(t, gg.sdx, 1.2, ease.linear);
      const p5 = prog(t, gg.five, 1.0, ease.inOut);
      if (pX > 0) {
        const yS = lerp(470, 470, 0);
        const fade = 1 - prog(t, gg.more - 0.3, 0.6);
        const hiR = win(t, gg.sqrt, gg.four - 0.2, 0.4, 0.5);
        const scl = { r: 1 + 0.12 * hiR };
        if (p5 <= 0) {
          rich(ctx, ['样本均值的标准差 '], 520, yS, { size: 30, color: C.xbar, alpha: A7 * clamp(pX * 3) * fade, align: 'right' });
          drawTex(ctx, fSD, 560, yS, 54, { align: 'l', alpha: A7 * fade, write: pX, colors: { s: C.sigma, r: hiR > 0 ? C.hi : C.text } });
        } else {
          rich(ctx, ['样本均值的标准差 '], 520, yS, { size: 30, color: C.xbar, alpha: A7 * fade, align: 'right' });
          drawTexMorph(ctx, fSD, { x: 560, y: yS, size: 54, align: 'l' }, fSD5, { x: 560, y: yS, size: 54, align: 'l' }, p5, { alpha: A7 * fade, colorsA: { s: C.sigma }, colorsB: { s: C.sigma } });
        }
      }
      // back to the simulation: spread of single values vs. means, now with names
      const pp = win(t, gg.five + 0.6, gg.more - 0.3, 0.8, 0.6) * A7;
      if (pp > 0) {
        ctx.save();
        ctx.translate(W / 2, 790);
        ctx.scale(0.46, 0.46);
        ctx.translate(-W / 2, -650);
        b.draw(ctx, 1e9, pp, Infinity, 0.9);
        axT.draw(ctx, { alpha: pp, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3', '−2', '−1', '0', '1', '2', '3'], labelSize: 40 });
        axB.draw(ctx, { alpha: pp, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3', '−2', '−1', '0', '1', '2', '3'], labelSize: 40 });
        span(ctx, axT.X(-1), axT.X(1), axT.y + 90, { color: C.data, alpha: pp, width: 4, tick: 16 });
        drawTex(ctx, fSigLab, axT.X(1) + 40, axT.y + 90, 60, { align: 'l', color: C.data, alpha: pp });
        const w5 = 1 / Math.sqrt(5);
        span(ctx, axB.X(-w5), axB.X(w5), axB.y + 90, { color: C.xbar, alpha: pp, width: 4, tick: 16 });
        drawTex(ctx, fSig5Lab, axB.X(w5) + 40, axB.y + 96, 60, { align: 'l', color: C.xbar, alpha: pp });
        text(ctx, '单个数据', 272, axT.y, { size: 48, color: C.data, alpha: pp, align: 'right' });
        text(ctx, '样本均值', 272, axB.y, { size: 48, color: C.xbar, alpha: pp, align: 'right' });
        ctx.restore();
      }
      // more data: n = 5 vs n = 20
      const pc = prog(t, gg.more, 0.8) * A7;
      if (pc > 0) {
        const ax = axC;
        ax.draw(ctx, { alpha: pc, ticks: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5], labels: ['−1.5', '−1', '−0.5', '0', '0.5', '1', '1.5'] });
        const sc = 150;
        const curve = (sd) => { const pts = []; for (let v = ax.v0; v <= ax.v1 + 1e-9; v += 0.01) pts.push([ax.X(v), ax.y - normPdf(v, 0, sd) * sc]); return pts; };
        const c5 = curve(1 / Math.sqrt(5)), c20 = curve(1 / Math.sqrt(20));
        poly(ctx, c5, { color: C.xbar, width: 3, alpha: pc, progress: prog(t, gg.more + 0.1, 1.2, ease.inOut) });
        drawTex(ctx, fN5b, ax.X(0.62), ax.y - 130, 34, { color: C.xbar, alpha: pc * prog(t, gg.more + 0.8, 0.5), align: 'l' });
        const p20 = prog(t, gg.more + 0.9, 1.2, ease.inOut);
        poly(ctx, c20, { color: '#9FD3FF', width: 3, alpha: pc * clamp(p20 * 2), progress: p20 });
        drawTex(ctx, fN20, ax.X(0.3), ax.y - 300, 34, { color: '#9FD3FF', alpha: pc * prog(t, gg.more + 1.6, 0.5), align: 'l' });
        // four times the data, half the spread
        const pf = prog(t, gg.four, 0.8) * pc;
        if (pf > 0) {
          const w5 = 1 / Math.sqrt(5), w20 = 1 / Math.sqrt(20);
          span(ctx, ax.X(-w5), ax.X(w5), ax.y + 76, { color: C.xbar, alpha: pf, progress: pf });
          span(ctx, ax.X(-w20), ax.X(w20), ax.y + 112, { color: '#9FD3FF', alpha: pf, progress: pf });
          drawTex(ctx, fN5b, ax.X(w5) + 20, ax.y + 76, 26, { color: C.xbar, alpha: pf, align: 'l' });
          drawTex(ctx, fN20, ax.X(w20) + 20, ax.y + 112, 26, { color: '#9FD3FF', alpha: pf, align: 'l' });
          drawTex(ctx, fTimes4, 1340, 580, 40, { alpha: pf * prog(t, gg.four + 0.3, 0.5), align: 'l' });
          text(ctx, '波动减半', 1340, 640, { size: 30, color: C.text, alpha: pf * prog(t, gg.four + 1.2, 0.5), align: 'left' });
        }
      }
    },
  });

  return { layers, piles: b };
}
