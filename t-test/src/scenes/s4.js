// 四、用数据估计方差：为什么除以 n − 1
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, labelNum, line, arrow, dot, Axis, Plot, span, brace, braceTip, roundRect, rich, poly, fillPoly, panel, mixed } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, fmt, keys, mixColor } from '../engine/util.js';
import { DATA, MEAN, stackDots, histBars, binCounts, bestSeed } from './common.js';

const T = (s, o) => tex(s, o);
const SS = (c) => DATA.reduce((p, x) => p + (x - c) ** 2, 0); // Σ(x − c)²
const MU = 0.6; // where the (unknown) true mean is drawn

// squares from each observation to a reference point c, standing on the axis
function squares(ctx, ax, c, o) {
  const a = o.alpha;
  if (a <= 0.002) return;
  DATA.forEach((x, i) => {
    const g = o.grow === undefined ? 1 : clamp(o.grow * 1.8 - i * 0.18);
    if (g <= 0) return;
    const d = (x - c) * g;
    const side = Math.abs(d) * ax.unit;
    const x0 = Math.min(ax.X(c), ax.X(c + d));
    ctx.save();
    ctx.fillStyle = rgba(o.color, a * 0.1);
    ctx.fillRect(x0, ax.y - side, side, side);
    ctx.strokeStyle = rgba(o.color, a * 0.85);
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, ax.y - side, side, side);
    ctx.restore();
  });
}

