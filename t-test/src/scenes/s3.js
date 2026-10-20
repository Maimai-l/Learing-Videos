// 三、多大的偏离才算少见：正态分布、标准化、5% 与 1.96
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, labelNum, line, arrow, dot, Axis, span, brace, braceTip, roundRect, rich, poly, fillPoly, panel } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, fmt, normPdf, normCdf } from '../engine/util.js';
import { DATA, MEAN, stackDots } from './common.js';

const T = (s, o) => tex(s, o);

// polygon under a normal curve between u0 and u1, for a mapping X(u) and height function
function areaPts(X, Y0, hfn, u0, u1, n = 90) {
  const pts = [[X(u0), Y0]];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    pts.push([X(u), Y0 - hfn(u)]);
  }
  pts.push([X(u1), Y0]);
  return pts;
}

export function build3(N) {
  const S = N.chapter(3);
  const { A } = S;
  const layers = [];

  // =====================================================================
  // 3A  the question as a probability; the normal assumption
  // =====================================================================
  const a = {
    start: S.first,
    q: A('如果新工艺无效，样本均值偏离 0 达到 1.1 或更远'),
    prob: A('概率有多大'),
    dist: A('要算这个概率，还得知道样本均值服从什么分布'),
    normal: A('我们假设每批数据都服从正态分布'),
    sym: A('这是一种左右对称'),
    mid: A('中间高'),
    sides: A('两边低'),
    mean: A('这样，样本均值也服从正态分布'),
    varr: A('方差就是刚才推出的西格玛平方除以 n'),
    end: A('均值为 0、标准差为 1 的正态分布'),
  };
  const gm = normalSampler(4242);
  const means = Array.from({ length: 600 }, () => { let s = 0; for (let k = 0; k < 5; k++) s += gm(); return s / 5; });
  const axM = new Axis({ x0: 330, x1: 1590, y: 820, v0: -2, v1: 2 });
  const BIN = 0.04;
  const stM = stackDots(means, BIN);
  const axD = new Axis({ x0: 330, x1: 1590, y: 420, v0: -4, v1: 4 });
  const fP = T(String.raw`P(\bar{x}\geq 1.1)=\ ?`);
  const fXbarN = T(String.raw`\bar{x}\sim N\!\left(\mu,\ \frac{\sigma^2}{n}\right)`);
  const fXN = T(String.raw`x\sim N(\mu,\ \sigma^2)`);
  const fX11 = T(String.raw`\bar{x}=1.1`, { inline: true });

  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.4, 0.8) * (1 - prog(t, a.end - 0.4, 0.8, ease.inOut));
      if (A1 <= 0) return;
      const ax = axM;
      ax.draw(ctx, { alpha: A1, ticks: [-2, -1, 0, 1, 2], labels: ['−2', '−1', '0', '1', '2'] });
      text(ctx, '样本均值', ax.x0 - 30, ax.y, { size: 28, color: C.xbar, alpha: A1, align: 'right' });
      // pile of sample means (no effect, n = 5)
      const d = BIN * ax.unit;
      const shade = prog(t, a.q + 1.2, 0.6);
      stM.forEach((sd, j) => {
        const pj = prog(t, a.start - 0.3 + (j / stM.length) * 1.6, 0.4);
        if (pj <= 0) return;
        const beyond = sd.v >= MEAN;
        dot(ctx, ax.X(sd.x), ax.y - 8 - d * 0.5 - sd.k * d, d * 0.42, { color: beyond && shade > 0 ? C.err : '#7E9CC4', alpha: A1 * pj * 0.85 });
      });
      // μ = 0 and the observed 1.1
      line(ctx, ax.X(0), ax.y + 12, ax.X(0), ax.y - 330, { color: C.mu, width: 2.5, alpha: A1 });
      const pq = prog(t, a.q + 0.2, 0.8);
      if (pq > 0) {
        const x = ax.X(MEAN);
        line(ctx, x, ax.y + 12, x, lerp(ax.y + 12, ax.y - 330, pq), { color: C.xbar, width: 3, alpha: A1 });
        drawTex(ctx, fX11, x + 14, ax.y - 312, 34, { color: C.xbar, alpha: A1 * pq, align: 'l' });
        // the region "1.1 or further"
        const g = ctx.createLinearGradient(0, ax.y, 0, ax.y - 330);
        g.addColorStop(0, rgba(C.err, 0.14 * A1 * shade));
        g.addColorStop(1, rgba(C.err, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x, ax.y - 330, ax.x1 - x, 330);
        arrow(ctx, x + 8, ax.y - 250, x + 180, ax.y - 250, { color: C.err, width: 2.5, alpha: A1 * shade });
        text(ctx, '1.1 或更远', x + 200, ax.y - 250, { size: 26, color: C.err, alpha: A1 * shade, align: 'left' });
      }
      const pp = prog(t, a.prob - 0.1, 0.9, ease.linear);
      if (pp > 0) drawTex(ctx, fP, 960, 190, 54, { alpha: A1 * clamp(pp * 3) * (1 - prog(t, a.normal - 0.4, 0.5)), write: pp });
      // which distribution? a dashed outline that is not known yet
      const pd = win(t, a.dist + 0.3, a.mean, 0.6, 0.5);
      if (pd > 0) text(ctx, '服从什么分布？', ax.X(-1.35), ax.y - 300, { size: 30, color: C.text, alpha: A1 * pd });
      // single data: the normal curve
      const pn = prog(t, a.normal, 1.2, ease.inOut);
      if (pn > 0) {
        const axd = axD;
        axd.draw(ctx, { alpha: A1 * pn, ticks: [-3, -2, -1, 0, 1, 2, 3], labels: ['−3σ', '−2σ', '−σ', 'μ', 'σ', '2σ', '3σ'].map(() => null) });
        text(ctx, '单个数据', axd.x0 - 30, axd.y, { size: 28, color: C.data, alpha: A1 * pn, align: 'right' });
        const hs = 560;
        const pts = [];
        for (let v = -4; v <= 4.0001; v += 0.02) pts.push([axd.X(v), axd.y - normPdf(v) * hs]);
        fillPoly(ctx, [[axd.X(-4), axd.y], ...pts, [axd.X(4), axd.y]], C.data, 0.07 * A1 * pn);
        poly(ctx, pts, { color: C.data, width: 3, alpha: A1, progress: pn });
        // symmetric, high in the middle, low on both sides
        const ps = prog(t, a.sym, 0.6);
        if (ps > 0) {
          line(ctx, axd.X(0), axd.y, axd.X(0), axd.y - 250, { color: C.soft, width: 1.5, dash: [5, 6], alpha: A1 * ps });
          arrow(ctx, axd.X(-0.9), axd.y - 110, axd.X(0.9), axd.y - 110, { color: C.soft, width: 2, both: true, head: 11, alpha: A1 * ps });
          text(ctx, '左右对称', axd.X(-1.3), axd.y - 110, { size: 26, color: C.soft, alpha: A1 * ps, align: 'right' });
        }
        const pmid = prog(t, a.mid, 0.5);
        text(ctx, '中间高', axd.X(0), axd.y - 262, { size: 26, color: C.text, alpha: A1 * pmid });
        const pside = prog(t, a.sides, 0.5);
        text(ctx, '两边低', axd.X(-2.6), axd.y - 50, { size: 26, color: C.text, alpha: A1 * pside });
        text(ctx, '两边低', axd.X(2.6), axd.y - 50, { size: 26, color: C.text, alpha: A1 * pside });
        drawTex(ctx, fXN, axd.X(2.5), axd.y - 200, 40, { color: C.data, alpha: A1 * prog(t, a.mid + 1.0, 0.6) });
      }
      // the mean is normal too, with variance σ²/n
      const pm = prog(t, a.mean, 1.2, ease.inOut);
      if (pm > 0) {
        // expected height of the dot pile: count per bin × dot size
        const pts = [];
        for (let v = -2; v <= 2.0001; v += 0.01) pts.push([ax.X(v), ax.y - 8 - normPdf(v, 0, 1 / Math.sqrt(5)) * means.length * BIN * d]);
        poly(ctx, pts, { color: C.xbar, width: 3, alpha: A1, progress: pm });
        const pv = prog(t, a.varr - 0.3, 0.9, ease.linear);
        drawTex(ctx, fXbarN, 560, 640, 44, { color: C.xbar, alpha: A1 * clamp(pv * 3), write: pv });
      }
    },
  });

  // =====================================================================
  // 3B  standard normal, and standardisation by relabelling the axis
  // =====================================================================
  const bb = {
    start: a.end,
    table: A('它的尾部面积有现成的表可查'),
    any: A('任何一个正态分布'),
    gtA: A('要求它大于 a 的概率'),
    shift: A('可以先平移横轴'),
    scale: A('再按 d 缩放'),
    words: A('这样，“比均值大多少”就变成了'),
    area: A('而曲线下的面积不会改变'),
    look: A('可以直接查标准正态分布的表'),
    name: A('这一步叫作标准化'),
    end: A('把标准化用到样本均值上'),
  };
  const Y0 = 760, U = 150, CX = 900; // standard units: x = CX + U·u
  const hN = (u) => normPdf(u) * 720; // curve height in px
  const fStd = T(String.raw`N(0,\,1)`);
  const fStdW = T(String.raw`P(X>a)=P\!\left(Z>\frac{a-m}{d}\right)`);
  const fZdef = T(String.raw`Z=\frac{X-m}{d}`);
  const fM = T('m', { inline: true }), fD = T('d', { inline: true }), fA = T('a', { inline: true });
  const fAm = T(String.raw`\frac{a-m}{d}`, { inline: true });
  const fAmm = T(String.raw`a-m`, { inline: true });
  const tableRows = [[1.0, 0.1587], [1.5, 0.0668], [2.0, 0.0228], [2.5, 0.0062]];
  const fZhead = T('z', { inline: true });
  const M0 = 3, D0 = 2, A0 = 6; // worked example: (6 − 3)/2 = 1.5
  layers.push({
    t0: bb.start - 0.5,
    t1: bb.end + 1.0,
    draw(ctx, t) {
      const A2 = prog(t, bb.start - 0.2, 0.8) * (1 - prog(t, bb.end - 0.2, 0.8, ease.inOut));
      if (A2 <= 0) return;
      // curve (never moves)
      const pc = prog(t, bb.start, 1.2, ease.inOut);
      const X = (u) => CX + U * u;
      const pts = [];
      for (let u = -3.6; u <= 3.6001; u += 0.02) pts.push([X(u), Y0 - hN(u)]);
      const general = prog(t, bb.any - 0.1, 0.8);
      const ccol = general > 0 ? C.data : C.normal;
      line(ctx, X(-3.8), Y0, X(3.8), Y0, { color: C.axis, width: 2.5, alpha: A2 });
      poly(ctx, pts, { color: ccol, width: 3, alpha: A2, progress: pc });
      // tail beyond 1.5 standard units (= a in the example)
      const pt = prog(t, bb.table - 0.2, 0.8);
      fillPoly(ctx, areaPts(X, Y0, hN, 1.5, 3.6), C.err, 0.35 * A2 * pt);
      // The axis is a ruler. Standard labels first; then the example's own units
      // (m = 3 under the centre); "shift" slides the ruler right by m so its 0 sits
      // under the centre; "scale" stretches it by d around 0. The curve never moves.
      const pS = prog(t, bb.shift + 0.2, 1.4, ease.inOut);
      const pK = prog(t, bb.scale + 0.1, 1.4, ease.inOut);
      const stdA = A2 * (1 - general) * pc;
      const genA = A2 * general;
      for (let u = -3; u <= 3; u++) {
        if (stdA <= 0) break;
        line(ctx, X(u), Y0 - 6, X(u), Y0 + 6, { color: C.axis, width: 2, alpha: stdA });
        num(ctx, fmt(u, 0), X(u), Y0 + 32, 26, { color: C.dim, alpha: stdA });
      }
      const markX = (v) => {
        const unit = lerp(U / D0, U, pK); // px per ruler unit
        const off = lerp(-M0, 0, pS); // ruler value under the centre is −off
        return CX + unit * (v + off);
      };
      if (genA > 0) {
        for (let v = -4; v <= 9; v++) {
          const x = markX(v);
          if (x < X(-3.8) - 1 || x > X(3.8) + 1) continue;
          line(ctx, x, Y0 - 6, x, Y0 + 6, { color: C.axis, width: 2, alpha: genA });
          num(ctx, fmt(v, 0), x, Y0 + 32, 24, { color: C.dim, alpha: genA });
        }
      }
      // m, d, a and how their labels change
      const pl = prog(t, bb.any + 0.6, 0.6) * general;
      if (pl > 0) {
        line(ctx, X(0), Y0, X(0), Y0 - hN(0), { color: C.soft, width: 1.5, dash: [5, 6], alpha: A2 * pl });
        rich(ctx, [fM, '（例：3）'], X(0), Y0 - hN(0) - 34, { size: 26, color: C.text, alpha: A2 * pl * (1 - pS) });
        const pd = prog(t, bb.any + 1.4, 0.6);
        if (pd > 0) {
          const yb = Y0 - hN(1) - 16;
          span(ctx, X(0), X(1), yb, { color: C.soft, alpha: A2 * pd * pl });
          rich(ctx, [fD, '（例：2）'], X(0.5), yb - 30, { size: 26, color: C.text, alpha: A2 * pd * pl * (1 - pK) });
          text(ctx, '1', X(0.5), yb - 30, { size: 28, color: C.text, alpha: A2 * pd * pl * pK });
        }
        const pa = prog(t, bb.gtA, 0.6);
        if (pa > 0) {
          const xa = X(1.5), ya = Y0 - hN(1.5) - 92;
          line(ctx, xa, Y0 + 8, xa, Y0 - hN(1.5) - 64, { color: C.err, width: 2.5, alpha: A2 * pa });
          const s1 = clamp(1 - pS * 2), s2 = clamp(pS * 2 - 1) * (1 - clamp(pK * 2)), s3 = clamp(pK * 2 - 1);
          if (s1 > 0) rich(ctx, [fA, '（例：6）'], xa + 14, ya, { size: 26, color: C.err, alpha: A2 * pa * s1, align: 'left' });
          if (s2 > 0) rich(ctx, [fAmm, '（例：3）'], xa + 14, ya, { size: 26, color: C.err, alpha: A2 * pa * s2, align: 'left' });
          if (s3 > 0) rich(ctx, [fAm, '（例：1.5）'], xa + 14, ya, { size: 26, color: C.err, alpha: A2 * pa * s3, align: 'left' });
        }
      }
      // the standard normal's name and the table
      const pn = prog(t, bb.start + 0.6, 0.6);
      drawTex(ctx, fStd, X(-2.6), Y0 - 330, 44, { color: C.normal, alpha: A2 * pn * (1 - general) });
      text(ctx, '标准正态分布', X(-2.6), Y0 - 390, { size: 28, color: C.normal, alpha: A2 * pn * (1 - general) });
      const ptab = prog(t, bb.table, 0.7);
      if (ptab > 0) {
        const tx = 1470, ty = 300, rw = 340, rh = 52;
        panel(ctx, tx, ty, rw, rh * (tableRows.length + 1) + 20, { alpha: A2 * ptab });
        drawTex(ctx, fZhead, tx + 70, ty + 36, 30, { alpha: A2 * ptab, color: C.dim });
        text(ctx, '右侧尾部面积', tx + 230, ty + 36, { size: 22, color: C.dim, alpha: A2 * ptab });
        const look = win(t, bb.look - 0.1, bb.end, 0.4, 0.5);
        tableRows.forEach(([z, p], i) => {
          const y = ty + 36 + (i + 1) * rh;
          const hi = z === 1.5 ? Math.max(look, (1 - general) * prog(t, bb.table + 0.6, 0.5)) : 0;
          if (hi > 0) roundRect(ctx, tx + 10, y - 22, rw - 20, 44, 8, { fill: C.err, fillAlpha: 0.18 * hi, alpha: A2 * ptab });
          num(ctx, z.toFixed(1), tx + 70, y, 26, { color: C.text, alpha: A2 * ptab });
          num(ctx, p.toFixed(4), tx + 230, y, 26, { color: z === 1.5 ? C.err : C.text, alpha: A2 * ptab });
        });
      }
      // area readout (constant through the relabelling)
      const pr = prog(t, bb.gtA + 0.5, 0.6);
      if (pr > 0) {
        const x = X(2.3), y = Y0 - 70;
        labelNum(ctx, '面积', '0.0668', x + 40, y - 30, { size: 26, color: C.err, alpha: A2 * pr });
        const pArea = win(t, bb.area, bb.look + 0.3, 0.3, 0.5);
        if (pArea > 0) roundRect(ctx, x - 50, y - 54, 182, 48, 10, { stroke: C.err, width: 2, alpha: A2 * pArea });
      }
      // words: "how much above the mean" -> "how many standard deviations above"
      const pw = prog(t, bb.words, 0.6) * (1 - prog(t, bb.name - 0.3, 0.5));
      if (pw > 0) {
        const qq = prog(t, bb.words + 2.2, 0.8, ease.inOut);
        text(ctx, '比均值大 3', 960, 300, { size: 36, color: C.text, alpha: A2 * pw * (1 - qq) });
        text(ctx, '比均值大 1.5 个标准差', 960, 300, { size: 36, color: C.text, alpha: A2 * pw * qq });
      }
      // the general rule
      const pz = prog(t, bb.name - 0.2, 1.3, ease.linear);
      if (pz > 0) {
        drawTex(ctx, fStdW, 900, 210, 50, { alpha: A2 * clamp(pz * 3), write: pz });
        const pnm = prog(t, bb.name + 0.4, 0.6);
        text(ctx, '标准化', 900, 310, { size: 30, color: C.hi, alpha: A2 * pnm });
      }
    },
  });


  // =====================================================================
  // 3C  apply it to the sample mean: z; both directions
  // 3D  how small is small: 5% -> 1.96; null hypothesis; p-value
  // =====================================================================
  const c = {
    start: bb.end,
    mu0: A('假设的真实均值记作缪零'),
    sd: A('标准差是西格玛除以根号 5'),
    a: A('a 是观测到的 1.1'),
    z: A('代进去，就得到 z'),
    two: A('偏离可能朝两个方向'),
    both: A('所以要看的是两侧尾部合起来的面积'),
  };
  const d = {
    start: A('这个面积小到什么程度才算证据'),
    std: A('需要事先约定一个标准'),
    five: A('最常用的是 5%'),
    cond: A('如果在新工艺无效的前提下'),
    lt5: A('出现这么大偏离的概率不到 5%'),
    sig: A('判定结果显著'),
    on: A('在标准正态分布上，两侧尾部合计占 5% 时'),
    c196: A('界限正好是正负 1.96'),
    so: A('所以，z 大于 1.96 或小于负 1.96'),
    eq: A('就等于说这个概率不到 5%'),
    h0: A('叫作原假设'),
    pv: A('算出的两侧面积，叫作 p 值'),
    end: A('不过，这个计算需要用到单批数据的标准差'),
  };
  const F0 = T(String.raw`\frac{\class{a}{a}-\class{m}{m}}{\class{d}{d}}`);
  const F1 = T(String.raw`\frac{\class{a}{a}-\class{m}{\mu_0}}{\class{d}{d}}`);
  const F2 = T(String.raw`\frac{\class{a}{a}-\class{m}{\mu_0}}{\class{d}{\sigma/\sqrt{5}}}`);
  const F3 = T(String.raw`\frac{\class{a}{1.1}-\class{m}{\mu_0}}{\class{d}{\sigma/\sqrt{5}}}`);
  const F4 = T(String.raw`z=\frac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}=\frac{\class{a}{1.1}-\class{m}{0}}{\class{d}{\sigma/\sqrt{5}}}`);
  const subs = [
    [T(String.raw`m\ \to\ \mu_0=0`, { inline: true }), '假设的真实均值', () => c.mu0],
    [T(String.raw`d\ \to\ \sigma/\sqrt{5}`, { inline: true }), '样本均值的标准差', () => c.sd],
    [T(String.raw`a\ \to\ 1.1`, { inline: true }), '观测到的样本均值', () => c.a],
  ];
  const fZ = T('z', { inline: true }), fmZ = T('-z', { inline: true });
  const fPabs = T(String.raw`P(|Z|\geq|z|)`, { inline: true });
  const fRule = T(String.raw`|z|>1.96\iff P<5\%`);
  const f196 = T('1.96', { inline: true }), fm196 = T('-1.96', { inline: true });
  const Y1 = 870, U1 = 140, CX1 = 960;
  const X1 = (u) => CX1 + U1 * u;
  const h1 = (u) => normPdf(u) * 560;
  const ZILL = 2.15; // an illustrative |z| (σ is not known yet)
  const fMuNull = T(String.raw`\mu=\mu_0=0`, { inline: true });
  layers.push({
    t0: c.start - 0.5,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A3 = prog(t, c.start - 0.2, 0.8) * (1 - prog(t, d.end - 0.7, 0.6, ease.inOut));
      if (A3 <= 0) return;
      // ---------- formula: substitute into (a − m)/d ----------
      const fA = A3 * (1 - prog(t, d.start - 0.4, 0.6));
      if (fA > 0) {
        const P = { x: 560, y: 300, size: 64 };
        const cols = { a: C.xbar, m: C.mu, d: C.sigma };
        const s1 = prog(t, c.mu0 + 0.2, 0.8), s2 = prog(t, c.sd + 0.2, 0.8), s3 = prog(t, c.a + 0.2, 0.8), s4 = prog(t, c.z, 1.0);
        const P4 = { x: 700, y: 300, size: 58 };
        if (s1 <= 0) drawTex(ctx, F0, P.x, P.y, P.size, { alpha: fA, write: prog(t, c.start, 0.8, ease.linear), colors: cols });
        else if (s2 <= 0) drawTexMorph(ctx, F0, P, F1, P, s1, { alpha: fA, colorsA: cols, colorsB: cols, map: { m: 'm' } });
        else if (s3 <= 0) drawTexMorph(ctx, F1, P, F2, P, s2, { alpha: fA, colorsA: cols, colorsB: cols, map: { d: 'd' } });
        else if (s4 <= 0) drawTexMorph(ctx, F2, P, F3, P, s3, { alpha: fA, colorsA: cols, colorsB: cols, map: { a: 'a' } });
        else drawTexMorph(ctx, F3, P, F4, P4, s4, { alpha: fA, colorsA: cols, colorsB: cols });
        // what each letter becomes
        subs.forEach(([f, words, tt], i) => {
          const ps = prog(t, tt(), 0.6) * (1 - prog(t, c.two - 0.3, 0.6));
          if (ps <= 0) return;
          const y = 220 + i * 66;
          drawTex(ctx, f, 1180, y, 36, { align: 'l', alpha: fA * ps, colors: {} });
          text(ctx, words, 1480, y, { size: 24, color: C.dim, alpha: fA * ps, align: 'left' });
        });
      }
      // ---------- the standard normal curve ----------
      const pc = prog(t, c.two - 0.6, 1.0, ease.inOut);
      if (pc <= 0) return;
      const pts = [];
      for (let u = -3.6; u <= 3.6001; u += 0.02) pts.push([X1(u), Y1 - h1(u)]);
      line(ctx, X1(-3.8), Y1, X1(3.8), Y1, { color: C.axis, width: 2.5, alpha: A3 * pc });
      for (let u = -3; u <= 3; u++) {
        line(ctx, X1(u), Y1 - 6, X1(u), Y1 + 6, { color: C.axis, width: 2, alpha: A3 * pc });
        num(ctx, fmt(u, 0), X1(u), Y1 + 30, 22, { color: C.dim, alpha: A3 * pc * (1 - win(t, d.on, d.end, 0.4, 0.4) * 0.6) });
      }
      poly(ctx, pts, { color: C.normal, width: 3, alpha: A3, progress: pc });
      // both directions
      const pt = prog(t, c.two + 0.4, 0.7);
      const zs = 1 - prog(t, d.start - 0.2, 0.6) * (1 - win(t, d.pv - 0.2, d.end, 0.5, 0.5)); // z marks visible
      if (pt > 0) {
        arrow(ctx, X1(0), Y1 - 60, X1(1.6), Y1 - 60, { color: C.text, width: 2.5, head: 12, alpha: A3 * pt * zs * (1 - prog(t, c.both + 0.5, 0.5)) });
        arrow(ctx, X1(0), Y1 - 60, X1(-1.6), Y1 - 60, { color: C.text, width: 2.5, head: 12, alpha: A3 * pt * zs * (1 - prog(t, c.both + 0.5, 0.5)) });
        line(ctx, X1(ZILL), Y1 + 8, X1(ZILL), Y1 - h1(ZILL) - 70, { color: C.xbar, width: 2.5, alpha: A3 * pt * zs });
        drawTex(ctx, fZ, X1(ZILL), Y1 - h1(ZILL) - 92, 34, { color: C.xbar, alpha: A3 * pt * zs });
      }
      const pb = prog(t, c.both, 0.7);
      if (pb > 0) {
        line(ctx, X1(-ZILL), Y1 + 8, X1(-ZILL), Y1 - h1(ZILL) - 70, { color: C.xbar, width: 2.5, alpha: A3 * pb * zs });
        drawTex(ctx, fmZ, X1(-ZILL), Y1 - h1(ZILL) - 92, 34, { color: C.xbar, alpha: A3 * pb * zs });
        fillPoly(ctx, areaPts(X1, Y1, h1, ZILL, 3.6), C.err, 0.45 * A3 * pb * zs);
        fillPoly(ctx, areaPts(X1, Y1, h1, -3.6, -ZILL), C.err, 0.45 * A3 * pb * zs);
        drawTex(ctx, fPabs, X1(2.95), Y1 - 120, 34, { color: C.err, alpha: A3 * pb * zs });
      }
      // ---------- the 5% convention ----------
      const p5 = prog(t, d.five, 0.6);
      const ruleA = A3 * (1 - prog(t, d.on - 0.4, 0.6));
      if (p5 > 0 && ruleA > 0) {
        text(ctx, '事先约定的标准', 960, 200, { size: 28, color: C.dim, alpha: ruleA * p5 });
        text(ctx, '5%', 960, 268, { size: 72, weight: 500, color: C.hi, alpha: ruleA * p5 });
        const pr = prog(t, d.cond, 0.6);
        text(ctx, '新工艺无效时，出现这么大偏离的概率', 760, 390, { size: 30, color: C.text, alpha: ruleA * pr });
        text(ctx, '< 5%', 1120, 390, { size: 30, color: C.hi, alpha: ruleA * prog(t, d.lt5 + 0.5, 0.5), align: 'left' });
        const ps = prog(t, d.sig - 0.6, 0.6);
        arrow(ctx, 960, 430, 960, 478, { color: C.soft, width: 2.5, alpha: ruleA * ps });
        text(ctx, '不太可能只是巧合：判定“显著”', 960, 515, { size: 30, color: C.text, alpha: ruleA * ps });
      }
      // ---------- find the boundary that leaves 5% in the two tails ----------
      const pf = prog(t, d.on - 0.1, 0.6);
      if (pf > 0) {
        const sweep = prog(t, d.on + 0.6, 2.6, ease.inOut);
        const cB = lerp(3.3, 1.96, sweep);
        const tail = 2 * (1 - normCdf(cB));
        const shadeA = A3 * pf;
        fillPoly(ctx, areaPts(X1, Y1, h1, cB, 3.6), C.hi, 0.42 * shadeA);
        fillPoly(ctx, areaPts(X1, Y1, h1, -3.6, -cB), C.hi, 0.42 * shadeA);
        line(ctx, X1(cB), Y1 + 8, X1(cB), Y1 - 260, { color: C.hi, width: 2.5, alpha: shadeA });
        line(ctx, X1(-cB), Y1 + 8, X1(-cB), Y1 - 260, { color: C.hi, width: 2.5, alpha: shadeA });
        labelNum(ctx, '两侧合计', (tail * 100).toFixed(1) + '%', 960, 520, { size: 34, color: C.hi, alpha: shadeA * (1 - prog(t, d.so - 0.3, 0.5)) });
        const pl = prog(t, d.c196, 0.5);
        if (pl > 0) {
          drawTex(ctx, f196, X1(1.96), Y1 - 288, 36, { color: C.hi, alpha: shadeA * pl });
          drawTex(ctx, fm196, X1(-1.96), Y1 - 288, 36, { color: C.hi, alpha: shadeA * pl });
        }
        const pr = prog(t, d.so, 1.0, ease.linear);
        if (pr > 0) drawTex(ctx, fRule, 960, 470, 50, { alpha: shadeA * clamp(pr * 3), write: pr });
        // names
        const ph = prog(t, d.h0, 0.6);
        if (ph > 0) {
          text(ctx, '原假设：新工艺无效', 960, 250, { size: 32, color: C.mu, alpha: shadeA * ph });
          drawTex(ctx, fMuNull, 960, 300, 34, { color: C.mu, alpha: shadeA * ph });
        }
        const pp = prog(t, d.pv, 0.6);
        if (pp > 0) {
          text(ctx, 'p 值 = 两侧面积', 960, 360, { size: 32, color: C.err, alpha: shadeA * pp });
          fillPoly(ctx, areaPts(X1, Y1, h1, ZILL, 3.6), C.err, 0.5 * shadeA * pp);
          fillPoly(ctx, areaPts(X1, Y1, h1, -3.6, -ZILL), C.err, 0.5 * shadeA * pp);
        }
      }
    },
  });

  // =====================================================================
  // 3E  but σ is not known
  // =====================================================================
  const e = {
    start: d.end,
    hard: A('我们通常很难直接得到西格玛的值'),
    five: A('手上只有这五个数'),
    est: A('西格玛也只能从它们本身估计出来'),
    end: S.g1,
  };
  const FZs = T(String.raw`z=\frac{1.1-0}{\class{s}{\sigma}/\sqrt{5}}`);
  const FZq = T(String.raw`z=\frac{1.1-0}{\class{s}{?}/\sqrt{5}}`);
  const axE = new Axis({ x0: 420, x1: 1500, y: 760, v0: -1, v1: 3 });
  const fSigma = T(String.raw`\sigma`, { inline: true });
  layers.push({
    t0: e.start - 0.5,
    t1: e.end + 1.2,
    draw(ctx, t) {
      const A4 = prog(t, e.start - 0.05, 0.6) * (1 - prog(t, e.end + 0.1, 0.9, ease.inOut));
      if (A4 <= 0) return;
      const P = { x: 960, y: 330, size: 66 };
      const hiS = win(t, e.start + 1.2, e.end, 0.4, 0.4);
      const q = prog(t, e.hard + 0.6, 0.8, ease.inOut);
      const flick = q > 0 && q < 1 ? 0.5 + 0.5 * Math.sin(t * 40) : 1;
      if (q <= 0) drawTex(ctx, FZs, P.x, P.y, P.size, { alpha: A4, colors: { s: hiS > 0 ? C.sigma : C.text }, scale: { s: 1 + 0.15 * hiS } });
      else drawTexMorph(ctx, FZs, P, FZq, P, q, { alpha: A4 * flick, colorsA: { s: C.sigma }, colorsB: { s: C.hi }, map: { s: 's' } });
      // only five numbers in hand
      const pf = prog(t, e.five, 0.7);
      if (pf > 0) {
        axE.draw(ctx, { alpha: A4 * pf, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
        DATA.forEach((v, i) => {
          const pd = prog(t, e.five + 0.1 + i * 0.1, 0.4, ease.out);
          dot(ctx, axE.X(v), axE.y, 9, { color: C.data, alpha: A4 * pd, glow: 0.6 });
          num(ctx, fmt(v, 1), axE.X(v), axE.y - 34, 24, { color: C.data, alpha: A4 * pd });
        });
        const pe = prog(t, e.est, 0.8, ease.inOut);
        if (pe > 0) {
          const b = FZq.box(P.x, P.y, P.size, 'c', 'm', 's');
          arrow(ctx, axE.X(1.1), axE.y - 70, b.cx + 6, b.y1 + 30, { color: C.sigma, width: 2.5, alpha: A4 * pe, progress: pe });
          rich(ctx, ['用这五个数估计 ', fSigma], axE.X(1.1) + 60, axE.y - 150, { size: 28, color: C.sigma, alpha: A4 * prog(t, e.est + 0.6, 0.5), align: 'left' });
        }
      }
    },
  });

  return { layers };
}
