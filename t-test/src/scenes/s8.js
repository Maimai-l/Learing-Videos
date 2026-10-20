// 八、自由度可以不是整数
import { C } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, line, arrow, dot, Axis, Plot, span, brace, braceTip, roundRect, rich, poly, fillPoly, num, mixed } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, normPdf, scaledChi2Pdf, tPdf, mixColor } from '../engine/util.js';
import { bez } from './common.js';

const T = (s, o) => tex(s, o);
const G1 = '#F2A65A', G2 = '#7FB8F0'; // the two groups

// a smooth connector through four control points
function curve(ctx, p0, p1, p2, p3, o) {
  const pts = [];
  for (let i = 0; i <= 48; i++) pts.push(bez(p0, p1, p2, p3, i / 48));
  poly(ctx, pts, o);
}

// n values with mean m and sample variance exactly v
function group(seed, n, m, v) {
  const g = normalSampler(seed);
  const z = Array.from({ length: n }, () => g());
  const zm = z.reduce((p, q) => p + q, 0) / n;
  const sd = Math.sqrt(z.reduce((p, q) => p + (q - zm) ** 2, 0) / (n - 1));
  return z.map((q) => m + (Math.sqrt(v) * (q - zm)) / sd);
}

// stack dots that would overlap: returns [value, level]
function stack(values, ax, minPx = 21) {
  const out = [];
  [...values].sort((a, b) => a - b).forEach((v) => {
    let lv = 0;
    while (out.some(([w, l]) => l === lv && Math.abs(ax.X(w) - ax.X(v)) < minPx)) lv++;
    out.push([v, lv]);
  });
  return out;
}