export function build4(N) {
  const S = N.chapter(4);
  const { A } = S;
  const layers = [];
  const LB = {
    est: mixed('估计 $\\sigma^2$'),
    anyc: mixed('到任意一点 $c$ 的距离平方和'),
    nq: mixed('$n$ ×（样本均值与 $c$ 的距离）²'),
    nterm: mixed('$n$ 项，每项平均 '),
  };
  const ax = new Axis({ x0: 140, x1: 888, y: 790, v0: -1, v1: 3.4 });
  const PL = new Plot({ x: 1100, y: 300, w: 680, h: 460, xr: [-0.3, 2.5], yr: [0, 15] });

  // =====================================================================
  // 4A  squares to μ; their average estimates σ² without bias
  // 4B  μ is unknown: measure to x̄ instead (deviations)
  // 4C  move the reference point c: the sum is smallest at x̄
  // =====================================================================
  const a = {
    start: S.first,
    sq: A('每个数据到缪的距离的平方'),
    area: A('就是以这段距离为边长的正方形的面积'),
    know: A('如果知道缪'),
    avg: A('就可以用这五个正方形面积的平均来估计'),
    rep: A('重复抽样很多次，这个估计平均正好等于'),
    nobias: A('也就是说，它没有系统偏差'),
    unk: A('可惜缪是未知的'),
    toX: A('只好改为量每个数据到样本均值的距离'),
    dev: A('数据到样本均值的差，叫作偏差'),
    move: A('让参照点 c 在数轴上移动'),
    sum: A('五个正方形的面积之和随之变化'),
    at11: A('c 在 1.1'),
    v478: A('是 4.78'),
    far: A('离 1.1 越远，面积之和越大'),
    where: A('真实的缪在哪里，我们不知道'),
    unless: A('但只要它不恰好等于样本均值'),
    bigger: A('数据到缪的距离平方和就一定更大'),
    small: A('所以，用样本均值作参照，量出来的离散程度只会偏小'),
    end: A('这个规律对任何数据都成立'),
  };
  const fMu = T(String.raw`\mu`, { inline: true });
  const fXb = T(String.raw`\bar{x}`, { inline: true });
  const fC = T('c', { inline: true });
  const fEst = T(String.raw`\frac{1}{5}\sum_{i=1}^{5}(x_i-\mu)^2=\frac{6.03}{5}=1.21`);
  const fDev = T(String.raw`x_i-\bar{x}`, { inline: true });
  const fSc = T(String.raw`\sum_{i=1}^{5}(x_i-c)^2`, { inline: true });
  const fSig2 = T(String.raw`\sigma^2`, { inline: true });
  // simulation: the estimate (1/n)Σ(x − μ)² over many samples, σ = 1
  const NS = 260;
  const drawEst = (seed) => { const g = normalSampler(seed); return Array.from({ length: NS }, () => { let s = 0; for (let k = 0; k < 5; k++) { const e = g(); s += e * e; } return s / 5; }); };
  const est = drawEst(bestSeed((sd) => { const x = drawEst(sd); return Math.abs(x.reduce((p, q) => p + q, 0) / NS - 1); }, 1, 300));
  const runEst = [];
  est.reduce((s, v, k) => ((runEst[k] = (s + v) / (k + 1)), s + v), 0);
  const estT = est.map((_, k) => a.rep + 0.4 + 5.2 * Math.pow(k / NS, 0.6));
  const axS = new Axis({ x0: 1120, x1: 1760, y: 720, v0: 0, v1: 3 });
  const maxEst = Math.max(...binCounts(est, NS, 0, 0.15, 20));
  // path of the reference point c over time
  const stops = [[0, 10.83], [0.5, 6.58], [1.1, 4.78], [1.5, 5.58], [2, 8.83]];
  const cPath = [
    [a.toX - 0.1, MU], [a.toX + 1.1, MEAN], // from μ to x̄
    [a.move + 0.3, MEAN], [a.move + 1.5, 0], // to 0
    [a.sum + 0.9, 0], [a.sum + 1.7, 0.5],
    [a.sum + 2.4, 0.5], [a.at11 - 0.1, MEAN],
    [a.far - 0.1, MEAN], [a.far + 0.9, 1.5],
    [a.far + 1.6, 1.5], [a.far + 2.6, 2.0],
    [a.where - 0.2, 2.0], [a.where + 1.0, MEAN],
  ];
  const cAt = (t) => keys(t, cPath);
  // when each stop's value gets marked on the plot
  const markT = [a.move + 1.5, a.sum + 1.7, a.at11 - 0.1, a.far + 0.9, a.far + 2.6];

  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.4, 0.8) * (1 - prog(t, a.end - 0.3, 0.8, ease.inOut));
      if (A1 <= 0) return;
      // the left view starts centred and slides over when the right side is needed
      const slide = 1 - prog(t, a.avg - 0.8, 1.0, ease.inOut);
      ctx.save();
      ctx.translate(446 * slide, 0);
      ax.draw(ctx, { alpha: A1, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
      // the true mean μ (known at first, then unknown)
      const unk = prog(t, a.unk, 0.8);
      const muBack = win(t, a.where, a.end, 0.6, 0.6);
      const muA = A1 * (1 - unk * 0.85) + A1 * muBack * 0.85 * unk;
      line(ctx, ax.X(MU), ax.y + 12, ax.X(MU), ax.y - 520, { color: C.mu, width: 2.5, alpha: muA, dash: unk > 0.5 ? [8, 8] : null });
      drawTex(ctx, fMu, ax.X(MU), ax.y - 546, 38, { color: C.mu, alpha: muA });
      if (unk > 0) text(ctx, '？', ax.X(MU) + 30, ax.y - 546, { size: 34, color: C.mu, alpha: muA * unk });
      // reference point for the squares: μ, then x̄ / c
      const c = t < a.toX - 0.1 ? MU : cAt(t);
      const toBlue = prog(t, a.toX - 0.1, 1.0);
      const sqCol = mixColor(C.err, C.dev, toBlue);
      squares(ctx, ax, c, { alpha: A1, color: sqCol, grow: prog(t, a.area - 0.3, 1.6, ease.inOut) });
      // distances along the axis while "距离的平方" is said
      const pd = win(t, a.sq, a.area + 1.2, 0.5, 0.6);
      if (pd > 0) DATA.forEach((x) => line(ctx, ax.X(MU), ax.y - 3, ax.X(x), ax.y - 3, { color: C.err, width: 5, alpha: A1 * pd * 0.8 }));
      // the data
      DATA.forEach((x) => {
        dot(ctx, ax.X(x), ax.y, 8, { color: C.data, alpha: A1, glow: 0.5 });
        num(ctx, fmt(x, 1), ax.X(x), ax.y + 64, 22, { color: C.data, alpha: A1 * 0.0 });
      });
      // x̄ and the moving point c
      const pX = prog(t, a.unk + 0.6, 0.8);
      if (pX > 0) {
        line(ctx, ax.X(MEAN), ax.y + 12, ax.X(MEAN), ax.y - 520, { color: C.xbar, width: 2.5, alpha: A1 * pX });
        drawTex(ctx, fXb, ax.X(MEAN), ax.y - 546, 38, { color: C.xbar, alpha: A1 * pX });
      }
      const pc = prog(t, a.move - 0.1, 0.6);
      if (pc > 0) {
        const xc = ax.X(c);
        // a handle below the axis
        ctx.save();
        ctx.fillStyle = rgba(C.hi, A1 * pc);
        ctx.beginPath();
        ctx.moveTo(xc, ax.y + 6);
        ctx.lineTo(xc - 11, ax.y + 26);
        ctx.lineTo(xc + 11, ax.y + 26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        drawTex(ctx, fC, xc, ax.y + 52, 32, { color: C.hi, alpha: A1 * pc });
      }
      // deviation label on one square
      const pv = win(t, a.dev, a.move, 0.5, 0.5);
      if (pv > 0) {
        const x = 2.5, side = (x - MEAN) * ax.unit;
        span(ctx, ax.X(MEAN), ax.X(x), ax.y + 30, { color: C.dev, alpha: A1 * pv });
        rich(ctx, ['偏差 ', fDev], (ax.X(MEAN) + ax.X(x)) / 2, ax.y + 62, { size: 26, color: C.dev, alpha: A1 * pv });
      }

      ctx.restore();
      // ---------- right side: the estimate with μ known ----------
      const pe = prog(t, a.avg, 1.6, ease.linear) * (1 - prog(t, a.rep - 0.3, 0.5));
      if (pe > 0) {
        drawTex(ctx, fEst, 1440, 300, 46, { alpha: A1 * clamp(pe * 3), write: pe });
        rich(ctx, LB.est, 1440, 390, { size: 28, color: C.sigma, alpha: A1 * prog(t, a.avg + 1.6, 0.5) * (1 - prog(t, a.rep - 0.3, 0.5)) });
      }
      const ps = prog(t, a.rep, 0.6) * (1 - prog(t, a.unk - 0.2, 0.6));
      if (ps > 0) {
        const k = estT.findLastIndex((x) => x <= t);
        axS.draw(ctx, { alpha: A1 * ps, ticks: [0, 1, 2, 3], labels: ['0', '1', '2', '3'] });
        text(ctx, '每次抽样得到的估计值', 1440, 330, { size: 26, color: C.soft, alpha: A1 * ps });
        histBars(ctx, axS, binCounts(est, k + 1, 0, 0.15, 20), 0, 0.15, maxEst, 260, C.err, A1 * ps);
        line(ctx, axS.X(1), axS.y + 10, axS.X(1), axS.y - 300, { color: C.sigma, width: 2, dash: [6, 6], alpha: A1 * ps });
        rich(ctx, ['真实的 ', fSig2], axS.X(1) + 12, axS.y - 316, { size: 24, color: C.sigma, alpha: A1 * ps, align: 'left' });
        if (k >= 0) {
          const m = runEst[k];
          dot(ctx, axS.X(m), axS.y + 58, 7, { color: C.err, alpha: A1 * ps });
          labelNum(ctx, '平均', fmt(m, 2), axS.X(m), axS.y + 90, { size: 24, color: C.err, alpha: A1 * ps });
        }
        const pb = prog(t, a.nobias, 0.6);
        text(ctx, '没有系统偏差', axS.X(1.9), axS.y - 200, { size: 30, color: C.text, alpha: A1 * ps * pb, align: 'left' });
      }

      // ---------- right side: the sum of the squares as a function of c ----------
      const pp = prog(t, a.move, 0.8);
      if (pp > 0) {
        const pa = A1 * pp;
        // axes
        line(ctx, PL.x, PL.Y(0), PL.x + PL.w, PL.Y(0), { color: C.axis, width: 2, alpha: pa });
        line(ctx, PL.X(-0.3), PL.Y(0), PL.X(-0.3), PL.y - 10, { color: C.axis, width: 2, alpha: pa });
        for (const v of [0, 0.5, 1, 1.5, 2]) {
          line(ctx, PL.X(v), PL.Y(0) - 5, PL.X(v), PL.Y(0) + 5, { color: C.axis, width: 2, alpha: pa });
          num(ctx, String(v), PL.X(v), PL.Y(0) + 28, 22, { color: C.dim, alpha: pa });
        }
        for (const v of [5, 10, 15]) {
          line(ctx, PL.X(-0.3) - 5, PL.Y(v), PL.X(-0.3) + 5, PL.Y(v), { color: C.axis, width: 2, alpha: pa });
          num(ctx, String(v), PL.X(-0.3) - 14, PL.Y(v), 22, { color: C.dim, alpha: pa, align: 'right' });
        }
        drawTex(ctx, fC, PL.x + PL.w + 24, PL.Y(0), 30, { color: C.hi, alpha: pa });
        rich(ctx, ['面积之和 ', fSc], PL.X(-0.3), PL.y - 40, { size: 26, color: C.dev, alpha: pa, align: 'left' });
        // traced curve so far and the marked stops
        const cNow = c;
        const traced = [];
        const tStart = a.move + 0.3;
        if (t > tStart) {
          // sample the path between tStart and t
          for (let tt = tStart; tt <= t; tt += 0.03) traced.push(cAt(tt));
        }
        // full parabola appears once all stops are marked
        const pFull = prog(t, a.far + 2.8, 1.0, ease.inOut);
        poly(ctx, PL.curve(SS, -0.3, 2.5, 160), { color: C.dev, width: 2, alpha: pa * 0.6 * pFull, dash: [6, 6] });
        stops.forEach(([cv, val], i) => {
          const pm = prog(t, markT[i], 0.4);
          if (pm <= 0) return;
          dot(ctx, PL.X(cv), PL.Y(val), 7, { color: cv === MEAN ? C.xbar : C.dev, alpha: pa * pm });
          num(ctx, val.toFixed(2), PL.X(cv), PL.Y(val) - 30, 24, { color: cv === MEAN ? C.xbar : C.text, alpha: pa * pm });
        });
        // current point
        dot(ctx, PL.X(cNow), PL.Y(SS(cNow)), 9, { color: C.hi, alpha: pa, glow: 0.6 });
        line(ctx, PL.X(cNow), PL.Y(0), PL.X(cNow), PL.Y(SS(cNow)), { color: C.hi, width: 1.5, dash: [4, 5], alpha: pa * 0.6 });
        // live value beside the moving point (hidden while it rests on a marked stop)
        const onStop = stops.some(([cv]) => Math.abs(cv - cNow) < 0.02);
        num(ctx, SS(cNow).toFixed(2), PL.X(cNow) + 26, PL.Y(SS(cNow)) + 4, 26, { color: C.hi, alpha: pa * (onStop ? 0 : 1) * (1 - prog(t, a.where - 0.3, 0.5)), align: 'left' });
        const pMin = win(t, a.v478 - 0.3, a.far, 0.4, 0.4);
        if (pMin > 0) text(ctx, '最小', PL.X(MEAN), PL.Y(4.78) + 34, { size: 26, color: C.xbar, alpha: pa * pMin });
        // μ on the plot: always higher than at x̄
        const pmu = prog(t, a.where + 0.2, 0.6);
        if (pmu > 0) {
          line(ctx, PL.X(MU), PL.Y(0), PL.X(MU), PL.Y(SS(MU)), { color: C.mu, width: 2, dash: [6, 6], alpha: pa * pmu });
          dot(ctx, PL.X(MU), PL.Y(SS(MU)), 8, { color: C.mu, alpha: pa * pmu });
          drawTex(ctx, fMu, PL.X(MU), PL.Y(0) + 56, 30, { color: C.mu, alpha: pa * pmu });
        }
        const pg = prog(t, a.bigger, 0.6);
        if (pg > 0) {
          // the gap between Σ(x − μ)² and Σ(x − x̄)²
          ctx.save();
          ctx.strokeStyle = rgba(C.mu, pa * pg);
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(PL.X(MU), PL.Y(4.78));
          ctx.lineTo(PL.X(MEAN), PL.Y(4.78));
          ctx.stroke();
          ctx.restore();
          arrow(ctx, PL.X(MU) - 26, PL.Y(4.78), PL.X(MU) - 26, PL.Y(SS(MU)), { color: C.mu, width: 2.5, head: 11, alpha: pa * pg, both: true });
          text(ctx, '更大', PL.X(MU) - 50, (PL.Y(4.78) + PL.Y(SS(MU))) / 2, { size: 24, color: C.mu, alpha: pa * pg, align: 'right' });
        }
        const pl = prog(t, a.small, 0.6);
        if (pl > 0) rich(ctx, ['以 ', fXb, ' 为参照：只会偏小，不会偏大'], 1440, 860, { size: 30, alpha: pa * pl });
      }
    },
  });


  // =====================================================================
  // 4D  the identity Σ(x−c)² = Σ(x−x̄)² + n(x̄−c)², step by step
  // =====================================================================
  const d = {
    start: a.end,
    split: A('把每个数据到 c 的距离拆成两段'),
    fromX: A('再从样本均值到 c'),
    sq: A('两边平方，再对所有数据求和'),
    mid: A('中间那一项里'),
    out: A('可以提出来，剩下的是所有偏差之和'),
    def: A('样本均值是所有数据之和除以 n'),
    zero: A('所以所有数据减去它以后，加起来正好是 0'),
    gone: A('这一项就消失了'),
    tells: A('剩下的式子告诉我们'),
    eqX: A('等于到样本均值的距离平方和'),
    plus: A('再加上 n 乘以样本均值与 c 之间距离的平方'),
    nonneg: A('后面这一项不会小于 0'),
    min: A('平方和最小'),
    ex: A('比如 c 取 1.5'),
    ex2: A('平方和就是 4.78 加上 5 乘以 0.4 的平方'),
    ex3: A('等于 5.58'),
    end: A('现在把 c 换成真实的缪'),
  };
  const L1 = T(String.raw`x_i-c=\class{p}{(x_i-\bar{x})}+\class{q}{(\bar{x}-c)}`);
  const L2 = T(String.raw`(x_i-c)^2=\class{p}{(x_i-\bar{x})^2}+\class{m}{2(x_i-\bar{x})(\bar{x}-c)}+\class{q}{(\bar{x}-c)^2}`);
  const L3a = T(String.raw`\sum_{i=1}^{n}(x_i-c)^2=\class{p}{\sum_{i=1}^{n}(x_i-\bar{x})^2}+\class{m}{\sum_{i=1}^{n}2(x_i-\bar{x})(\bar{x}-c)}+\class{q}{n(\bar{x}-c)^2}`);
  const L3 = T(String.raw`\sum_{i=1}^{n}(x_i-c)^2=\class{p}{\sum_{i=1}^{n}(x_i-\bar{x})^2}+\class{m}{2(\bar{x}-c)\class{z}{\sum_{i=1}^{n}(x_i-\bar{x})}}+\class{q}{n(\bar{x}-c)^2}`);
  const L4 = T(String.raw`\class{l}{\sum_{i=1}^{n}(x_i-c)^2}=\class{p}{\sum_{i=1}^{n}(x_i-\bar{x})^2}+\class{q}{n(\bar{x}-c)^2}`);
  const Zdef = T(String.raw`\bar{x}=\frac{x_1+\cdots+x_n}{n}\ \Rightarrow\ \sum_{i=1}^{n}x_i=n\bar{x}`);
  const Zsum = T(String.raw`\sum_{i=1}^{n}(x_i-\bar{x})=\sum_{i=1}^{n}x_i-n\bar{x}=0`);
  const fGe0 = T(String.raw`\geq 0`, { inline: true });
  const fEx = T(String.raw`5.58=4.78+5\times 0.4^2`);
  const f504 = T(String.raw`5\times 0.4^2=0.8`, { inline: true });
  const fXi = T('x_i', { inline: true });
  const axD = new Axis({ x0: 300, x1: 1300, y: 830, v0: -1, v1: 3 });
  const XI = 2.5, CC = 0.3; // the point and the reference used to show the split
  const devs = DATA.map((x) => x - MEAN);
  const fCcol = { p: C.dev, q: C.hi, m: C.text, z: C.text };

  layers.push({
    t0: d.start - 0.5,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A2 = prog(t, d.start - 0.2, 0.8) * (1 - prog(t, d.end - 0.3, 0.8, ease.inOut));
      if (A2 <= 0) return;
      // ---- number line with one point split at x̄ ----
      const lineA = A2 * (1 - prog(t, d.tells - 0.3, 0.6)) ;
      if (lineA > 0) {
        axD.draw(ctx, { alpha: lineA, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
        const showOne = 1 - prog(t, d.zero - 0.4, 0.5);
        const ps = prog(t, d.split + 0.2, 0.8);
        if (showOne > 0) {
          const y = axD.y - 70;
          dot(ctx, axD.X(XI), axD.y, 9, { color: C.data, alpha: lineA * showOne, glow: 0.6 });
          drawTex(ctx, fXi, axD.X(XI), axD.y + 46, 30, { color: C.data, alpha: lineA * showOne });
          line(ctx, axD.X(MEAN), axD.y + 10, axD.X(MEAN), axD.y - 130, { color: C.xbar, width: 2.5, alpha: lineA * showOne });
          drawTex(ctx, fXb, axD.X(MEAN), axD.y - 152, 32, { color: C.xbar, alpha: lineA * showOne });
          // c
          ctx.save();
          ctx.fillStyle = rgba(C.hi, lineA * showOne);
          ctx.beginPath();
          ctx.moveTo(axD.X(CC), axD.y + 6); ctx.lineTo(axD.X(CC) - 11, axD.y + 26); ctx.lineTo(axD.X(CC) + 11, axD.y + 26); ctx.closePath();
          ctx.fill();
          ctx.restore();
          drawTex(ctx, fC, axD.X(CC), axD.y + 52, 30, { color: C.hi, alpha: lineA * showOne });
          // whole distance, then its two pieces
          const p1 = prog(t, d.split + 1.2, 0.8), p2 = prog(t, d.fromX - 0.2, 0.8);
          arrow(ctx, axD.X(CC), y - 40, axD.X(XI), y - 40, { color: C.text, width: 3, alpha: lineA * showOne * ps, progress: ps });
          if (p1 > 0) arrow(ctx, axD.X(MEAN), y, axD.X(XI), y, { color: C.dev, width: 4, alpha: lineA * showOne, progress: p1 });
          if (p2 > 0) arrow(ctx, axD.X(CC), y, axD.X(MEAN), y, { color: C.hi, width: 4, alpha: lineA * showOne, progress: p2 });
        }
        // all deviations from x̄ add up to zero: head to tail they come back to x̄
        const pz = prog(t, d.zero - 0.2, 0.6);
        if (pz > 0) {
          const ch = prog(t, d.zero + 0.6, 1.6, ease.inOut);
          let acc = 0;
          DATA.forEach((x, i) => {
            const pk = prog(t, d.zero - 0.2 + i * 0.1, 0.4);
            dot(ctx, axD.X(x), axD.y, 8, { color: C.data, alpha: lineA * pk, glow: 0.5 });
            const y0 = axD.y - 40 - i * 22;
            const sx = lerp(axD.X(MEAN), axD.X(MEAN + acc), ch), ex = lerp(axD.X(x), axD.X(MEAN + acc + devs[i]), ch);
            if (Math.abs(devs[i]) > 0.01) arrow(ctx, sx, y0, ex, y0, { color: C.dev, width: 3, head: 12, alpha: lineA * pk });
            else dot(ctx, sx, y0, 5, { color: C.dev, alpha: lineA * pk });
            acc += devs[i];
          });
          line(ctx, axD.X(MEAN), axD.y + 10, axD.X(MEAN), axD.y - 170, { color: C.xbar, width: 2.5, alpha: lineA * pz });
          const pr = prog(t, d.zero + 2.0, 0.5);
          text(ctx, '首尾相接，回到起点：和为 0', axD.X(MEAN) + 30, axD.y - 190, { size: 26, color: C.dev, alpha: lineA * pr, align: 'left' });
        }
      }
      // ---- the algebra ----
      const P1 = { x: 860, y: 190, size: 50 };
      const w1 = prog(t, d.split + 0.4, 1.4, ease.linear);
      const aTop = A2 * (1 - prog(t, d.tells - 0.3, 0.6));
      if (w1 > 0) drawTex(ctx, L1, P1.x, P1.y, P1.size, { alpha: aTop, write: w1, colors: fCcol });
      const w2 = prog(t, d.sq, 1.6, ease.linear);
      if (w2 > 0) drawTex(ctx, L2, 860, 300, 46, { alpha: aTop, write: w2, colors: fCcol });
      // summed line: first with the sum inside, then (x̄ − c) pulled out, then the zero term crossed out
      const w3 = prog(t, d.sq + 1.4, 1.4, ease.linear);
      const mo = prog(t, d.out - 0.2, 1.0, ease.inOut);
      const gone = prog(t, d.gone, 0.6);
      const fin = prog(t, d.tells - 0.3, 1.2, ease.inOut);
      const P3 = { x: 860, y: 440, size: 46 };
      const P4 = { x: 900, y: 300, size: 58 };
      if (w3 > 0 && fin < 1) {
        const hiM = win(t, d.mid, d.zero, 0.4, 0.5);
        if (mo <= 0) drawTex(ctx, L3a, P3.x, P3.y, P3.size, { alpha: A2, write: w3, colors: { ...fCcol, m: hiM > 0 ? C.text : C.text } });
        else {
          if (mo < 1) drawTexMorph(ctx, L3a, P3, L3, P3, mo, { alpha: A2, colorsA: fCcol, colorsB: fCcol, map: { m: 'm' } });
          else drawTex(ctx, L3, P3.x, P3.y, P3.size, { alpha: A2, colors: { ...fCcol, z: win(t, d.out + 0.6, d.gone + 0.6, 0.4, 0.4) > 0 ? C.dev : C.text }, alphas: { m: 1 - 0.75 * gone } });
          if (mo >= 1) {
            const bm = L3.box(P3.x, P3.y, P3.size, 'c', 'm', 'm');
            if (hiM > 0) roundRect(ctx, bm.x0 - 10, bm.y0 - 10, bm.w + 20, bm.h + 20, 10, { stroke: C.hi, width: 2, alpha: A2 * hiM });
            const bz = L3.box(P3.x, P3.y, P3.size, 'c', 'm', 'z');
            const pzz = prog(t, d.zero + 1.4, 0.5);
            if (pzz > 0) text(ctx, '= 0', bz.cx, bz.y1 + 34, { size: 30, color: C.dev, alpha: A2 * pzz });
            if (gone > 0) line(ctx, bm.x0 - 6, bm.y1 + 2, lerp(bm.x0 - 6, bm.x1 + 6, gone), bm.y0 - 2, { color: C.neg, width: 3, alpha: A2 });
          }
        }
      }
      const ex = prog(t, d.ex - 0.3, 0.8, ease.inOut); // the identity moves up for the example
      const PY = lerp(P4.y, 190, ex), PS = lerp(P4.size, 50, ex);
      if (fin > 0 && fin < 1) drawTexMorph(ctx, L3, P3, L4, P4, fin, { alpha: A2, colorsA: fCcol, colorsB: fCcol });
      if (fin >= 1 && t < d.end - 0.05) drawTex(ctx, L4, P4.x, PY, PS, { alpha: 1, colors: fCcol });
      // the side note: why the deviations sum to zero
      const pd = prog(t, d.def, 1.2, ease.linear) * (1 - prog(t, d.tells - 0.3, 0.6));
      if (pd > 0) drawTex(ctx, Zdef, 1500, 560, 36, { alpha: A2 * clamp(pd * 3), write: pd });
      const pz2 = prog(t, d.zero, 1.2, ease.linear) * (1 - prog(t, d.tells - 0.3, 0.6));
      if (pz2 > 0) drawTex(ctx, Zsum, 1500, 650, 36, { alpha: A2 * clamp(pz2 * 3), write: pz2 });
      // ---- reading the result ----
      if (fin >= 1) {
        const lab = (tag, words, t0, col) => {
          const pl = prog(t, t0, 0.6) * (1 - ex);
          if (pl <= 0) return;
          const b = L4.box(P4.x, PY, PS, 'c', 'm', tag);
          brace(ctx, b.x0, b.y1 + 12, b.x1, b.y1 + 12, { side: -1, depth: 14, color: col, alpha: A2 * pl });
          rich(ctx, Array.isArray(words) ? words : [words], b.cx, b.y1 + 58, { size: 26, color: col, alpha: A2 * pl });
        };
        lab('l', LB.anyc, d.tells + 0.4, C.text);
        lab('p', '到样本均值的距离平方和', d.eqX, C.dev);
        lab('q', LB.nq, d.plus, C.hi);
        const pn = prog(t, d.nonneg, 0.6) * (1 - ex);
        if (pn > 0) {
          const b = L4.box(P4.x, PY, PS, 'c', 'm', 'q');
          drawTex(ctx, fGe0, b.x1 + 18, b.cy, 44, { color: C.hi, alpha: A2 * pn, align: 'l' });
          const pm = prog(t, d.min - 1.0, 0.6);
          rich(ctx, ['c = ', fXb, ' 时这一项为 0：平方和最小'], 960, 560, { size: 30, color: C.text, alpha: A2 * pm * (1 - ex), texScale: 1.1 });
        }
      }
    },
  });


  // the example: c = 1.5 is 0.4 away from x̄, so the sum is 4.78 + 5 × 0.4² = 5.58
  const PX = new Plot({ x: 300, y: 400, w: 760, h: 420, xr: [-0.3, 2.5], yr: [0, 15] });
  layers.push({
    t0: d.ex - 0.6,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A3 = prog(t, d.ex - 0.2, 0.8) * (1 - prog(t, d.end - 0.3, 0.8, ease.inOut));
      if (A3 <= 0) return;
      const P = PX;
      line(ctx, P.x, P.Y(0), P.x + P.w, P.Y(0), { color: C.axis, width: 2, alpha: A3 });
      line(ctx, P.X(-0.3), P.Y(0), P.X(-0.3), P.y - 10, { color: C.axis, width: 2, alpha: A3 });
      for (const v of [0, 0.5, 1, 1.5, 2]) {
        line(ctx, P.X(v), P.Y(0) - 5, P.X(v), P.Y(0) + 5, { color: C.axis, width: 2, alpha: A3 });
        num(ctx, String(v), P.X(v), P.Y(0) + 28, 22, { color: C.dim, alpha: A3 });
      }
      for (const v of [5, 10, 15]) {
        line(ctx, P.X(-0.3) - 5, P.Y(v), P.X(-0.3) + 5, P.Y(v), { color: C.axis, width: 2, alpha: A3 });
        num(ctx, String(v), P.X(-0.3) - 14, P.Y(v), 22, { color: C.dim, alpha: A3, align: 'right' });
      }
      drawTex(ctx, fC, P.x + P.w + 24, P.Y(0), 30, { color: C.hi, alpha: A3 });
      poly(ctx, P.curve(SS, -0.3, 2.5, 160), { color: C.dev, width: 2.5, alpha: A3 * 0.8 });
      // minimum level and the point at c = 1.5
      line(ctx, P.X(-0.3), P.Y(4.78), P.X(2.5), P.Y(4.78), { color: C.xbar, width: 1.5, dash: [5, 6], alpha: A3 * 0.8 });
      dot(ctx, P.X(MEAN), P.Y(4.78), 8, { color: C.xbar, alpha: A3 });
      num(ctx, '4.78', P.X(MEAN), P.Y(4.78) + 30, 24, { color: C.xbar, alpha: A3 });
      const p15 = prog(t, d.ex + 0.4, 0.6);
      dot(ctx, P.X(1.5), P.Y(5.58), 9, { color: C.hi, alpha: A3 * p15, glow: 0.6 });
      num(ctx, '5.58', P.X(1.5) + 40, P.Y(5.58) - 24, 24, { color: C.hi, alpha: A3 * p15 });
      // the 0.4 between x̄ and c, and the gap of 5 × 0.4²
      const pd = prog(t, d.ex + 1.2, 0.6);
      span(ctx, P.X(MEAN), P.X(1.5), P.Y(0) + 64, { color: C.hi, alpha: A3 * pd });
      num(ctx, '0.4', (P.X(MEAN) + P.X(1.5)) / 2, P.Y(0) + 92, 24, { color: C.hi, alpha: A3 * pd });
      const pg = prog(t, d.ex2 + 0.6, 0.7);
      if (pg > 0) {
        arrow(ctx, P.X(1.5) + 22, P.Y(4.78), P.X(1.5) + 22, P.Y(5.58), { color: C.hi, width: 2.5, head: 10, both: true, alpha: A3 * pg });
        drawTex(ctx, f504, P.X(1.5) + 40, (P.Y(4.78) + P.Y(5.58)) / 2 + 2, 30, { color: C.hi, alpha: A3 * pg, align: 'l' });
      }
      const pf = prog(t, d.ex2, 1.6, ease.linear);
      if (pf > 0) drawTex(ctx, fEx, 1450, 560, 50, { alpha: A3 * clamp(pf * 3), write: pf });
      const ps = prog(t, d.ex3 + 0.8, 0.6);
      text(ctx, '和刚才图上的数一样', 1450, 650, { size: 28, color: C.dim, alpha: A3 * ps });
    },
  });


  // =====================================================================
  // 4E  c = μ: average of each term -> the sum of squared deviations is (n − 1)σ²
  // 4F  so divide by n − 1; what dividing by n would give
  // =====================================================================
  const e = {
    start: d.end,
    avg: A('看两边在重复抽样中平均是多少'),
    left: A('左边是 n 个数据到缪的距离平方和'),
    leftv: A('平均是 n 份西格玛平方'),
    right: A('右边最后一项，是 n 乘以样本均值误差的平方'),
    recall: A('前面已经算过，样本均值的方差是西格玛平方除以 n'),
    one: A('所以这一项平均正好是一份西格玛平方'),
    so: A('于是，到样本均值的距离平方和'),
    n1: A('平均只有 n 减 1 份西格玛平方'),
  };
  const f = {
    start: A('少掉的这一份，正是样本均值本身的误差带来的'),
    div: A('所以要除以 n 减 1'),
    nobias: A('估计才没有系统偏差'),
    name: A('这样算出的 s 平方，叫作样本方差'),
    two: A('只有两个数据时'),
    half: A('除以 2 得到的估计平均只有真实值的一半'),
    five: A('有五个数据时'),
    end: S.g1,
  };
  const L5 = T(String.raw`\class{l}{\sum_{i=1}^{n}(x_i-\mu)^2}=\class{p}{\sum_{i=1}^{n}(x_i-\bar{x})^2}+\class{q}{n(\bar{x}-\mu)^2}`);
  const eN = T(String.raw`n\sigma^2`, { inline: true }), eQ = T(String.raw`?`, { inline: true }), eS = T(String.raw`\sigma^2`, { inline: true }), eN1 = T(String.raw`(n-1)\sigma^2`, { inline: true });
  const eWhy = T(String.raw`n\cdot\frac{\sigma^2}{n}=\sigma^2`, { inline: true });
  const fS2 = T(String.raw`s^2=\frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar{x})^2,\qquad E[s^2]=\class{s}{\sigma^2}`);
  const fDivN = T(String.raw`\frac{1}{n}\sum_{i=1}^{n}(x_i-\bar{x})^2\ \text{的平均}=\frac{n-1}{n}\,\sigma^2`);
  const fHalf = T(String.raw`n=2:\ \ \tfrac{1}{2}`, { inline: true }), fFour5 = T(String.raw`n=5:\ \ \tfrac{4}{5}`, { inline: true });
  const blk = 66, gap = 12;
  const groupX = (cx, k) => cx - (k * blk + (k - 1) * gap) / 2;
  function blocks(ctx, cx, y, k, col, a, prog0 = 1, o = {}) {
    const x0 = groupX(cx, k);
    for (let i = 0; i < k; i++) {
      const pi = clamp(prog0 * k - i);
      if (pi <= 0) continue;
      const s = ease.outBack(pi);
      const x = x0 + i * (blk + gap) + blk / 2;
      roundRect(ctx, x - (blk * s) / 2, y - (blk * s) / 2, blk * s, blk * s, 8, { fill: col, fillAlpha: 0.22, stroke: col, width: 2, alpha: a * clamp(pi * 2) });
      if (o.label !== false) drawTex(ctx, eS, x, y, 26, { color: col, alpha: a * clamp(pi * 2) * 0.9 });
    }
  }
  layers.push({
    t0: e.start - 0.6,
    t1: f.end + 1.2,
    draw(ctx, t) {
      const A4 = (t < e.start - 0.05 ? 0 : 1) * (1 - prog(t, f.end + 0.2, 0.9, ease.inOut));
      if (A4 <= 0) return;
      const up = prog(t, f.div - 0.3, 0.9, ease.inOut); // the identity makes room for s²
      const P = { x: 960, y: lerp(330, 200, up), size: lerp(60, 46, up) };
      const cols = { l: C.err, p: C.dev, q: C.xbar };
      const pin = prog(t, e.start - 0.05, 1.1, ease.inOut);
      if (pin < 1) drawTexMorph(ctx, L4, { x: 900, y: 190, size: 50 }, L5, P, pin, { colorsA: fCcol, colorsB: cols, map: { l: 'l', p: 'p', q: 'q' } });
      else drawTex(ctx, L5, P.x, P.y, P.size, { alpha: A4, colors: cols });
      const fadeLabels = 1 - prog(t, f.div - 0.4, 0.6);
      // averages over repeated sampling, written above each term
      const over = (tag, f0, t0, col, f1, t1) => {
        const pl = prog(t, t0, 0.6) * fadeLabels;
        if (pl <= 0) return;
        const b = L5.box(P.x, P.y, P.size, 'c', 'm', tag);
        brace(ctx, b.x0, b.y0 - 14, b.x1, b.y0 - 14, { side: 1, depth: 14, color: col, alpha: A4 * pl });
        const sw = f1 ? prog(t, t1, 0.8, ease.inOut) : 0;
        if (sw < 1) drawTex(ctx, f0, b.cx, b.y0 - 54, 40, { color: col, alpha: A4 * pl * (1 - sw) });
        if (sw > 0) drawTex(ctx, f1, b.cx, b.y0 - 54, 40, { color: col, alpha: A4 * pl * sw });
      };
      const pAvg = prog(t, e.avg, 0.5);
      if (pAvg > 0 && fadeLabels > 0) text(ctx, '括号上方：重复抽样中的平均', 960, P.y - 175, { size: 26, color: C.dim, alpha: A4 * pAvg * fadeLabels });
      over('l', eN, e.leftv, C.err);
      over('p', eQ, e.avg + 0.8, C.dev, eN1, e.n1);
      over('q', eS, e.one, C.xbar);
      // reasons, below the terms
      const below = (tag, t0, draw) => {
        const pl = prog(t, t0, 0.6) * fadeLabels;
        if (pl <= 0) return;
        const b = L5.box(P.x, P.y, P.size, 'c', 'm', tag);
        draw(b, pl);
      };
      below('l', e.left + 0.4, (b, pl) => rich(ctx, [...LB.nterm, eS], b.cx, b.y1 + 40, { size: 24, color: C.err, alpha: A4 * pl }));
      below('q', e.recall + 0.6, (b, pl) => drawTex(ctx, eWhy, b.cx, b.y1 + 44, 34, { color: C.xbar, alpha: A4 * pl }));
      // blocks: n parts = (n − 1) parts + 1 part
      const yB = 700;
      const pL = prog(t, e.leftv, 1.0);
      const pR = prog(t, e.one, 0.6);
      const pM = prog(t, e.n1, 1.0);
      const merge = prog(t, f.div + 0.3, 1.2, ease.inOut); // (n − 1) parts / (n − 1) = one part
      const bA = A4 * (1 - prog(t, f.two - 0.6, 0.6));
      if (pL > 0 && bA > 0) {
        blocks(ctx, 470, yB, 5, C.err, bA * (1 - up), pL);
        drawTex(ctx, eN, 470, yB + 74, 32, { color: C.err, alpha: bA * pL * (1 - up) });
        text(ctx, '=', 760, yB, { size: 48, color: C.text, alpha: bA * pR * (1 - up) });
        text(ctx, '+', 1215, yB, { size: 48, color: C.text, alpha: bA * pR * (1 - up) });
        blocks(ctx, 1330, yB, 1, C.xbar, bA, pR);
        drawTex(ctx, eS, 1330, yB + 74, 32, { color: C.xbar, alpha: bA * pR * (1 - up) });
        // the four that remain, which later merge into one σ² after dividing by n − 1
        if (merge <= 0) {
          blocks(ctx, 990, yB, 4, C.dev, bA, pM);
          drawTex(ctx, eN1, 990, yB + 74, 32, { color: C.dev, alpha: bA * pM });
        } else {
          const x0 = groupX(990, 4);
          for (let i = 0; i < 4; i++) {
            const x = lerp(x0 + i * (blk + gap) + blk / 2, 990, merge);
            roundRect(ctx, x - blk / 2, yB - blk / 2, blk, blk, 8, { fill: C.dev, fillAlpha: 0.22 - 0.04 * merge, stroke: C.dev, width: 2, alpha: bA * (i === 0 ? 1 : 1 - merge * 0.9) });
          }
          drawTex(ctx, eS, 990, yB, 26, { color: C.sigma, alpha: bA * merge });
          text(ctx, '÷ (n − 1)', 990, yB + 74, { size: 28, color: C.dev, alpha: bA * merge });
        }
        // the missing part is the sample mean's own error
        const pf = win(t, f.start, f.div + 0.2, 0.5, 0.5);
        if (pf > 0) {
          roundRect(ctx, 1330 - blk / 2 - 10, yB - blk / 2 - 10, blk + 20, blk + 20, 12, { stroke: C.hi, width: 2.5, alpha: bA * pf });
          text(ctx, '样本均值本身的误差', 1330, yB - 76, { size: 26, color: C.hi, alpha: bA * pf });
        }
      }
      // s²
      const ps = prog(t, f.div, 1.4, ease.linear);
      if (ps > 0) drawTex(ctx, fS2, 960, 400, 54, { alpha: A4 * clamp(ps * 3) * (1 - prog(t, f.two - 0.6, 0.6) * 0.0), write: ps, colors: { s: C.sigma } });
      const pn = prog(t, f.nobias, 0.6);
      if (pn > 0) {
        const b = fS2.box(960, 400, 54, 'c', 'm', 's');
        text(ctx, '没有系统偏差', b.cx + 20, b.y1 + 34, { size: 24, color: C.sigma, alpha: A4 * pn });
      }
      const pnm = prog(t, f.name, 0.6);
      if (pnm > 0) {
        const b = fS2.box(960, 400, 54, 'c', 'm');
        text(ctx, '样本方差', b.x0 + 70, b.y1 + 34, { size: 28, color: C.text, alpha: A4 * pnm });
      }
      // what dividing by n gives: (n − 1)/n of the true value
      const pb = prog(t, f.two - 0.3, 0.8);
      if (pb > 0) {
        drawTex(ctx, fDivN, 960, 560, 40, { alpha: A4 * pb });
        const x0 = 640, Wb = 640;
        const bars = [[2, 1 / 2, f.half, fHalf], [5, 4 / 5, f.five, fFour5]];
        bars.forEach(([n, r, tt, lab], i) => {
          const y = 680 + i * 100;
          const pr = prog(t, tt - 0.2, 0.9, ease.inOut);
          if (pr <= 0) return;
          roundRect(ctx, x0, y - 22, Wb, 44, 8, { stroke: C.sigma, width: 1.5, dash: [6, 6], alpha: A4 * pr * 0.8 });
          roundRect(ctx, x0, y - 22, Wb * r * pr, 44, 8, { fill: C.dev, fillAlpha: 0.5, alpha: A4 * pr });
          drawTex(ctx, lab, x0 - 30, y, 34, { align: 'r', alpha: A4 * pr });
          text(ctx, n === 2 ? '一半' : '八成', x0 + Wb * r + 20, y, { size: 28, color: C.dev, alpha: A4 * prog(t, tt + 0.6, 0.5), align: 'left' });
        });
        rich(ctx, ['真实值 ', eS], x0 + Wb + 20, 640, { size: 24, color: C.sigma, alpha: A4 * pb, align: 'left' });
      }
    },
  });

  return { layers };
}
