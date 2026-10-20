// 七、t 分布
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, labelNum, line, arrow, dot, Axis, Plot, span, brace, braceTip, roundRect, rich, poly, fillPoly, panel } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, rng, normalSampler, fmt, normPdf, normCdf, chi2Pdf, scaledChi2Pdf, tPdf, mixColor } from '../engine/util.js';
import { drawGrid, cellCenter } from './common.js';

const T = (s, o) => tex(s, o);

export function build7(N) {
  const S = N.chapter(7);
  const { A } = S;
  const layers = [];
  const fSig = T(String.raw`\sigma^2`, { inline: true }), fZero = T('0', { inline: true }), fMSig = T(String.raw`-\sigma^2`, { inline: true });

  // =====================================================================
  // 7A  the gap and the sum are uncorrelated
  // =====================================================================
  const a = {
    start: S.first,
    gaps: A('它的作用体现在间距上'),
    ex: A('以两个数据为例'),
    gapE: A('间距里的误差是'),
    sumE: A('两数之和里的误差是'),
    mult: A('两者相乘，再在重复抽样中求平均'),
    zero: A('结果是西格玛平方减西格玛平方，等于 0'),
    unc: A('乘积平均为 0，叫作不相关'),
    end: A('不相关，并不等于互不影响'),
  };
  const fGapE = T(String.raw`x_1-x_2=\class{g}{\varepsilon_1-\varepsilon_2}`);
  const fSumE = T(String.raw`x_1+x_2=2\mu+\class{h}{\varepsilon_1+\varepsilon_2}`);
  const fProd = T(String.raw`E\big[(\class{g}{\varepsilon_1-\varepsilon_2})(\class{h}{\varepsilon_1+\varepsilon_2})\big]=E[\varepsilon_1^2]-E[\varepsilon_2^2]=\class{s}{\sigma^2}-\class{s}{\sigma^2}=0`);
  const rowL = [T(String.raw`\varepsilon_1`, { inline: true }), T(String.raw`-\varepsilon_2`, { inline: true })];
  const colL = [T(String.raw`\varepsilon_1`, { inline: true }), T(String.raw`\varepsilon_2`, { inline: true })];
  const cellT = [[T(String.raw`\varepsilon_1^2`, { inline: true }), T(String.raw`\varepsilon_1\varepsilon_2`, { inline: true })], [T(String.raw`-\varepsilon_2\varepsilon_1`, { inline: true }), T(String.raw`-\varepsilon_2^2`, { inline: true })]];
  const cellAvg = [[fSig, fZero], [fZero, fMSig]];
  const G = { x: 1180, y: 430, n: 2, cell: 170 };
  const axTwo = new Axis({ x0: 460, x1: 1460, y: 720, v0: -1.2, v1: 3.2 });
  const fX1 = T('x_1', { inline: true }), fX2 = T('x_2', { inline: true });
  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.4, 0.8) * (1 - prog(t, a.end - 0.3, 0.8, ease.inOut));
      if (A1 <= 0) return;
      text(ctx, '正态分布的作用，体现在间距上', 960, 200, { size: 34, alpha: A1 * prog(t, a.start + 0.3, 0.7) * (1 - prog(t, a.ex - 0.3, 0.5)) });
      // two observations: their gap and their sum
      const pw = prog(t, a.gaps - 0.2, 0.7) * (1 - prog(t, a.mult - 0.4, 0.6));
      if (pw > 0) {
        const ax = axTwo;
        ax.draw(ctx, { alpha: A1 * pw, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
        [[1.8, fX1], [-0.2, fX2]].forEach(([x, f]) => {
          dot(ctx, ax.X(x), ax.y, 9, { color: C.data, alpha: A1 * pw, glow: 0.5 });
          drawTex(ctx, f, ax.X(x), ax.y + 46, 30, { color: C.data, alpha: A1 * pw });
        });
        span(ctx, ax.X(-0.2), ax.X(1.8), ax.y - 60, { color: C.dev, alpha: A1 * pw });
        text(ctx, '间距', ax.X(0.8), ax.y - 92, { size: 26, color: C.dev, alpha: A1 * pw });
      }
      const pg = prog(t, a.gapE, 1.0, ease.linear), ps = prog(t, a.sumE, 1.0, ease.linear);
      drawTex(ctx, fGapE, 560, 300, 50, { alpha: A1 * clamp(pg * 3), write: pg, colors: { g: C.dev } });
      drawTex(ctx, fSumE, 560, 400, 50, { alpha: A1 * clamp(ps * 3), write: ps, colors: { h: C.xbar } });
      text(ctx, '间距', 240, 300, { size: 28, color: C.dev, alpha: A1 * clamp(pg * 3), align: 'right' });
      text(ctx, '两数之和', 240, 400, { size: 28, color: C.xbar, alpha: A1 * clamp(ps * 3), align: 'right' });
      // grid of the product
      const pgr = prog(t, a.mult, 0.8);
      if (pgr > 0) {
        const pav = prog(t, a.zero - 0.4, 0.7);
        drawGrid(ctx, G, { alpha: A1 * pgr, lines: pgr, fill: (i, j) => (i === j ? [i === 0 ? C.sigma : C.neg, 0.15 * pav] : ['#7E9CC4', 0.05 * pav]) });
        for (let i = 0; i < 2; i++) {
          drawTex(ctx, rowL[i], G.x - 26, G.y + (i + 0.5) * G.cell, 34, { color: C.dev, alpha: A1 * pgr, align: 'r' });
          drawTex(ctx, colL[i], G.x + (i + 0.5) * G.cell, G.y - 30, 34, { color: C.xbar, alpha: A1 * pgr });
          for (let j = 0; j < 2; j++) {
            const [cx, cy] = cellCenter(G, i, j);
            drawTex(ctx, cellT[i][j], cx, cy - 22 * pav, 34, { alpha: A1 * prog(t, a.mult + 0.3 + (i * 2 + j) * 0.12, 0.4) });
            if (pav > 0) drawTex(ctx, cellAvg[i][j], cx, cy + 34, 30, { color: i === j ? (i === 0 ? C.sigma : C.neg) : C.dim, alpha: A1 * pav });
          }
        }
      }
      const pp = prog(t, a.zero - 0.2, 1.6, ease.linear);
      if (pp > 0) drawTex(ctx, fProd, 820, 820, 44, { alpha: A1 * clamp(pp * 3), write: pp, colors: { g: C.dev, h: C.xbar, s: C.sigma } });
      const pu = prog(t, a.unc, 0.6);
      if (pu > 0) text(ctx, '乘积平均为 0：不相关', 820, 900, { size: 32, color: C.hi, alpha: A1 * pu });
    },
  });

  // =====================================================================
  // 7B  uncorrelated is not independent (uniform); for normal data it is
  // =====================================================================
  const b = {
    start: a.end,
    right: A('看右边这幅图'),
    near2: A('如果两数之和接近 2'),
    gap0: A('间距只能接近 0'),
    depends: A('间距能取多大，取决于和是多少'),
    left: A('左边的正态数据就不一样'),
    same: A('不管和是多少，间距的分布都一样'),
    rule: A('相互独立的正态数据，经过加减组合得到的几个量'),
    only: A('这是正态分布特有的性质'),
    end: A('由此可以得到两个结论'),
  };
  const NPT = 900;
  const ru = rng(77), gn = normalSampler(78);
  const uni = Array.from({ length: NPT }, () => { const x1 = ru() * 2 - 1, x2 = ru() * 2 - 1; return [x1 + x2, x1 - x2]; });
  const nor = Array.from({ length: NPT }, () => { const x1 = 0.62 * gn(), x2 = 0.62 * gn(); return [x1 + x2, x1 - x2]; });
  const panels = [
    { cx: 540, cy: 560, pts: nor, name: '正态数据', col: C.normal },
    { cx: 1380, cy: 560, pts: uni, name: '均匀分布的数据（−1 到 1）', col: C.err },
  ];
  const UNIT = 140;
  const fSumAx = T(String.raw`x_1+x_2`, { inline: true }), fGapAx = T(String.raw`x_1-x_2`, { inline: true });
  layers.push({
    t0: b.start - 0.6,
    t1: b.end + 1.0,
    draw(ctx, t) {
      const A2 = prog(t, b.start - 0.2, 0.8) * (1 - prog(t, b.end - 0.3, 0.8, ease.inOut));
      if (A2 <= 0) return;
      const ruleIn = prog(t, b.rule - 0.4, 0.5);
      text(ctx, '不相关 ≠ 互不影响', 960, 150, { size: 36, color: C.text, alpha: A2 * prog(t, b.start, 0.6) * (1 - ruleIn) });
      // rotate (x1, x2) into (sum, gap): the square becomes a diamond, the circle stays round
      const rot = prog(t, b.start + 0.8, 1.6, ease.inOut);
      const th = (-Math.PI / 4) * (1 - rot), sc = lerp(1 / Math.SQRT2, 1, rot);
      panels.forEach((P, k) => {
        const pa = A2 * (k === 1 ? 1 : 1);
        // axes
        line(ctx, P.cx - 2.6 * UNIT, P.cy, P.cx + 2.6 * UNIT, P.cy, { color: C.axis, width: 2, alpha: pa * 0.8 });
        line(ctx, P.cx, P.cy + 2.6 * UNIT, P.cx, P.cy - 2.6 * UNIT, { color: C.axis, width: 2, alpha: pa * 0.8 });
        drawTex(ctx, fSumAx, P.cx + 2.6 * UNIT - 10, P.cy + 34, 28, { color: C.xbar, alpha: pa * rot, align: 'r' });
        drawTex(ctx, fGapAx, P.cx + 16, P.cy - 2.6 * UNIT + 10, 28, { color: C.dev, alpha: pa * rot, align: 'l' });
        text(ctx, P.name, P.cx, P.cy - 2.6 * UNIT - 40, { size: 28, color: P.col, alpha: pa * (1 - ruleIn) });
        // points
        const c = Math.cos(th), s = Math.sin(th);
        ctx.save();
        ctx.fillStyle = rgba(P.col, pa * 0.55);
        for (const [u, v] of P.pts) {
          const x = (u * c - v * s) * sc, y = (u * s + v * c) * sc;
          ctx.beginPath();
          ctx.arc(P.cx + x * UNIT, P.cy - y * UNIT, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      // right: slices at sum ≈ 1.8 and sum ≈ 0
      const R = panels[1];
      const slice = (P, s0, half, t0, col) => {
        const ps = prog(t, t0, 0.6);
        if (ps <= 0) return;
        const x0 = P.cx + (s0 - 0.08) * UNIT, x1 = P.cx + (s0 + 0.08) * UNIT;
        roundRect(ctx, x0, P.cy - 2.5 * UNIT, x1 - x0, 5 * UNIT, 4, { fill: col, fillAlpha: 0.12, alpha: A2 * ps });
        const yTop = P.cy - half * UNIT, yBot = P.cy + half * UNIT;
        line(ctx, (x0 + x1) / 2, yTop, (x0 + x1) / 2, yBot, { color: col, width: 3, alpha: A2 * ps });
        line(ctx, x0 - 8, yTop, x1 + 8, yTop, { color: col, width: 3, alpha: A2 * ps });
        line(ctx, x0 - 8, yBot, x1 + 8, yBot, { color: col, width: 3, alpha: A2 * ps });
      };
      slice(R, 1.8, 0.2, b.near2 + 0.3, C.hi);
      if (prog(t, b.near2 + 1.2, 0.5) > 0) text(ctx, '和接近 2：间距只能接近 0', R.cx + 1.8 * UNIT, R.cy - 2.6 * UNIT + 10, { size: 22, color: C.hi, alpha: A2 * prog(t, b.near2 + 1.2, 0.5) * (1 - prog(t, b.left - 0.3, 0.5)) });
      slice(R, 0, 2.0, b.depends, C.hi);
      // left: slices of the normal cloud have the same spread
      const L = panels[0];
      const pl = prog(t, b.left, 0.6);
      if (pl > 0) {
        for (const s0 of [-1.2, 0, 1.2]) {
          const ps = prog(t, b.same - 0.6 + (s0 + 1.2) * 0.3, 0.6);
          if (ps <= 0) continue;
          // sideways density of the gap within the slice: the same N(0, 2·0.62²) everywhere
          const sd = Math.SQRT2 * 0.62;
          const pts = [];
          for (let v = -2.4; v <= 2.4001; v += 0.05) pts.push([L.cx + s0 * UNIT + normPdf(v, 0, sd) * 110, L.cy - v * UNIT]);
          poly(ctx, pts, { color: C.hi, width: 2.5, alpha: A2 * ps });
          line(ctx, L.cx + s0 * UNIT, L.cy - 2.4 * UNIT, L.cx + s0 * UNIT, L.cy + 2.4 * UNIT, { color: C.hi, width: 1.2, dash: [4, 5], alpha: A2 * ps * 0.7 });
        }
        text(ctx, '不管和是多少，间距的分布都一样', L.cx, L.cy + 2.6 * UNIT + 50, { size: 24, color: C.hi, alpha: A2 * prog(t, b.same, 0.6) });
      }
      // the rule
      const pr = prog(t, b.rule, 0.7);
      if (pr > 0) {
        roundRect(ctx, 560, 100, 800, 100, 16, { fill: '#151C29', fillAlpha: 0.9, stroke: C.hi, width: 2, alpha: A2 * pr });
        text(ctx, '正态数据加减组合得到的量：不相关 ⟹ 相互独立', 960, 138, { size: 30, color: C.text, alpha: A2 * pr });
        text(ctx, '（正态分布特有的性质）', 960, 178, { size: 24, color: C.hi, alpha: A2 * prog(t, b.only, 0.6) });
      }
    },
  });

  // =====================================================================
  // 7C  two conclusions: x̄ ⟂ s²;  s²/σ² = average of ν independent z²
  // =====================================================================
  const c = {
    start: b.end,
    first: A('第一，样本均值就是平均位置'),
    s2gaps: A('只由那 n 减 1 条间距算出'),
    check: A('用同样的方法可以验证'),
    allind: A('所以它们全部相互独立'),
    xs: A('样本均值和 s 平方也相互独立'),
    second: A('第二，每条间距的平方项'),
    z2: A('都是一个标准正态变量的平方'),
    ratio: A('所以，s 平方除以西格玛平方'),
    avgz: A('就是纽个独立标准正态变量平方的平均'),
    nu: A('这里纽等于 n 减 1'),
    chi: A('这纽个平方的和，服从自由度为纽的卡方分布'),
    div: A('s 平方除以西格玛平方，就是它除以纽'),
    end: A('一个量的方差，等于它平方的平均减去它平均的平方'),
  };
  const fXb = T(String.raw`\bar{x}`, { inline: true }), fS2 = T(String.raw`s^2`, { inline: true });
  const chk1 = T(String.raw`E\big[(\varepsilon_1-\varepsilon_2)(\varepsilon_1+\varepsilon_2-2\varepsilon_3)\big]=\sigma^2-\sigma^2+0=0`);
  const chk2 = T(String.raw`E\big[(\varepsilon_1+\varepsilon_2-2\varepsilon_3)(\varepsilon_1+\varepsilon_2+\varepsilon_3)\big]=\sigma^2+\sigma^2-2\sigma^2=0`);
  const termTex = ['\\frac{(x_1-x_2)^2}{2}', '\\frac{(x_1+x_2-2x_3)^2}{6}', '\\cdots', '\\frac{(x_1+\\cdots+x_4-4x_5)^2}{20}'].map((s) => T(s, { inline: true }));
  const zTex = ['z_1^2', 'z_2^2', '\\cdots', 'z_{\\nu}^2'].map((s) => T(s, { inline: true }));
  const fRatio = T(String.raw`\frac{s^2}{\sigma^2}=\frac{\class{z}{z_1^2+z_2^2+\cdots+z_{\nu}^2}}{\nu},\qquad \nu=n-1`);
  const fChi = T(String.raw`\class{z}{z_1^2+z_2^2+\cdots+z_{\nu}^2}\ \sim\ \chi^2_{\nu}`);
  const fChiDiv = T(String.raw`\frac{s^2}{\sigma^2}=\frac{\chi^2_{\nu}}{\nu}`);
  layers.push({
    t0: c.start - 0.6,
    t1: c.end + 1.0,
    draw(ctx, t) {
      const A3 = prog(t, c.start - 0.2, 0.8) * (1 - prog(t, c.end - 0.3, 0.8, ease.inOut));
      if (A3 <= 0) return;
      text(ctx, '两个结论', 960, 120, { size: 34, weight: 500, alpha: A3 * prog(t, c.start, 0.6) * (1 - prog(t, c.second - 0.4, 0.5)) });
      // conclusion 1
      const p1 = prog(t, c.first, 0.7) * (1 - prog(t, c.second - 0.4, 0.6));
      if (p1 > 0) {
        roundRect(ctx, 300, 220, 520, 170, 18, { fill: C.xbar, fillAlpha: 0.1, stroke: C.xbar, width: 2, alpha: A3 * p1 });
        text(ctx, '平均位置', 560, 262, { size: 28, color: C.xbar, alpha: A3 * p1 });
        rich(ctx, ['→ 样本均值 ', fXb], 560, 330, { size: 30, color: C.text, alpha: A3 * p1 });
        const p2 = prog(t, c.s2gaps, 0.7);
        roundRect(ctx, 1100, 220, 520, 170, 18, { fill: C.dev, fillAlpha: 0.1, stroke: C.dev, width: 2, alpha: A3 * p1 * p2 });
        text(ctx, 'n − 1 条间距', 1360, 262, { size: 28, color: C.dev, alpha: A3 * p1 * p2 });
        rich(ctx, ['→ ', fS2], 1360, 330, { size: 30, color: C.text, alpha: A3 * p1 * p2 });
        const pc1 = prog(t, c.check, 1.2, ease.linear), pc2 = prog(t, c.check + 1.6, 1.2, ease.linear);
        drawTex(ctx, chk1, 960, 500, 36, { alpha: A3 * p1 * clamp(pc1 * 3), write: pc1 });
        drawTex(ctx, chk2, 960, 580, 36, { alpha: A3 * p1 * clamp(pc2 * 3), write: pc2 });
        text(ctx, '（三个数据时：间距与间距、间距与平均位置）', 960, 640, { size: 22, color: C.dim, alpha: A3 * p1 * prog(t, c.check + 1.0, 0.5) });
        const pi = prog(t, c.allind, 0.6);
        if (pi > 0) {
          line(ctx, 960, 210, 960, 400, { color: C.hi, width: 3, alpha: A3 * p1 * pi });
          text(ctx, '相互独立', 960, 180, { size: 30, color: C.hi, alpha: A3 * p1 * pi });
        }
        const px = prog(t, c.xs, 0.6);
        if (px > 0) rich(ctx, [fXb, ' 与 ', fS2, ' 相互独立'], 960, 740, { size: 36, color: C.hi, alpha: A3 * p1 * px });
      }
      // conclusion 2
      const q = prog(t, c.second, 0.7);
      if (q > 0) {
        text(ctx, '第二', 960, 120, { size: 30, weight: 500, alpha: A3 * q });
        const xs = [440, 760, 1080, 1400];
        termTex.forEach((f, i) => {
          const pi = prog(t, c.second + 0.4 + i * 0.2, 0.5);
          drawTex(ctx, f, xs[i], 260, 34, { alpha: A3 * pi, color: C.dev });
          const pz = prog(t, c.z2 + i * 0.2, 0.6);
          if (pz > 0) {
            if (i !== 2) text(ctx, '÷ σ²', xs[i], 330, { size: 24, color: C.dim, alpha: A3 * pz });
            arrow(ctx, xs[i], 350, xs[i], 390, { color: C.dim, width: 2, alpha: A3 * pz });
            drawTex(ctx, zTex[i], xs[i], 430, 40, { alpha: A3 * pz, color: C.normal });
          }
        });
        const pind = prog(t, c.z2 + 2.0, 0.6);
        text(ctx, '每个 z 都是标准正态变量，彼此独立', 920, 500, { size: 26, color: C.normal, alpha: A3 * pind });
        const pr = prog(t, c.ratio, 1.6, ease.linear);
        if (pr > 0) drawTex(ctx, fRatio, 960, 620, 50, { alpha: A3 * clamp(pr * 3), write: pr, colors: { z: C.normal } });
        const pc = prog(t, c.chi, 1.2, ease.linear);
        if (pc > 0) {
          drawTex(ctx, fChi, 760, 780, 46, { alpha: A3 * clamp(pc * 3), write: pc, colors: { z: C.normal } });
          text(ctx, '自由度为 ν 的卡方分布', 760, 850, { size: 24, color: C.dim, alpha: A3 * prog(t, c.chi + 1.4, 0.5) });
        }
        const pd = prog(t, c.div, 1.0, ease.linear);
        if (pd > 0) drawTex(ctx, fChiDiv, 1300, 790, 50, { alpha: A3 * clamp(pd * 3), write: pd });
      }
    },
  });


  // =====================================================================
  // 7D  how reliable is s: Var(z²) = 2, so Var(s²/σ²) = 2/ν
  // =====================================================================
  const d = {
    start: c.end,
    mean1: A('每一部分是一个标准正态变量的平方，它的平均是 1'),
    four: A('它平方的平均，也就是标准正态变量四次方的平均'),
    three: A('是 3', { after: c.end }),
    var2: A('所以每一部分的方差是 3 减 1，等于 2'),
    same: A('和样本均值的方差是西格玛平方除以 n 同样的道理'),
    twonu: A('纽个独立部分平均以后，方差是 2 除以纽'),
    nu1: A('纽等于 1 时，s 极不可靠'),
    seven: A('大约七成的时候比西格玛小'),
    nu30: A('纽到了 30'),
    end: A('在原假设成立时'),
  };
  const fVar = T(String.raw`\mathrm{Var}(X)=E[X^2]-\big(E[X]\big)^2`);
  const fEz2 = T(String.raw`E[z^2]=1`);
  const fEz4 = T(String.raw`E\big[(z^2)^2\big]=E[z^4]=3`);
  const fVz2 = T(String.raw`\mathrm{Var}(z^2)=3-1^2=2`);
  const fAnal = T(String.raw`n\ \text{个独立数据平均：方差}\ \frac{\sigma^2}{n}`);
  const fAnal2 = T(String.raw`\nu\ \text{个独立的}\ z^2\ \text{平均：方差}\ \frac{2}{\nu}`);
  const fVs = T(String.raw`\mathrm{Var}\Big(\frac{s^2}{\sigma^2}\Big)=\frac{2}{\nu}`);
  const PZ = new Plot({ x: 150, y: 620, w: 640, h: 240, xr: [-4.2, 4.2], yr: [0, 0.9] });
  const z4 = (z) => z ** 4 * normPdf(z);
  const PV = new Plot({ x: 960, y: 330, w: 820, h: 520, xr: [0, 3], yr: [0, 2.4] });
  const nus = [[1, '2', C.hi], [3, '0.67', '#E0B37A'], [10, '0.2', '#8FC7E8'], [30, '0.067', C.s]];
  const fNuLab = nus.map(([n]) => T(`\\nu=${n}`, { inline: true }));
  const fSs = T(String.raw`s^2/\sigma^2`, { inline: true });
  const fSlt = T(String.raw`s<\sigma`, { inline: true });
  layers.push({
    t0: d.start - 0.6,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A4 = prog(t, d.start - 0.2, 0.8) * (1 - prog(t, d.end - 0.3, 0.8, ease.inOut));
      if (A4 <= 0) return;
      const X0 = 470;
      const w0 = prog(t, d.start, 1.2, ease.linear);
      drawTex(ctx, fVar, X0, 180, 44, { alpha: A4 * clamp(w0 * 3), write: w0 });
      const w1 = prog(t, d.mean1 + 2.0, 0.8, ease.linear);
      if (w1 > 0) { drawTex(ctx, fEz2, X0, 270, 44, { alpha: A4 * clamp(w1 * 3), write: w1 }); text(ctx, '（z 是标准正态变量，X = z²）', X0, 322, { size: 22, color: C.dim, alpha: A4 * clamp(w1 * 3) }); }
      const w2 = prog(t, d.four + 0.4, 1.2, ease.linear);
      if (w2 > 0) drawTex(ctx, fEz4, X0, 390, 44, { alpha: A4 * clamp(w2 * 3), write: w2 });
      const w3 = prog(t, d.var2, 1.0, ease.linear);
      if (w3 > 0) drawTex(ctx, fVz2, X0, 480, 46, { alpha: A4 * clamp(w3 * 3), write: w3, color: C.hi });
      // E[z⁴] = 3 as an area (only while it is being said)
      const pz = win(t, d.four + 0.3, d.same - 0.2, 0.6, 0.6);
      if (pz > 0) {
        fillPoly(ctx, PZ.area(z4, -4.2, 4.2, 160), C.normal, 0.25 * A4 * pz);
        poly(ctx, PZ.curve(z4, -4.2, 4.2, 160), { color: C.normal, width: 2.5, alpha: A4 * pz });
        line(ctx, PZ.x, PZ.Y(0), PZ.x + PZ.w, PZ.Y(0), { color: C.axis, width: 2, alpha: A4 * pz });
        for (const v of [-4, -2, 0, 2, 4]) num(ctx, fmt(v, 0), PZ.X(v), PZ.Y(0) + 26, 20, { color: C.dim, alpha: A4 * pz });
        text(ctx, '曲线 z⁴ ×（正态密度）下的面积 = 3', PZ.x + PZ.w / 2, PZ.y - 34, { size: 22, color: C.normal, alpha: A4 * pz * prog(t, d.three, 0.5) });
      }
      // the analogy with σ²/n
      const pa = prog(t, d.same + 0.2, 0.7);
      if (pa > 0) {
        drawTex(ctx, fAnal, X0, 615, 36, { alpha: A4 * pa, color: C.soft });
        const pa2 = prog(t, d.twonu - 0.3, 1.0, ease.linear);
        if (pa2 > 0) drawTex(ctx, fAnal2, X0, 722, 36, { alpha: A4 * clamp(pa2 * 3), write: pa2 });
        const pa3 = prog(t, d.twonu + 1.2, 1.0, ease.linear);
        if (pa3 > 0) drawTex(ctx, fVs, X0, 858, 54, { alpha: A4 * clamp(pa3 * 3), write: pa3, color: C.hi });
      }
      // densities of s²/σ² for several ν
      const pv = prog(t, d.twonu - 0.6, 0.8);
      if (pv > 0) {
        const pa = A4 * pv;
        line(ctx, PV.x, PV.Y(0), PV.x + PV.w, PV.Y(0), { color: C.axis, width: 2, alpha: pa });
        for (const v of [0, 0.5, 1, 1.5, 2, 2.5, 3]) num(ctx, String(v), PV.X(v), PV.Y(0) + 26, 22, { color: C.dim, alpha: pa });
        drawTex(ctx, fSs, PV.x + PV.w, PV.Y(0) + 60, 30, { alpha: pa, align: 'r' });
        line(ctx, PV.X(1), PV.Y(0), PV.X(1), PV.y, { color: C.sigma, width: 1.5, dash: [5, 6], alpha: pa * 0.8 });
        text(ctx, '真实值 1', PV.X(1), PV.y - 20, { size: 22, color: C.sigma, alpha: pa });
        // legend at the top right; the two remarks extend the ν = 1 and ν = 30 rows
        const LX = PV.X(1.3), LY = PV.Y(2.22), LH = 48;
        const p7 = prog(t, d.seven, 0.6), p30 = prog(t, d.nu30 + 0.8, 0.6);
        nus.forEach(([nu, vv, col], i) => {
          const t0 = nu === 30 ? d.nu30 - 0.4 : d.twonu + 0.3 + i * 0.7;
          const pc = prog(t, t0, 1.0, ease.inOut);
          if (pc <= 0) return;
          const pts = [];
          for (let x = 0.005; x <= 3.0001; x += 0.005) pts.push([PV.X(x), PV.Y(Math.min(2.4, scaledChi2Pdf(x, nu)))]);
          poly(ctx, pts, { color: col, width: 3, alpha: pa, progress: pc });
          const ly = LY + i * LH, pl = clamp(pc * 2);
          line(ctx, LX, ly, LX + 34, ly, { color: col, width: 3, alpha: pa * pl });
          const wl = rich(ctx, [fNuLab[i], '：方差 ' + vv], LX + 48, ly, { size: 24, color: col, alpha: pa * pl, align: 'left' });
          const note = nu === 1 ? ['约 68% 的时候 ', fSlt] : nu === 30 ? ['已经很集中在 1 附近'] : null;
          const pn = nu === 1 ? p7 : p30;
          if (note && pn > 0) rich(ctx, note, LX + 48 + wl + 28, ly, { size: 24, color: col, alpha: pa * pn, align: 'left' });
        });
        if (p7 > 0) {
          const pts = [[PV.X(0.005), PV.Y(0)]];
          for (let x = 0.005; x <= 1.0001; x += 0.005) pts.push([PV.X(x), PV.Y(Math.min(2.4, scaledChi2Pdf(x, 1)))]);
          pts.push([PV.X(1), PV.Y(0)]);
          fillPoly(ctx, pts, C.hi, 0.18 * pa * p7);
        }
      }
    },
  });

  // =====================================================================
  // 7E  divide numerator and denominator by σ/√n
  // =====================================================================
  const e = {
    start: d.end,
    divide: A('把 t 的分子和分母同时除以同一个量'),
    which: A('也就是西格玛除以根号 n 的值'),
    num: A('分子就变成一个标准正态变量'),
    den: A('分母是 s 与西格玛之比，两者相互独立'),
    only: A('而分母的分布只取决于纽'),
    so: A('所以，t 的分布只取决于纽'),
    table: A('可以事先算好，制成表格'),
    name: A('这就是自由度为纽的 t 分布'),
    end: A('t 分布的形状可以这样理解'),
  };
  const fT0 = T(String.raw`t=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}`);
  const fT1 = T(String.raw`t=\frac{\class{n}{\dfrac{\bar{x}-\mu}{\sigma/\sqrt{n}}}}{\class{d}{\dfrac{s/\sqrt{n}}{\sigma/\sqrt{n}}}}=\frac{\class{n}{Z}}{\class{d}{s/\sigma}}`);
  const fZdef = T(String.raw`Z=\frac{\bar{x}-\mu}{\sigma/\sqrt{n}}\sim N(0,1)`);
  const fDdef = T(String.raw`\frac{s}{\sigma}=\sqrt{\frac{V}{\nu}},\quad V=\frac{\nu s^2}{\sigma^2}\sim\chi^2_{\nu}`);
  const fFinal = T(String.raw`t=\frac{Z}{\sqrt{V/\nu}}\ \sim\ t_{\nu}`);
  const fH0 = T(String.raw`\mu_0=\mu`, { inline: true });
  layers.push({
    t0: e.start - 0.6,
    t1: e.end + 1.0,
    draw(ctx, t) {
      const A5 = prog(t, e.start - 0.2, 0.8) * (1 - prog(t, e.end - 0.3, 0.8, ease.inOut));
      if (A5 <= 0) return;
      rich(ctx, ['原假设成立：', fH0], 960, 112, { size: 30, color: C.mu, alpha: A5 * prog(t, e.start, 0.6) });
      const pm = prog(t, e.divide + 0.4, 1.6, ease.inOut);
      const P = { x: 960, y: 340, size: 58 };
      if (pm <= 0) drawTex(ctx, fT0, P.x, P.y, P.size, { alpha: A5, write: prog(t, e.start, 0.8, ease.linear) });
      else drawTexMorph(ctx, fT0, P, fT1, P, pm, { alpha: A5, colorsB: { n: C.normal, d: C.s } });
      const pw = win(t, e.which, e.num + 0.4, 0.4, 0.5);
      if (pw > 0) text(ctx, '分子、分母同除以 σ/√n', 960, 530, { size: 28, color: C.hi, alpha: A5 * pw });
      const pn = prog(t, e.num, 1.0, ease.linear);
      if (pn > 0) drawTex(ctx, fZdef, 640, 615, 42, { alpha: A5 * clamp(pn * 3), write: pn, color: C.normal });
      const pd = prog(t, e.den, 1.2, ease.linear);
      if (pd > 0) drawTex(ctx, fDdef, 1300, 615, 42, { alpha: A5 * clamp(pd * 3), write: pd, color: C.s });
      const pi = prog(t, e.den + 1.4, 0.6);
      if (pi > 0) text(ctx, 'Z 与 V 相互独立', 960, 702, { size: 30, color: C.hi, alpha: A5 * pi });
      const po = prog(t, e.only, 0.6);
      if (po > 0) text(ctx, '分母的分布只取决于 ν', 1300, 695, { size: 24, color: C.s, alpha: A5 * po * (1 - pi * 0) });
      const pf = prog(t, e.so, 1.2, ease.linear);
      if (pf > 0) {
        drawTex(ctx, fFinal, 960, 812, 60, { alpha: A5 * clamp(pf * 3), write: pf, color: C.t });
        text(ctx, '只取决于 ν，与 μ、σ 无关', 960, 900, { size: 28, color: C.text, alpha: A5 * prog(t, e.so + 1.6, 0.6) });
      }
      const pt = prog(t, e.name, 0.6);
      if (pt > 0) text(ctx, '自由度为 ν 的 t 分布', 1460, 812, { size: 30, color: C.t, alpha: A5 * pt, align: 'left' });
    },
  });

  // =====================================================================
  // 7F  the t distribution as an average of normal curves of different widths
  // =====================================================================
  const f = {
    start: e.end,
    w: A('如果分母恰好等于某个值 w'),
    sdw: A('t 就服从标准差为 w 分之 1 的正态分布'),
    random: A('分母是随机的'),
    mix: A('是许多宽窄不同的正态分布按照分母的分布加权平均的结果'),
    small: A('分母偏小的那部分，对应较宽的正态曲线'),
    tails: A('正是它们让两侧的尾部变厚'),
    end: A('纽越大，分母越集中在 1 附近'),
  };
  const PT = new Plot({ x: 220, y: 330, w: 1100, h: 520, xr: [-5, 5], yr: [0, 0.82] });
  const fRw = (r) => (r <= 0 ? 0 : chi2Pdf(3 * r * r, 3) * 6 * r); // s/σ for ν = 3
  // 36 equally likely values of the denominator (quantiles)
  const wq = (() => {
    const K = 36, grid = [], cdf = [];
    let acc = 0;
    for (let r = 0.0005; r <= 4; r += 0.0005) { acc += fRw(r) * 0.0005; grid.push(r); cdf.push(acc); }
    return Array.from({ length: K }, (_, k) => grid[cdf.findIndex((v) => v >= (k + 0.5) / K)]);
  })();
  const ws = [0.5, 0.8, 1, 1.3];
  const wCol = (w) => (w < 1 ? mixColor(C.hi, '#E0B37A', clamp((w - 0.3) / 0.7)) : mixColor('#8FC7E8', C.s, clamp((w - 1) / 0.6)));
  const fWlab = ws.map((w) => T(`w=${w}`, { inline: true }));
  const fTlab = T(String.raw`t\ \text{分布}\ (\nu=3)`, { inline: true });
  const PW = new Plot({ x: 1440, y: 360, w: 380, h: 220, xr: [0, 2.5], yr: [0, 1.3] });
  layers.push({
    t0: f.start - 0.6,
    t1: f.end + 1.0,
    draw(ctx, t) {
      const A6 = prog(t, f.start - 0.2, 0.8) * (1 - prog(t, f.end - 0.8, 0.6, ease.inOut));
      if (A6 <= 0) return;
      line(ctx, PT.x, PT.Y(0), PT.x + PT.w, PT.Y(0), { color: C.axis, width: 2, alpha: A6 });
      for (const v of [-4, -2, 0, 2, 4]) num(ctx, fmt(v, 0), PT.X(v), PT.Y(0) + 28, 22, { color: C.dim, alpha: A6 });
      const ppl = prog(t, f.start + 0.3, 0.8);
      text(ctx, '如果分母恰好是 w：t 是标准差为 1/w 的正态变量', PT.x + PT.w / 2, 220, { size: 28, color: C.text, alpha: A6 * prog(t, f.sdw, 0.6) * (1 - prog(t, f.random - 0.3, 0.5)) });
      // four fixed values of w
      const p4 = 1 - prog(t, f.mix - 0.2, 0.8);
      ws.forEach((w, i) => {
        const pc = prog(t, f.sdw + 0.2 + i * 0.35, 0.8, ease.inOut);
        if (pc <= 0 || p4 <= 0) return;
        poly(ctx, PT.curve((x) => normPdf(x, 0, 1 / w), -5, 5, 200), { color: wCol(w), width: 3, alpha: A6 * p4, progress: pc });
        const xl = [2.6, 1.6, 1.15, 0.7][i];
        drawTex(ctx, fWlab[i], PT.X(xl) + 8, PT.Y(normPdf(xl, 0, 1 / w)) - 16, 26, { color: wCol(w), alpha: A6 * p4 * pc, align: 'l' });
      });
      // the distribution of the denominator (inset)
      const pin = prog(t, f.random, 0.7);
      if (pin > 0) {
        const pa = A6 * pin;
        text(ctx, '分母 s/σ 的分布（ν = 3）', PW.x + PW.w / 2, PW.y - 30, { size: 22, color: C.soft, alpha: pa });
        line(ctx, PW.x, PW.Y(0), PW.x + PW.w, PW.Y(0), { color: C.axis, width: 2, alpha: pa });
        for (const v of [0, 1, 2]) num(ctx, String(v), PW.X(v), PW.Y(0) + 24, 20, { color: C.dim, alpha: pa });
        const L = [[PW.X(0), PW.Y(0)]], R = [[PW.X(1), PW.Y(0)]];
        for (let r = 0; r <= 1.0001; r += 0.01) L.push([PW.X(r), PW.Y(fRw(r))]);
        L.push([PW.X(1), PW.Y(0)]);
        for (let r = 1; r <= 2.5; r += 0.01) R.push([PW.X(r), PW.Y(fRw(r))]);
        R.push([PW.X(2.5), PW.Y(0)]);
        fillPoly(ctx, L, C.hi, 0.35 * pa);
        fillPoly(ctx, R, C.s, 0.3 * pa);
      }
      // many curves, averaged
      const pmx = prog(t, f.mix, 2.2, ease.inOut);
      if (pmx > 0) {
        const hiSmall = prog(t, f.small, 0.6);
        wq.forEach((w, k) => {
          const pk = clamp(pmx * wq.length - k);
          if (pk <= 0) return;
          const col = wCol(w);
          const a = (w < 1 ? 0.35 + 0.35 * hiSmall : 0.35 - 0.2 * hiSmall) * pk;
          poly(ctx, PT.curve((x) => normPdf(x, 0, 1 / w), -5, 5, 160), { color: col, width: 1.3, alpha: A6 * a });
        });
        const pt = prog(t, f.mix + 2.0, 1.0, ease.inOut);
        poly(ctx, PT.curve((x) => normPdf(x), -5, 5, 200), { color: C.normal, width: 2.5, dash: [8, 6], alpha: A6 * pt });
        poly(ctx, PT.curve((x) => tPdf(x, 3), -5, 5, 200), { color: C.t, width: 4, alpha: A6 * pt, progress: pt });
        // labels sit above the bundle, joined to their curves by short leaders
        const lp = prog(t, f.mix + 2.6, 0.6);
        if (lp > 0) {
          const [tx0, ty0] = [PT.X(1.08), PT.Y(tPdf(1.08, 3))], [tx1, ty1] = [PT.X(1.75), PT.Y(0.31)];
          line(ctx, tx1 - 8, ty1 + 6, tx0 + 3, ty0 - 4, { color: C.t, width: 1.5, alpha: A6 * lp * 0.8 });
          rich(ctx, ['平均的结果：', fTlab], tx1, ty1, { size: 26, color: C.t, alpha: A6 * lp, align: 'left' });
          const [nx0, ny0] = [PT.X(-0.7), PT.Y(normPdf(0.7))], [nx1, ny1] = [PT.X(-1.75), PT.Y(0.37)];
          line(ctx, nx1 + 8, ny1 + 6, nx0 - 3, ny0 - 4, { color: C.normal, width: 1.5, alpha: A6 * lp * 0.8 });
          text(ctx, '标准正态分布', nx1, ny1, { size: 22, color: C.normal, alpha: A6 * lp, align: 'right' });
        }
        // thicker tails
        const ptl = prog(t, f.tails, 0.7);
        if (ptl > 0) {
          for (const sgn of [-1, 1]) {
            const pts = [];
            for (let x = 2; x <= 5.0001; x += 0.05) pts.push([PT.X(sgn * x), PT.Y(tPdf(x, 3))]);
            for (let x = 5; x >= 1.9999; x -= 0.05) pts.push([PT.X(sgn * x), PT.Y(normPdf(x))]);
            fillPoly(ctx, pts, C.err, 0.55 * A6 * ptl);
          }
          text(ctx, '尾部更厚', PT.X(3.4), PT.Y(0.1), { size: 26, color: C.err, alpha: A6 * ptl });
          text(ctx, '尾部更厚', PT.X(-3.4), PT.Y(0.1), { size: 26, color: C.err, alpha: A6 * ptl });
        }
      }
    },
  });

  // =====================================================================
  // 7G  as ν grows, t approaches the normal; the 5% bounds
  // =====================================================================
  const g = {
    start: f.end,
    bounds: A('双侧 5% 的界限也随之变化'),
    n3: A('自由度为 3 时是 3.18'),
    n4: A('为 4 时是 2.78'),
    n30: A('到了 30 是 2.04'),
    close: A('已经和 1.96 很接近了'),
    still: A('如果仍用 1.96'),
    p145: A('也有 14.5% 的机会判为显著'),
    sim: A('这就是刚才模拟的结果'),
    p122: A('自由度为 4 时，是 12.2%'),
    end: S.g1,
  };
  const cols = [1, 2, 3, 4, 5, 10, 30, Infinity];
  const bnd = ['12.71', '4.30', '3.18', '2.78', '2.57', '2.23', '2.04', '1.96'];
  const bndV = [12.706, 4.303, 3.182, 2.776, 2.571, 2.228, 2.042, 1.96];
  const rate = ['30.0%', '18.9%', '14.5%', '12.2%', '10.7%', '7.8%', '5.9%', '5.0%'];
  const fNuH = T(String.raw`\nu`, { inline: true }), fInf = T(String.raw`\infty`, { inline: true });
  const PG = new Plot({ x: 260, y: 150, w: 1400, h: 400, xr: [-5, 5], yr: [0, 0.42] });
  const fNuNow = T(String.raw`\nu={}`, { inline: true });
  layers.push({
    t0: g.start - 0.6,
    t1: g.end + 1.2,
    draw(ctx, t) {
      const A7 = prog(t, g.start - 0.15, 0.7) * (1 - prog(t, g.end + 0.1, 0.9, ease.inOut));
      if (A7 <= 0) return;
      // ν grows from 1 to 30, then rests on the column being read
      const grow = prog(t, g.start + 0.3, 4.0, ease.inOut);
      let nu = Math.exp(lerp(Math.log(1), Math.log(30), grow));
      const focus = t >= g.p122 ? 4 : t >= g.still ? 3 : t >= g.close ? Infinity : t >= g.n30 ? 30 : t >= g.n4 ? 4 : t >= g.n3 ? 3 : null;
      if (focus !== null && t > g.n3) nu = focus === Infinity ? 1e6 : lerp(nu, focus, 1);
      line(ctx, PG.x, PG.Y(0), PG.x + PG.w, PG.Y(0), { color: C.axis, width: 2, alpha: A7 });
      for (const v of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) num(ctx, fmt(v, 0), PG.X(v), PG.Y(0) + 26, 22, { color: C.dim, alpha: A7 });
      poly(ctx, PG.curve((x) => normPdf(x), -5, 5, 200), { color: C.normal, width: 2.5, dash: [8, 6], alpha: A7 });
      poly(ctx, PG.curve((x) => tPdf(x, nu), -5, 5, 200), { color: C.t, width: 4, alpha: A7 });
      rich(ctx, [fNuNow, nu > 1e5 ? '∞' : nu.toFixed(nu < 10 ? 1 : 0)], PG.X(-4.85), PG.Y(0.33), { size: 34, color: C.t, alpha: A7, align: 'left' });
      text(ctx, '标准正态', PG.X(1.05) + 30, PG.Y(0.3), { size: 22, color: C.normal, alpha: A7, align: 'left' });
      // bounds of the current focus
      if (focus !== null && t > g.n3 - 0.2) {
        const b = focus === Infinity ? 1.96 : bndV[cols.indexOf(focus)];
        const pb = prog(t, g.n3 - 0.2, 0.5);
        for (const sgn of [-1, 1]) {
          line(ctx, PG.X(sgn * b), PG.Y(0) + 8, PG.X(sgn * b), PG.y + 60, { color: C.hi, width: 2.5, alpha: A7 * pb });
          const pts = [[PG.X(sgn * b), PG.Y(0)]];
          for (let x = b; x <= 5.0001; x += 0.05) pts.push([PG.X(sgn * x), PG.Y(tPdf(x, nu))]);
          pts.push([PG.X(sgn * 5), PG.Y(0)]);
          fillPoly(ctx, pts, C.hi, 0.35 * A7 * pb);
        }
        num(ctx, (focus === Infinity ? 1.96 : b).toFixed(2), PG.X(b) + 40, PG.y + 60, 28, { color: C.hi, alpha: A7 * pb, align: 'left' });
      }
      // the table
      const pt = prog(t, g.bounds - 0.2, 0.7);
      if (pt <= 0) return;
      const tx = 150, ty = 660, cw = 160, lw = 380, rh = 76;
      panel(ctx, tx - 20, ty - 52, lw + cw * 8 + 40, rh * 3 + 30, { alpha: A7 * pt });
      rich(ctx, ['自由度 ', fNuH], tx + lw / 2, ty - 8, { size: 26, color: C.dim, alpha: A7 * pt });
      text(ctx, '双侧 5% 的界限', tx + lw / 2, ty + rh, { size: 26, color: C.text, alpha: A7 * pt });
      const pr2 = prog(t, g.still, 0.6);
      text(ctx, '仍用 1.96 时的误判率', tx + lw / 2, ty + 2 * rh, { size: 26, color: C.text, alpha: A7 * pr2 });
      cols.forEach((nuC, i) => {
        const x = tx + lw + i * cw + cw / 2;
        if (nuC === Infinity) drawTex(ctx, fInf, x, ty - 8, 34, { alpha: A7 * pt, color: C.dim });
        else num(ctx, String(nuC), x, ty - 8, 30, { color: C.dim, alpha: A7 * pt });
        const hiB = (nuC === 3 && win(t, g.n3, g.n4, 0.2, 0.3)) || (nuC === 4 && win(t, g.n4, g.n30, 0.2, 0.3)) || (nuC === 30 && win(t, g.n30, g.still, 0.2, 0.3)) || (nuC === Infinity && win(t, g.close, g.still, 0.2, 0.3)) || 0;
        const hiR = (nuC === 3 && win(t, g.p145 - 0.3, g.p122 - 0.1, 0.2, 0.3)) || (nuC === 4 && win(t, g.p122, g.end + 2, 0.2, 0.3)) || 0;
        if (hiB > 0) roundRect(ctx, x - cw / 2 + 8, ty + rh - 30, cw - 16, 60, 10, { fill: C.hi, fillAlpha: 0.16 * hiB, stroke: C.hi, width: 2, alpha: A7 * hiB });
        if (hiR > 0) roundRect(ctx, x - cw / 2 + 8, ty + 2 * rh - 30, cw - 16, 60, 10, { fill: C.err, fillAlpha: 0.16 * hiR, stroke: C.err, width: 2, alpha: A7 * hiR });
        const pc = prog(t, g.bounds + 0.3 + i * 0.12, 0.4);
        num(ctx, bnd[i], x, ty + rh, 30, { color: C.text, alpha: A7 * pc });
        const pc2 = prog(t, g.still + 0.2 + i * 0.1, 0.4);
        num(ctx, rate[i], x, ty + 2 * rh, 30, { color: nuC === 3 ? C.err : C.text, alpha: A7 * pc2 });
      });
      const ps = prog(t, g.sim, 0.6);
      if (ps > 0) {
        const x = tx + lw + 2 * cw + cw / 2;
        text(ctx, '= 第六节一百万次模拟的结果', x + 20, ty + 2 * rh + 64, { size: 24, color: C.err, alpha: A7 * ps, align: 'left' });
      }
    },
  });

  return { layers };
}