export function build8(N) {
  const S = N.chapter(8);
  const { A } = S;
  const layers = [];
  const LB = {
    rel: mixed('$s$ 有多可靠'),
    shape: mixed('$t$ 分布的形状'),
    unit: mixed('换单位（每个数都乘以 $c$）：'),
  };
  const fS2 = T('s^2', { inline: true }), fNuI = T(String.raw`\nu`, { inline: true });

  // =====================================================================
  // 8A  the two roles of ν are the same number
  // =====================================================================
  const a = {
    start: S.first,
    info: A('它是能用来估计离散程度的信息条数'),
    div: A('决定了偏差平方和要除以几'),
    parts: A('它也是构成 s 平方的独立部分的个数'),
    rel: A('决定了 s 有多可靠'),
    shape: A('进而决定了 t 分布的形状'),
    same: A('这两者是同一个数'),
    because: A('因为 s 平方正是由这几条间距的平方平均得到的'),
    end: A('这也说明了为什么自由度可以不是整数'),
  };
  const fNuBig = T(String.raw`\nu`, { inline: true });
  const fDiv = T(String.raw`s^2=\frac{\sum(x_i-\bar{x})^2}{\class{n}{n-1}}`);
  const fSame = T(String.raw`s^2=\frac{\class{a}{2.00}+\class{b}{1.93}+\class{c}{0.85}+\class{d}{0.00}}{\class{n}{4}}=1.195`);
  const PR1 = new Plot({ x: 1316, y: 262, w: 190, h: 110, xr: [0, 3], yr: [0, 0.8] });
  const PR2 = new Plot({ x: 1572, y: 262, w: 210, h: 110, xr: [-4, 4], yr: [0, 0.42] });
  const L = { x: 400, y: 318 }, R = { x: 1549, y: 318 }, M = { x: 960, y: 318 };
  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 0.8,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.3, 0.8) * (1 - prog(t, a.end - 0.4, 0.7, ease.inOut));
      if (A1 <= 0) return;
      const same = prog(t, a.same - 0.1, 0.6);
      const glow = same * (1 - prog(t, a.because + 1.2, 0.8));
      // ν in the middle
      const pv = prog(t, a.start + 0.1, 1.0, ease.linear);
      dot(ctx, M.x, M.y, 82, { fill: false, ring: C.hi, ringWidth: 2 + 1.5 * glow, alpha: A1 * clamp(pv * 2) * (0.35 + 0.65 * glow) });
      drawTex(ctx, fNuBig, M.x, M.y, 120, { color: C.hi, alpha: A1 * clamp(pv * 3), write: pv });
      const linkA = A1 * (0.6 + 0.4 * glow);
      // left: how many pieces of information → what to divide by
      const pL = prog(t, a.info - 0.2, 0.7);
      text(ctx, '能用来估计离散程度的信息条数', L.x, 190, { size: 28, color: C.text, alpha: A1 * pL });
      arrow(ctx, M.x - 96, M.y, L.x + 200, M.y, { color: C.hi, width: 2.5 + glow, alpha: linkA * pL, progress: prog(t, a.info, 0.8) });
      const pd = prog(t, a.div - 0.4, 1.0, ease.linear);
      if (pd > 0) drawTex(ctx, fDiv, L.x - 10, M.y, 46, { alpha: A1 * clamp(pd * 3), write: pd, colors: { n: mixColor(C.text, C.hi, prog(t, a.div + 0.5, 0.6)) } });
      text(ctx, '偏差平方和要除以几', L.x, 452, { size: 26, color: C.soft, alpha: A1 * prog(t, a.div + 0.4, 0.6) });
      // right: how many independent parts → how reliable s is → the shape of t
      const pR = prog(t, a.parts - 0.2, 0.7);
      rich(ctx, ['构成 ', fS2, ' 的独立部分的个数'], R.x, 190, { size: 28, color: C.text, alpha: A1 * pR });
      arrow(ctx, M.x + 96, M.y, PR1.x - 22, M.y, { color: C.hi, width: 2.5 + glow, alpha: linkA * pR, progress: prog(t, a.parts, 0.8) });
      const p1 = prog(t, a.rel - 0.3, 0.8);
      if (p1 > 0) {
        line(ctx, PR1.x, PR1.Y(0), PR1.x + PR1.w, PR1.Y(0), { color: C.axis, width: 1.5, alpha: A1 * p1 });
        line(ctx, PR1.X(1), PR1.Y(0), PR1.X(1), PR1.y - 2, { color: C.sigma, width: 1.2, dash: [4, 5], alpha: A1 * p1 * 0.8 });
        poly(ctx, PR1.curve((x) => scaledChi2Pdf(x, 4), 0.01, 3, 120), { color: C.s, width: 2.5, alpha: A1 * p1, progress: p1 });
        rich(ctx, LB.rel, PR1.x + PR1.w / 2, 452, { size: 24, color: C.soft, alpha: A1 * p1 });
      }
      const p2 = prog(t, a.shape - 0.2, 0.8);
      if (p2 > 0) {
        arrow(ctx, PR1.x + PR1.w + 12, PR1.Y(0.4), PR2.x - 12, PR1.Y(0.4), { color: C.dim, width: 2, head: 10, alpha: A1 * p2 });
        line(ctx, PR2.x, PR2.Y(0), PR2.x + PR2.w, PR2.Y(0), { color: C.axis, width: 1.5, alpha: A1 * p2 });
        poly(ctx, PR2.curve((x) => normPdf(x), -4, 4, 120), { color: C.normal, width: 1.5, dash: [5, 5], alpha: A1 * p2 * 0.8 });
        poly(ctx, PR2.curve((x) => tPdf(x, 4), -4, 4, 120), { color: C.t, width: 2.5, alpha: A1 * p2, progress: p2 });
        rich(ctx, LB.shape, PR2.x + PR2.w / 2, 452, { size: 24, color: C.soft, alpha: A1 * p2 });
      }
      // the five batches: s² is the average of ν squared gaps
      const pb = prog(t, a.because - 0.1, 1.4, ease.linear);
      if (pb > 0) {
        const FY = 700, FS = 52;
        const ab = clamp(pb * 3);
        const box = (tag) => fSame.box(M.x, FY, FS, 'c', 'm', tag);
        const bx = [box('a'), box('b'), box('c'), box('d')], bn = box('n'), ball = fSame.box(M.x, FY, FS);
        const pc = prog(t, a.because + 1.0, 0.6);
        bx.forEach((q) => roundRect(ctx, q.x0 - 9, q.y0 - 8, q.x1 - q.x0 + 18, q.y1 - q.y0 + 16, 8, { fill: C.dev, fillAlpha: 0.12 * pc, stroke: C.dev, width: 1.2, alpha: A1 * pc * 0.7 }));
        dot(ctx, (bn.x0 + bn.x1) / 2, (bn.y0 + bn.y1) / 2, 26, { fill: false, ring: C.hi, ringWidth: 2, alpha: A1 * pc });
        drawTex(ctx, fSame, M.x, FY, FS, { alpha: A1 * ab, write: pb, colors: { a: C.dev, b: C.dev, c: C.dev, d: C.dev, n: C.hi } });
        text(ctx, '五批数据：', ball.x0, 590, { size: 24, color: C.soft, alpha: A1 * ab, align: 'left' });
        const pl = prog(t, a.because + 1.6, 0.6);
        if (pl > 0) {
          const nx = (bn.x0 + bn.x1) / 2, ny = (bn.y0 + bn.y1) / 2;
          text(ctx, '4 条间距的平方项', (bx[0].x0 + bx[3].x1) / 2, bx[0].y0 - 40, { size: 24, color: C.dev, alpha: A1 * pl });
          text(ctx, '除以 4', nx + 40, ny + 2, { size: 24, color: C.hi, alpha: A1 * pl, align: 'left' });
          // both roles land on the same 4
          const pq = prog(t, a.because + 2.0, 1.0, ease.inOut);
          curve(ctx, [L.x, 476], [L.x, 830], [nx - 60, 860], [nx - 4, ny + 30], { color: C.hi, width: 2, alpha: A1 * 0.75, progress: pq, dash: [2, 7] });
          curve(ctx, [R.x, 476], [R.x, 590], [bx[3].x1 + 160, bx[3].y0 - 50], [bx[3].x1 + 12, bx[3].y0 - 12], { color: C.dev, width: 2, alpha: A1 * 0.75, progress: pq, dash: [2, 7] });
        }
      }
    },
  });

  // =====================================================================
  // 8B  unequal variances: the sum is no longer ν equal parts
  // =====================================================================
  const b = {
    start: a.end,
    two: A('两组数据方差不相等时'),
    diff: A('两组均值之差的方差'),
    t1: A('要用 s 一的平方除以 n 一'),
    t2: A('加上 s 二的平方除以 n 二来估计'),
    size: A('两项的大小不同'),
    notnu: A('这个和不再是纽个同样大小的独立部分的平均'),
    count: A('没法直接数出自由度'),
    end: A('前面算过'),
  };
  const axG = (y) => new Axis({ x0: 420, x1: 1500, y, v0: -2.5, v1: 7 });
  const AG1 = axG(230), AG2 = axG(392);
  const d1 = stack(group(13, 5, 2.6, 4), AG1), d2 = stack(group(113, 12, 0.7, 1), AG2);
  const fXb1 = T(String.raw`\bar{x}_1`, { inline: true }), fXb2 = T(String.raw`\bar{x}_2`, { inline: true });
  const fXd = T(String.raw`\bar{x}_1-\bar{x}_2`, { inline: true });
  const fVarD = T(String.raw`\mathrm{Var}(\bar{x}_1-\bar{x}_2)=\class{sg}{\frac{\sigma_1^2}{n_1}+\frac{\sigma_2^2}{n_2}}\class{ap}{\approx}\class{a}{\frac{s_1^2}{n_1}}\class{p}{+}\class{b}{\frac{s_2^2}{n_2}}`);
  const fA1 = T(String.raw`\frac{s_1^2}{n_1}`, { inline: true }), fA2 = T(String.raw`\frac{s_2^2}{n_2}`, { inline: true });
  const fQ = T(String.raw`\nu=\,?`, { inline: true });
  // block sizes: s₁²/n₁ = 0.8 made of n₁ − 1 = 4 equal parts, s₂²/n₂ = 0.083 of n₂ − 1 = 11
  const KX = 1000, GAP = 5;
  const blocksS = [...Array(4).fill([0.8 / 4, G1]), ...Array(11).fill([1 / 12 / 11, G2])];
  const wS = blocksS.reduce((p, [v]) => p + v * KX, 0) + GAP * (blocksS.length - 1);
  layers.push({
    t0: b.start - 0.6,
    t1: b.end + 0.8,
    draw(ctx, t) {
      const A2 = prog(t, b.start - 0.2, 0.8) * (1 - prog(t, b.end - 0.6, 0.7, ease.inOut));
      if (A2 <= 0) return;
      // the two groups
      const pg = prog(t, b.start + 0.2, 0.8) * (1 - prog(t, b.size - 0.2, 0.6));
      if (pg > 0) {
        [[AG1, d1, G1, '第一组', fXb1, 2.6], [AG2, d2, G2, '第二组', fXb2, 0.7]].forEach(([ax, ds, col, name, fm, m], k) => {
          const pa = A2 * pg * prog(t, b.start + 0.2 + k * 0.5, 0.7);
          if (pa <= 0) return;
          ax.draw(ctx, { alpha: pa * 0.8, ticks: [], labels: [] });
          text(ctx, name, ax.x0 - 30, ax.y, { size: 26, color: col, alpha: pa, align: 'right' });
          ds.forEach(([v, lv], i) => dot(ctx, ax.X(v), ax.y - lv * 21, 8, { color: col, alpha: pa * prog(t, b.start + 0.3 + k * 0.5 + i * 0.05, 0.4), glow: 0.4 }));
          const pm = prog(t, b.two + 0.6 + k * 0.3, 0.6);
          line(ctx, ax.X(m), ax.y + 12, ax.X(m), ax.y - 78, { color: col, width: 2.5, alpha: pa * pm });
          drawTex(ctx, fm, ax.X(m), ax.y - 100, 30, { color: col, alpha: pa * pm });
        });
        // the difference between the two means
        const pdf = prog(t, b.diff, 0.8);
        if (pdf > 0) {
          const x1 = AG1.X(2.6), x2 = AG2.X(0.7), y = 478;
          line(ctx, x1, AG1.y + 14, x1, y, { color: G1, width: 1.5, dash: [5, 6], alpha: A2 * pg * pdf * 0.7 });
          line(ctx, x2, AG2.y + 14, x2, y, { color: G2, width: 1.5, dash: [5, 6], alpha: A2 * pg * pdf * 0.7 });
          span(ctx, x2, x1, y, { color: C.hi, alpha: A2 * pg * pdf, progress: pdf });
          drawTex(ctx, fXd, (x1 + x2) / 2, y + 36, 30, { color: C.hi, alpha: A2 * pg * pdf });
        }
      }
      // the formula: written below the groups, then moves up
      const pf = prog(t, b.diff + 0.4, 1.2, ease.linear);
      if (pf > 0) {
        const up = prog(t, b.size - 0.2, 0.9, ease.inOut);
        const fy = lerp(616, 190, up);
        const pA = prog(t, b.t1, 0.9, ease.linear), pB = prog(t, b.t2, 0.9, ease.linear);
        drawTex(ctx, fVarD, 960, fy, 46, {
          alpha: A2,
          write: pf,
          writes: { ap: pA, a: pA, p: pB, b: pB },
          alphas: { sg: 0.55 * clamp(pf * 3), ap: clamp(pA * 3), a: clamp(pA * 3), p: clamp(pB * 3), b: clamp(pB * 3), '*': clamp(pf * 3) },
          colors: { sg: C.dim, a: G1, b: G2 },
        });
      }
      // the two terms as bars, then as their parts
      const pz = prog(t, b.size + 0.3, 0.9, ease.inOut);
      if (pz > 0) {
        const split = prog(t, b.notnu - 0.1, 1.0, ease.inOut);
        const y = 455, h = 44;
        const gap = GAP * split;
        const total = blocksS.reduce((p, [v]) => p + v * KX, 0) + gap * (blocksS.length - 1);
        let x = 960 - total / 2;
        const xs = [];
        blocksS.forEach(([v, col], i) => {
          const w = v * KX * pz;
          xs.push([x, x + v * KX]);
          if (w > 0.2) roundRect(ctx, x, y - h / 2, Math.max(w, 1), h, Math.min(5, w / 2), { fill: col, fillAlpha: 0.55, alpha: A2 * pz });
          x += v * KX + gap;
        });
        // labels: the two terms, then the counts of parts
        const pl = prog(t, b.size + 0.9, 0.6) * (1 - split);
        drawTex(ctx, fA1, (xs[0][0] + xs[3][1]) / 2, y + 70, 34, { color: G1, alpha: A2 * pl });
        drawTex(ctx, fA2, xs[4][0] + 50, y + 70, 34, { color: G2, alpha: A2 * pl, align: 'l' });
        const pc = prog(t, b.notnu + 0.8, 0.6);
        if (pc > 0) {
          text(ctx, '这个和：', xs[0][0] - 24, y, { size: 26, color: C.text, alpha: A2 * pc, align: 'right' });
          text(ctx, '4 个大的部分', (xs[0][0] + xs[3][1]) / 2, y + 62, { size: 24, color: G1, alpha: A2 * pc });
          text(ctx, '11 个小的部分', (xs[4][0] + xs[14][1]) / 2, y + 62, { size: 24, color: G2, alpha: A2 * pc });
        }
        // for comparison: one sample's s², ν equal parts
        const pr = prog(t, b.notnu + 0.2, 0.8);
        if (pr > 0) {
          const yr = 668, wr = (wS - 3 * GAP) / 4;
          const x0 = 960 - wS / 2;
          rich(ctx, ['一组数据的 ', fS2, '：'], x0 - 24, yr, { size: 26, color: C.text, alpha: A2 * pr, align: 'right' });
          for (let i = 0; i < 4; i++) roundRect(ctx, x0 + i * (wr + GAP), yr - h / 2, wr * pr, h, 5, { fill: C.s, fillAlpha: 0.45, alpha: A2 * pr });
          rich(ctx, [fNuI, ' 个同样大小的部分'], 960, yr + 62, { size: 24, color: C.s, alpha: A2 * pr });
        }
        const pq = prog(t, b.count, 0.6);
        if (pq > 0) {
          drawTex(ctx, fQ, 960 + wS / 2 + 40, y, 44, { color: C.hi, alpha: A2 * pq, align: 'l' });
          text(ctx, '4？15？', 960 + wS / 2 + 44, y + 52, { size: 24, color: C.dim, alpha: A2 * pq, align: 'left' });
        }
      }
    },
  });

  // =====================================================================
  // 8C  turn 2/ν around: solve for an equivalent ν
  // =====================================================================
  const c = {
    start: b.end,
    avg: A('在重复抽样中平均是 1'),
    var: A('方差是 2 除以纽'),
    ratio: A('方差除以平均的平方'),
    unit: A('这个比值不随单位改变'),
    eq: A('等于 2 除以纽'),
    inv: A('所以可以反过来做'),
    sumr: A('先算出这个和的方差与平均平方之比'),
    each: A('每一项的方差都按刚才的 2 除以纽来算'),
    set: A('再令比值等于 2 除以纽'),
    solve: A('解出一个等效的纽'),
    name: A('这就是韦尔奇'),
    end: A('比如第一组有 5 个数据'),
  };
  const fV = T(String.raw`\frac{V}{\nu}=\frac{z_1^2+z_2^2+\cdots+z_\nu^2}{\nu}`);
  const fMom = T(String.raw`\class{e}{E\Big[\frac{V}{\nu}\Big]=1}\qquad\class{v}{\mathrm{Var}\Big(\frac{V}{\nu}\Big)=\frac{2}{\nu}}`);
  const fRatio = T(String.raw`\frac{\text{方差}}{(\text{平均})^2}\class{q}{=\frac{2}{\nu}}`);
  const fUnit = T(String.raw`\frac{c^2\cdot\text{方差}}{(c\cdot\text{平均})^2}=\frac{\text{方差}}{(\text{平均})^2}`);
  const fInv = T(String.raw`\nu=\frac{2\,(\text{平均})^2}{\text{方差}}`);
  const fSdef = T(String.raw`S=\frac{s_1^2}{n_1}+\frac{s_2^2}{n_2},\qquad E[S]=\frac{\sigma_1^2}{n_1}+\frac{\sigma_2^2}{n_2}`);
  const fVarS = T(String.raw`\mathrm{Var}(S)=\class{a}{\frac{2}{n_1-1}\Big(\frac{\sigma_1^2}{n_1}\Big)^2}+\class{b}{\frac{2}{n_2-1}\Big(\frac{\sigma_2^2}{n_2}\Big)^2}`);
  const fEach = T(String.raw`\text{每一项：方差}=\frac{2}{\nu_i}\times(\text{平均})^2,\quad\nu_i=n_i-1`);
  const fSet = T(String.raw`\frac{\mathrm{Var}(S)}{(E[S])^2}=\frac{2}{\nu}`);
  const fNuSig = T(String.raw`\nu=\frac{\Big(\dfrac{\sigma_1^2}{n_1}+\dfrac{\sigma_2^2}{n_2}\Big)^2}{\dfrac{(\sigma_1^2/n_1)^2}{n_1-1}+\dfrac{(\sigma_2^2/n_2)^2}{n_2-1}}`);
  const fWS = T(String.raw`\nu\approx\frac{\Big(\dfrac{s_1^2}{n_1}+\dfrac{s_2^2}{n_2}\Big)^2}{\dfrac{(s_1^2/n_1)^2}{n_1-1}+\dfrac{(s_2^2/n_2)^2}{n_2-1}}`);
  const fSig = T(String.raw`\sigma`, { inline: true }), fS = T('s', { inline: true });
  // where the final formula sits: solved (8C), named (8C end), then at the top for the example (8D)
  const posSolve = { x: 1270, y: 742, size: 38 }, posName = { x: 960, y: 430, size: 54 }, posTop = { x: 960, y: 188, size: 36 };
  layers.push({
    t0: c.start - 0.6,
    t1: S.g1 + 1.0,
    draw(ctx, t) {
      const A3 = prog(t, c.start - 0.2, 0.8) * (1 - prog(t, S.g1 - 0.2, 0.8, ease.inOut));
      if (A3 <= 0) return;
      // phase 1: the ratio 2/ν and its inversion
      const P1 = A3 * (1 - prog(t, c.sumr - 0.6, 0.6, ease.inOut));
      if (P1 > 0) {
        rich(ctx, [fNuI, ' 个独立标准正态变量平方的平均'], 960, 118, { size: 28, color: C.soft, alpha: P1 * prog(t, c.start, 0.6) });
        const p0 = prog(t, c.start + 0.3, 1.2, ease.linear);
        drawTex(ctx, fV, 960, 212, 46, { alpha: P1 * clamp(p0 * 3), write: p0 });
        const pe = prog(t, c.avg, 0.9, ease.linear), pv = prog(t, c.var, 0.9, ease.linear);
        drawTex(ctx, fMom, 960, 345, 44, { alpha: P1, writes: { e: pe, v: pv }, alphas: { e: clamp(pe * 3), v: clamp(pv * 3) } });
        const pr = prog(t, c.ratio, 1.0, ease.linear), pq = prog(t, c.eq, 0.8, ease.linear);
        drawTex(ctx, fRatio, 700, 505, 48, { alpha: P1, write: pr, writes: { q: pq }, alphas: { '*': clamp(pr * 3), q: clamp(pq * 3) }, colors: { q: C.hi } });
        const pu = win(t, c.unit - 0.1, c.inv - 0.2, 0.6, 0.5);
        if (pu > 0) {
          rich(ctx, LB.unit, 1380, 430, { size: 24, color: C.dim, alpha: P1 * pu });
          drawTex(ctx, fUnit, 1380, 515, 40, { alpha: P1 * pu, color: C.soft });
        }
      }
      // the rule ν = 2(平均)²/方差: written in phase 1, kept at the top in phase 2
      const pi = prog(t, c.inv + 0.1, 1.0, ease.linear);
      if (pi > 0) {
        const mv = prog(t, c.sumr - 0.5, 0.9, ease.inOut);
        const out = prog(t, c.name - 0.6, 0.6);
        const x = lerp(1060, 960, mv), y = lerp(672, 120, mv), sz = lerp(50, 36, mv);
        const aI = A3 * (1 - out);
        drawTex(ctx, fInv, x, y, sz, { color: C.hi, alpha: aI * clamp(pi * 3), write: pi });
        text(ctx, '反过来：', x - 190, y, { size: 26, color: C.hi, alpha: aI * clamp(pi * 3) * (1 - mv), align: 'right' });
      }
      // phase 2: apply it to S = s₁²/n₁ + s₂²/n₂
      const P2 = A3 * prog(t, c.sumr - 0.2, 0.6) * (1 - prog(t, c.name - 0.6, 0.6, ease.inOut));
      if (P2 > 0) {
        const ps = prog(t, c.sumr, 1.2, ease.linear);
        drawTex(ctx, fSdef, 960, 270, 42, { alpha: P2 * clamp(ps * 3), write: ps });
        const pv = prog(t, c.each - 0.2, 1.4, ease.linear);
        if (pv > 0) drawTex(ctx, fVarS, 960, 420, 42, { alpha: P2 * clamp(pv * 3), write: pv, colors: { a: G1, b: G2 } });
        const pe = prog(t, c.each + 0.6, 0.6);
        if (pe > 0) drawTex(ctx, fEach, 960, 532, 30, { alpha: P2 * pe, color: C.dim });
        const pst = prog(t, c.set, 1.0, ease.linear);
        if (pst > 0) drawTex(ctx, fSet, 560, 742, 46, { alpha: P2 * clamp(pst * 3), write: pst });
        const pso = prog(t, c.solve - 0.2, 0.4);
        if (pso > 0) arrow(ctx, 742, 742, 830, 742, { color: C.hi, width: 2.5, head: 12, alpha: P2 * pso });
      }
      // the solved ν: written, then turned into the formula with s
      const pso = prog(t, c.solve, 1.4, ease.linear);
      if (pso > 0) {
        const pm = prog(t, c.name - 0.4, 1.4, ease.inOut);
        const pt = prog(t, c.end - 0.3, 1.0, ease.inOut);
        if (pm <= 0) drawTex(ctx, fNuSig, posSolve.x, posSolve.y, posSolve.size, { alpha: A3 * clamp(pso * 3), write: pso });
        else if (pt <= 0) drawTexMorph(ctx, fNuSig, posSolve, fWS, posName, pm, { alpha: A3 });
        else {
          const q = { x: lerp(posName.x, posTop.x, pt), y: lerp(posName.y, posTop.y, pt), size: lerp(posName.size, posTop.size, pt) };
          drawTex(ctx, fWS, q.x, q.y, q.size, { alpha: A3 });
        }
        const pn = prog(t, c.name + 0.2, 0.7) * (1 - prog(t, c.end - 0.3, 0.6));
        if (pn > 0) {
          text(ctx, '韦尔奇–萨特思韦特（Welch–Satterthwaite）自由度', 960, 612, { size: 32, color: C.hi, alpha: A3 * pn });
          rich(ctx, [fSig, ' 未知，用估计值 ', fS, ' 代入，所以是约等于'], 960, 670, { size: 24, color: C.dim, alpha: A3 * pn });
        }
      }
    },
  });

  // =====================================================================
  // 8D  the example: ν ≈ 4.86, and where it can lie
  // =====================================================================
  const d = {
    start: c.end,
    g2: A('第二组有 12 个数据'),
    res: A('算出的自由度约为 4.86'),
    mean: A('意思是这个方差估计的可靠程度'),
    like: A('大约相当于 4.86 个独立标准正态变量平方的平均'),
    thus: A('这样算出的自由度'),
    bound: A('总是介于'),
    end: S.g1,
  };
  const fEx1 = T(String.raw`n_1=5,\quad s_1^2=4`, { inline: true }), fEx2 = T(String.raw`n_2=12,\quad s_2^2=1`, { inline: true });
  const fSub = T(String.raw`\nu\approx\frac{\big(\frac{4}{5}+\frac{1}{12}\big)^2}{\frac{(4/5)^2}{4}+\frac{(1/12)^2}{11}}=\frac{0.7803}{0.1606}\approx\class{r}{4.86}`);
  const fRatioS = T(String.raw`S\,/\,E[S]`, { inline: true });
  const fLo = T(String.raw`\min(n_1-1,\,n_2-1)=4`, { inline: true }), fHi = T(String.raw`n_1+n_2-2=15`, { inline: true });
  const NU = 4.8576;
  const fZ2 = T('z^2', { inline: true });
  // repeated samples of S / E[S] when the true variances are 4 and 1
  const hist = (() => {
    const g = normalSampler(808), R = 200000, bw = 0.05, nb = 60, cnt = new Array(nb).fill(0);
    const a1 = 0.8, a2 = 1 / 12, m = a1 + a2;
    for (let r = 0; r < R; r++) {
      let q1 = 0, q2 = 0;
      for (let k = 0; k < 4; k++) q1 += g() ** 2;
      for (let k = 0; k < 11; k++) q2 += g() ** 2;
      const v = (a1 * (q1 / 4) + a2 * (q2 / 11)) / m;
      const i = Math.floor(v / bw);
      if (i < nb) cnt[i]++;
    }
    return cnt.map((c) => c / (R * bw));
  })();
  const PS = new Plot({ x: 170, y: 560, w: 720, h: 280, xr: [0, 3], yr: [0, 0.95] });
  const axN = new Axis({ x0: 1060, x1: 1780, y: 790, v0: 0, v1: 16 });
  layers.push({
    t0: d.start - 0.4,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A4 = prog(t, d.start - 0.2, 0.6) * (1 - prog(t, d.end - 0.2, 0.8, ease.inOut));
      if (A4 <= 0) return;
      // the example
      const p1 = prog(t, d.start + 0.2, 0.7), p2 = prog(t, d.g2, 0.7);
      rich(ctx, ['第一组：', fEx1], 170, 330, { size: 30, color: G1, alpha: A4 * p1, align: 'left' });
      rich(ctx, ['第二组：', fEx2], 170, 398, { size: 30, color: G2, alpha: A4 * p2, align: 'left' });
      const ps = prog(t, d.res - 0.4, 1.6, ease.linear);
      if (ps > 0) drawTex(ctx, fSub, 1240, 366, 40, { alpha: A4 * clamp(ps * 3), write: ps, colors: { r: C.hi } });
      // how reliable: the spread of S/E[S] over repeated samples, against 4.86 squared normals
      const ph = prog(t, d.mean - 0.2, 0.8);
      if (ph > 0) {
        const pa = A4 * ph;
        line(ctx, PS.x, PS.Y(0), PS.x + PS.w, PS.Y(0), { color: C.axis, width: 2, alpha: pa });
        for (const v of [0, 1, 2, 3]) num(ctx, String(v), PS.X(v), PS.Y(0) + 26, 22, { color: C.dim, alpha: pa });
        drawTex(ctx, fRatioS, PS.x + PS.w, PS.Y(0) + 58, 28, { color: C.soft, alpha: pa, align: 'r' });
        hist.forEach((h, i) => {
          const x0 = PS.X(i * 0.05) + 1, x1 = PS.X((i + 1) * 0.05) - 1;
          const y = PS.Y(h * clamp(ph * 1.4));
          ctx.fillStyle = rgba(C.s, 0.42 * pa);
          ctx.fillRect(x0, y, x1 - x0, PS.Y(0) - y);
        });
        line(ctx, PS.X(1), PS.Y(0), PS.X(1), PS.y, { color: C.sigma, width: 1.5, dash: [5, 6], alpha: pa * 0.7 });
        text(ctx, '重复抽样（20 万次）', PS.X(2.2), PS.Y(0.82), { size: 24, color: C.s, alpha: pa });
        const pc = prog(t, d.like, 1.2, ease.inOut);
        if (pc > 0) {
          poly(ctx, PS.curve((x) => scaledChi2Pdf(x, NU), 0.005, 3, 200), { color: C.hi, width: 3, alpha: A4 * pc, progress: pc });
          rich(ctx, ['4.86 个独立 ', fZ2, ' 的平均'], PS.X(2.2), PS.Y(0.66), { size: 24, color: C.hi, alpha: A4 * pc });
        }
      }
      // where ν can lie
      const pn = prog(t, d.thus - 0.2, 0.8);
      if (pn > 0) {
        const pa = A4 * pn;
        axN.draw(ctx, { alpha: pa, ticks: [0, 4, 8, 12, 16], labels: ['0', '4', '8', '12', '16'] });
        const pb = prog(t, d.bound + 0.3, 1.2, ease.inOut);
        if (pb > 0) {
          const xa = axN.X(4), xb = axN.X(15);
          ctx.fillStyle = rgba(C.hi, 0.12 * A4 * pb);
          ctx.fillRect(xa, axN.y - 16, (xb - xa) * pb, 32);
          line(ctx, xa, axN.y - 40, xa, axN.y + 14, { color: C.hi, width: 2, alpha: A4 * pb });
          line(ctx, xb, axN.y - 40, xb, axN.y + 14, { color: C.hi, width: 2, alpha: A4 * clamp(pb * 2 - 1) });
          drawTex(ctx, fLo, xa - 10, axN.y - 70, 26, { color: C.hi, alpha: A4 * pb, align: 'c' });
          drawTex(ctx, fHi, xb - 30, axN.y - 70, 26, { color: C.hi, alpha: A4 * clamp(pb * 2 - 1), align: 'c' });
        }
        const pd = prog(t, d.thus + 0.4, 0.6);
        dot(ctx, axN.X(NU), axN.y, 10, { color: C.hi, alpha: A4 * pd, glow: 0.7 });
        num(ctx, '4.86', axN.X(NU) + 6, axN.y + 66, 26, { color: C.hi, alpha: A4 * pd });
      }
    },
  });

  return { layers };
}
