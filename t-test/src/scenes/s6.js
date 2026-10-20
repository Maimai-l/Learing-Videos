// 六、分母也会变：用 1.96 会误判
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, labelNum, line, arrow, dot, Axis, Plot, span, brace, roundRect, rich, poly, fillPoly, panel } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, rng, fmt, normPdf, normCdf, chi2Pdf } from '../engine/util.js';
import { histBars, binCounts, bestSeed } from './common.js';

const T = (s, o) => tex(s, o);

export function build6(N) {
  const S = N.chapter(6);
  const { A } = S;
  const layers = [];
  const a = {
    start: S.first,
    vary: A('但每次抽样得到的 s 仍然有大有小'),
    few: A('数据少的时候，这种波动相当明显'),
    four: A('只有 4 个数据时'),
    six: A('大约六成的样本算出的 s 比西格玛小'),
    tstat: A('用 s 代替西格玛放进分母'),
    small: A('s 偏小时，t 变大'),
    up: A('越过 1.96 的可能性可以从 5% 升到接近百分之百'),
    big: A('s 偏大时，t 变小'),
    asym: A('两种情况的影响并不对称'),
    more: A('再加上 s 偏小的情况更多'),
    over: A('越过 1.96 的总概率就超过了 5%'),
    sim: A('在原假设成立、只有 4 个数据的条件下模拟一百万次'),
    p145: A('大约有 14.5% 的 t 值落在'),
    need: A('要定出正确的界限'),
    end: S.g1,
  };
  // ---------- 6A: s from samples of 4 (σ = 1) ----------
  const NSs = 400;
  const drawS = (seed) => {
    const g = normalSampler(seed);
    return Array.from({ length: NSs }, () => {
      const x = [g(), g(), g(), g()];
      const m = (x[0] + x[1] + x[2] + x[3]) / 4;
      return Math.sqrt(x.reduce((p, q) => p + (q - m) ** 2, 0) / 3);
    });
  };
  const sv = drawS(bestSeed((sd) => { const x = drawS(sd); return Math.abs(x.filter((v) => v < 1).length / NSs - 0.608); }, 1, 300));
  const fracBelow = sv.filter((v) => v < 1).length / NSs;
  const svT = sv.map((_, k) => a.vary + 0.3 + 6.0 * Math.pow(k / NSs, 0.6));
  const axS = new Axis({ x0: 360, x1: 1560, y: 800, v0: 0, v1: 2.6 });
  const BW = 0.1;
  const maxS = Math.max(...binCounts(sv, NSs, 0, BW, 26));
  const fEs2 = T(String.raw`E[s^2]=\class{s}{\sigma^2}`);
  const fS2def = T(String.raw`s^2=\frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar{x})^2`);
  const fSig = T(String.raw`\sigma`, { inline: true });
  const fS = T('s', { inline: true });
  layers.push({
    t0: a.start - 0.6,
    t1: a.tstat + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.4, 0.8) * (1 - prog(t, a.tstat - 0.4, 0.8, ease.inOut));
      if (A1 <= 0) return;
      const up = prog(t, a.vary - 0.6, 0.8, ease.inOut);
      drawTex(ctx, fS2def, 960, lerp(330, 150, up), lerp(56, 40, up), { alpha: A1 * (1 - up), write: prog(t, a.start - 0.2, 1.2, ease.linear) });
      drawTex(ctx, fEs2, 960, lerp(450, 210, up), lerp(56, 50, up), { alpha: A1, write: prog(t, a.start + 0.9, 1.0, ease.linear), colors: { s: C.sigma } });
      text(ctx, '平均对了', 960, lerp(530, 280, up), { size: 28, color: C.sigma, alpha: A1 * prog(t, a.start + 2.2, 0.6) });
      const pv = prog(t, a.vary - 0.2, 0.7);
      if (pv <= 0) return;
      axS.draw(ctx, { alpha: A1 * pv, ticks: [0, 0.5, 1, 1.5, 2, 2.5], labels: ['0', '0.5', '1', '1.5', '2', '2.5'] });
      rich(ctx, ['每次抽 4 个数算出的 ', fS], axS.X(1.95), axS.y - 300, { size: 28, color: C.s, alpha: A1 * pv });
      const k = svT.findLastIndex((x) => x <= t);
      const hi = prog(t, a.six, 0.6);
      // bars: left of σ highlighted once the 60% is said
      const counts = binCounts(sv, k + 1, 0, BW, 26);
      const left = counts.map((c, i) => (i < 10 ? c : 0)), right = counts.map((c, i) => (i >= 10 ? c : 0));
      histBars(ctx, axS, left, 0, BW, maxS, 300, hi > 0 ? C.hi : C.s, A1 * pv, { fillAlpha: 0.55 });
      histBars(ctx, axS, right, 0, BW, maxS, 300, C.s, A1 * pv, { fillAlpha: 0.55 });
      line(ctx, axS.X(1), axS.y + 12, axS.X(1), axS.y - 340, { color: C.sigma, width: 2.5, alpha: A1 * pv });
      rich(ctx, ['真实的 ', fSig], axS.X(1), axS.y - 362, { size: 26, color: C.sigma, alpha: A1 * pv });
      if (hi > 0) {
        labelNum(ctx, 's < σ：约', Math.round(fracBelow * 100) + '%', axS.X(0.45), axS.y - 340, { size: 32, color: C.hi, alpha: A1 * hi });
      }
      const pf = prog(t, a.four, 0.6) * (1 - hi);
      text(ctx, '样本量 n = 4', axS.X(0.45), axS.y - 340, { size: 30, color: C.text, alpha: A1 * pf });
    },
  });

  // ---------- 6B: t = (x̄ − μ0)/(s/√n); how often does it cross 1.96? ----------
  const fZ = T(String.raw`z=\frac{\bar{x}-\mu_0}{\class{d}{\sigma}/\sqrt{n}}`);
  const fT = T(String.raw`t=\frac{\bar{x}-\mu_0}{\class{d}{s}/\sqrt{n}}`);
  const fCond = T(String.raw`P\big(|t|>1.96\big)=P\Big(|Z|>1.96\cdot\frac{s}{\sigma}\Big)`);
  const PL = new Plot({ x: 420, y: 330, w: 1080, h: 420, xr: [0, 2.2], yr: [0, 1] });
  const g = (r) => 2 * (1 - normCdf(1.96 * r));
  const fR = (r) => (r <= 0 ? 0 : chi2Pdf(3 * r * r, 3) * 6 * r); // density of s/σ for n = 4
  const fRmax = 1.25;
  const fXlab = T(String.raw`s/\sigma`, { inline: true });
  layers.push({
    t0: a.tstat - 0.6,
    t1: a.sim + 1.0,
    draw(ctx, t) {
      const A2 = prog(t, a.tstat - 0.3, 0.8) * (1 - prog(t, a.sim - 0.4, 0.8, ease.inOut));
      if (A2 <= 0) return;
      // σ → s in the denominator
      const pm = prog(t, a.tstat + 0.9, 1.0, ease.inOut);
      const P = { x: 960, y: 170, size: 50 };
      drawTexMorph(ctx, fZ, P, fT, P, pm, { alpha: A2, colorsA: { d: C.sigma }, colorsB: { d: C.s }, map: { d: 'd' } });
      text(ctx, 't 统计量', 1160, 170, { size: 28, color: C.s, alpha: A2 * prog(t, a.tstat + 2.0, 0.6) });
      // the probability of crossing 1.96 for a given s/σ
      const pp = prog(t, a.small - 0.2, 0.7);
      if (pp <= 0) return;
      const pa = A2 * pp;
      line(ctx, PL.x, PL.Y(0), PL.x + PL.w, PL.Y(0), { color: C.axis, width: 2, alpha: pa });
      line(ctx, PL.x, PL.Y(0), PL.x, PL.y - 10, { color: C.axis, width: 2, alpha: pa });
      for (const v of [0, 0.5, 1, 1.5, 2]) {
        line(ctx, PL.X(v), PL.Y(0) - 5, PL.X(v), PL.Y(0) + 5, { color: C.axis, width: 2, alpha: pa });
        num(ctx, String(v), PL.X(v), PL.Y(0) + 28, 22, { color: C.dim, alpha: pa });
      }
      for (const [v, lab] of [[0.05, '5%'], [0.5, '50%'], [1, '100%']]) {
        line(ctx, PL.x - 5, PL.Y(v), PL.x + 5, PL.Y(v), { color: C.axis, width: 2, alpha: pa });
        num(ctx, lab, PL.x - 14, PL.Y(v), 22, { color: C.dim, alpha: pa, align: 'right' });
      }
      drawTex(ctx, fXlab, PL.x + PL.w + 40, PL.Y(0), 32, { color: C.s, alpha: pa });
      text(ctx, '越过 1.96 的可能性', PL.x + 10, PL.y - 30, { size: 26, color: C.text, alpha: pa, align: 'left' });
      drawTex(ctx, fCond, 1300, 330, 34, { alpha: pa * prog(t, a.small + 0.6, 0.8) });
      // r = 1 is the σ we wished we had: 5%
      line(ctx, PL.X(1), PL.Y(0), PL.X(1), PL.y, { color: C.sigma, width: 1.5, dash: [5, 6], alpha: pa * 0.7 });
      dot(ctx, PL.X(1), PL.Y(g(1)), 8, { color: C.sigma, alpha: pa });
      // left part (s too small), then the right part (s too large)
      const pL = prog(t, a.small + 0.3, 2.6, ease.inOut), pR = prog(t, a.big + 0.2, 2.0, ease.inOut);
      if (pL > 0) poly(ctx, PL.curve(g, lerp(1, 0.02, pL), 1, 120), { color: C.hi, width: 3.5, alpha: pa });
      if (pR > 0) poly(ctx, PL.curve(g, 1, lerp(1, 2.2, pR), 120), { color: C.s, width: 3.5, alpha: pa });
      const pu = prog(t, a.up + 1.4, 0.6);
      if (pu > 0) {
        arrow(ctx, PL.X(0.62), PL.Y(0.12), PL.X(0.62), PL.Y(0.62), { color: C.hi, width: 2.5, alpha: pa * pu });
        text(ctx, '最多升到将近 100%', PL.X(0.34), PL.Y(0.75), { size: 26, color: C.hi, alpha: pa * pu });
      }
      const pd = prog(t, a.big + 2.0, 0.6);
      if (pd > 0) {
        arrow(ctx, PL.X(1.5), PL.Y(0.16), PL.X(1.5), PL.Y(0.02), { color: C.s, width: 2.5, alpha: pa * pd });
        text(ctx, '最多降到 0', PL.X(1.5), PL.Y(0.22), { size: 26, color: C.s, alpha: pa * pd });
      }
      // how often s is small: the distribution of s/σ underneath
      const pdist = prog(t, a.more, 0.8);
      if (pdist > 0) {
        const sc = 0.55 / fRmax;
        const ptsL = [[PL.X(0), PL.Y(0)]], ptsR = [[PL.X(1), PL.Y(0)]];
        for (let r = 0; r <= 1.0001; r += 0.01) ptsL.push([PL.X(r), PL.Y(fR(r) * sc)]);
        ptsL.push([PL.X(1), PL.Y(0)]);
        for (let r = 1; r <= 2.2; r += 0.01) ptsR.push([PL.X(r), PL.Y(fR(r) * sc)]);
        ptsR.push([PL.X(2.2), PL.Y(0)]);
        fillPoly(ctx, ptsL, C.hi, 0.18 * pa * pdist);
        fillPoly(ctx, ptsR, C.s, 0.14 * pa * pdist);
        text(ctx, 's 的分布：约六成在左边', PL.X(1.62), PL.Y(0.44), { size: 24, color: C.soft, alpha: pa * pdist });
      }
      const po = prog(t, a.over, 0.7);
      if (po > 0) {
        line(ctx, PL.X(0), PL.Y(0.145), PL.X(2.2), PL.Y(0.145), { color: C.err, width: 2.5, dash: [8, 6], alpha: pa * po });
        text(ctx, '平均下来：超过 5%', PL.X(1.82), PL.Y(0.145) - 24, { size: 26, color: C.err, alpha: pa * po });
      }
    },
  });

  // ---------- 6C: one million simulated t values (n = 4) ----------
  const NSIM = 1000000;
  const BWt = 0.2, T0 = -6, NB = 60;
  const counts = new Array(NB).fill(0);
  let beyond = 0;
  {
    const g2 = normalSampler(20261020);
    for (let i = 0; i < NSIM; i++) {
      const x0 = g2(), x1 = g2(), x2 = g2(), x3 = g2();
      const m = (x0 + x1 + x2 + x3) / 4;
      const ss = (x0 - m) ** 2 + (x1 - m) ** 2 + (x2 - m) ** 2 + (x3 - m) ** 2;
      const tv = m / (Math.sqrt(ss / 3) / 2);
      if (Math.abs(tv) > 1.96) beyond++;
      const b = Math.floor((tv - T0) / BWt);
      if (b >= 0 && b < NB) counts[b]++;
    }
  }
  const pBeyond = beyond / NSIM;
  const axT = new Axis({ x0: 360, x1: 1560, y: 820, v0: -5, v1: 5 });
  const dens = counts.map((c) => c / NSIM / BWt);
  const fN1 = T(String.raw`\pm 1.96`, { inline: true });
  layers.push({
    t0: a.sim - 0.6,
    t1: a.end + 1.2,
    draw(ctx, t) {
      const A3 = prog(t, a.sim - 0.3, 0.8) * (1 - prog(t, a.end + 0.1, 0.9, ease.inOut));
      if (A3 <= 0) return;
      drawTex(ctx, fT, 960, 170, 46, { alpha: A3, colors: { d: C.s } });
      axT.draw(ctx, { alpha: A3, ticks: [-4, -3, -2, -1, 0, 1, 2, 3, 4], labels: ['−4', '−3', '−2', '−1', '0', '1', '2', '3', '4'] });
      const grow = prog(t, a.sim + 0.3, 3.4, ease.inOut);
      const sc = 900; // density -> px
      // bars (t values) grow while the counter runs
      ctx.save();
      for (let b = 0; b < NB; b++) {
        const v0 = T0 + b * BWt;
        if (v0 < axT.v0 || v0 + BWt > axT.v1) continue;
        const h = dens[b] * sc * grow;
        const out = Math.abs(v0 + BWt / 2) > 1.96;
        ctx.fillStyle = rgba(out ? C.err : C.t, A3 * (out ? 0.7 : 0.45));
        ctx.fillRect(axT.X(v0) + 1, axT.y - h, axT.X(v0 + BWt) - axT.X(v0) - 2, h);
      }
      ctx.restore();
      // the standard normal for comparison
      const pn = prog(t, a.sim + 1.2, 1.2, ease.inOut);
      poly(ctx, (() => { const p = []; for (let v = -5; v <= 5.0001; v += 0.02) p.push([axT.X(v), axT.y - normPdf(v) * sc]); return p; })(), { color: C.normal, width: 3, alpha: A3 * pn, progress: pn });
      text(ctx, '标准正态分布', axT.X(1.0) + 40, axT.y - normPdf(0.9) * sc - 20, { size: 24, color: C.normal, alpha: A3 * pn, align: 'left' });
      // ±1.96
      for (const s of [-1, 1]) line(ctx, axT.X(1.96 * s), axT.y + 10, axT.X(1.96 * s), axT.y - 300, { color: C.hi, width: 2, alpha: A3 * pn });
      drawTex(ctx, fN1, axT.X(1.96) + 12, axT.y - 300, 30, { color: C.hi, alpha: A3 * pn, align: 'l' });
      // counter and the fraction outside
      const cnt = Math.round(NSIM * grow);
      labelNum(ctx, '模拟次数', cnt.toLocaleString('en-US'), 960, 290, { size: 30, color: C.soft, alpha: A3 });
      const pp = prog(t, a.p145 - 0.3, 0.7);
      if (pp > 0) {
        labelNum(ctx, '落在 ±1.96 以外', (pBeyond * 100).toFixed(1) + '%', axT.X(-3.3), axT.y - 260, { size: 32, color: C.err, alpha: A3 * pp });
        labelNum(ctx, '标准正态应为', '5.0%', axT.X(-3.3), axT.y - 210, { size: 26, color: C.normal, alpha: A3 * pp });
      }
      const pq = prog(t, a.need, 0.7);
      if (pq > 0) text(ctx, '正确的界限在哪里？', 960, 380, { size: 34, color: C.hi, alpha: A3 * pq });
    },
  });
  return { layers };
}
