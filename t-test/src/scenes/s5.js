// 五、这个“1”是什么：自由度的含义
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex, drawTexMorph } from '../engine/tex.js';
import { text, num, labelNum, line, arrow, dot, Axis, Plot, span, brace, braceTip, roundRect, rich, poly, fillPoly, panel, measure, mixed } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, rgba, normalSampler, fmt, keys, mixColor } from '../engine/util.js';
import { DATA, MEAN, drawGrid, cellCenter } from './common.js';

const T = (s, o) => tex(s, o);

function devSquares(ctx, ax, pts, c, a, col) {
  if (a <= 0.002) return;
  pts.forEach((x) => {
    const side = Math.abs(x - c) * ax.unit;
    const x0 = Math.min(ax.X(c), ax.X(x));
    ctx.save();
    ctx.fillStyle = rgba(col, a * 0.1);
    ctx.fillRect(x0, ax.y - side, side, side);
    ctx.strokeStyle = rgba(col, a * 0.85);
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, ax.y - side, side, side);
    ctx.restore();
  });
}

export function build5(N) {
  const S = N.chapter(5);
  const { A } = S;
  const layers = [];
  const LB = {
    used: mixed('已用来估计 $\\mu$'),
    gone: mixed('$\\mu$ 消掉了'),
    firstk: mixed('：前 $k$ 个数的平均'),
    why: mixed('（新数据的误差 $\\sigma^2$，加上前 $k$ 个平均值的误差 $\\sigma^2/k$）'),
    ndata: mixed('$n$ 个数据：一共 '),
    ndata2: mixed('$n$ 个数据'),
    n1: mixed('$n-1$ 条：离散程度'),
    np: mixed('一般地：要定 $p$ 个数，自由度'),
  };

  // =====================================================================
  // 5A  two data: average position and gap
  // =====================================================================
  const a = {
    start: S.first,
    two: A('两个数据的情形最简单'),
    mid: A('两个数据的均值落在它们的正中间'),
    half: A('方向相反，每个偏差都是间距的一半'),
    sq: A('两个偏差的平方加起来，就是间距平方的一半'),
    two_q: A('两个数据可以换成两个量来描述'),
    gapW: A('一个是间距'),
    shift: A('把两个点一起平移'),
    spread: A('只有改变间距，偏差才会改变'),
    used: A('平均位置已经用来估计缪了'),
    left: A('只剩下间距这一条信息'),
    end: A('间距还有一个好处'),
  };
  const ax = new Axis({ x0: 360, x1: 1560, y: 800, v0: -1.2, v1: 3.6 });
  const fX1 = T('x_1', { inline: true }), fX2 = T('x_2', { inline: true }), fXb = T(String.raw`\bar{x}`, { inline: true });
  const fGap = T(String.raw`x_1-x_2`, { inline: true });
  const fHalfSq = T(String.raw`(x_1-\bar{x})^2+(x_2-\bar{x})^2=\frac{(x_1-x_2)^2}{2}`);
  const fHalfNum = T(String.raw`1.0^2+1.0^2=\frac{2.0^2}{2}`);
  // positions of the two points over time: (centre, gap)
  const cg = (t) => {
    const sh = prog(t, a.shift + 0.6, 1.4, ease.inOut) * (1 - prog(t, a.used + 0.4, 1.2, ease.inOut));
    const sp = prog(t, a.spread + 0.3, 1.3, ease.inOut) * (1 - prog(t, a.used + 0.4, 1.2, ease.inOut));
    return [0.8 + 0.6 * sh, 2.0 + 1.0 * sp];
  };
  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.4, 0.8) * (1 - prog(t, a.end - 0.3, 0.8, ease.inOut));
      if (A1 <= 0) return;
      ax.draw(ctx, { alpha: A1, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
      const [cen, gap] = cg(t);
      const yNote = 340;
      const x1 = cen + gap / 2, x2 = cen - gap / 2;
      const pp = prog(t, a.two - 0.2, 0.6, ease.out);
      // deviation squares
      const psq = prog(t, a.sq - 0.2, 1.0, ease.inOut);
      devSquares(ctx, ax, [x1, x2].map((x) => cen + (x - cen) * psq), cen, A1 * clamp(psq * 2), C.dev);
      // points
      [[x1, fX1], [x2, fX2]].forEach(([x, f]) => {
        dot(ctx, ax.X(x), ax.y, 10, { color: C.data, alpha: A1 * pp, glow: 0.6 });
        drawTex(ctx, f, ax.X(x), ax.y + 50, 32, { color: C.data, alpha: A1 * pp });
      });
      // the mean in the middle, deviations of equal length
      const pm = prog(t, a.mid, 0.7);
      if (pm > 0) {
        line(ctx, ax.X(cen), ax.y + 12, ax.X(cen), ax.y - 400, { color: C.xbar, width: 2.5, alpha: A1 * pm });
        drawTex(ctx, fXb, ax.X(cen), ax.y - 424, 34, { color: C.xbar, alpha: A1 * pm });
        const pa = prog(t, a.mid + 0.8, 0.8, ease.out);
        arrow(ctx, ax.X(cen), ax.y - 36, ax.X(x1), ax.y - 36, { color: C.dev, width: 3.5, head: 14, alpha: A1 * pa, progress: pa });
        arrow(ctx, ax.X(cen), ax.y - 36, ax.X(x2), ax.y - 36, { color: C.dev, width: 3.5, head: 14, alpha: A1 * pa, progress: pa });
      }
      // the gap and "each deviation is half of it"
      const pg = prog(t, a.half, 0.7);
      if (pg > 0) {
        span(ctx, ax.X(x2), ax.X(x1), ax.y + 100, { color: C.text, alpha: A1 * pg });
        rich(ctx, ['间距 ', fGap], ax.X(cen), ax.y + 132, { size: 26, alpha: A1 * pg });
        const ph = prog(t, a.half + 1.2, 0.6) * (1 - prog(t, a.two_q - 0.3, 0.5));
        text(ctx, '间距的一半', ax.X((cen + x1) / 2), ax.y - 66, { size: 24, color: C.dev, alpha: A1 * ph });
        text(ctx, '间距的一半', ax.X((cen + x2) / 2), ax.y - 66, { size: 24, color: C.dev, alpha: A1 * ph });
      }
      // squares add up to half the squared gap
      const pf = prog(t, a.sq, 1.4, ease.linear) * (1 - prog(t, a.two_q - 0.3, 0.5));
      if (pf > 0) {
        drawTex(ctx, fHalfSq, 960, 200, 48, { alpha: A1 * clamp(pf * 3), write: pf, colors: {} });
        drawTex(ctx, fHalfNum, 960, 290, 40, { alpha: A1 * prog(t, a.sq + 1.6, 0.6), color: C.dim });
      }
      // two quantities: average position and gap
      const pq = prog(t, a.two_q, 0.6);
      if (pq > 0) {
        const used = prog(t, a.used, 0.6), left = prog(t, a.left, 0.6);
        const y = 210;
        panel(ctx, 470, y - 70, 460, 150, { alpha: A1 * pq });
        labelNum(ctx, '平均位置', cen.toFixed(1), 700, y - 18, { size: 34, color: C.xbar, alpha: A1 * pq });
        rich(ctx, LB.used, 700, y + 36, { size: 24, color: C.xbar, alpha: A1 * used });
        const pw = prog(t, a.gapW, 0.6);
        panel(ctx, 990, y - 70, 460, 150, { alpha: A1 * pw, stroke: left > 0 ? C.hi : '#2A3343' });
        labelNum(ctx, '间距', gap.toFixed(1), 1220, y - 18, { size: 34, color: C.text, alpha: A1 * pw });
        text(ctx, '只剩它能说明离散程度', 1220, y + 36, { size: 24, color: C.hi, alpha: A1 * left });
      }
      const pd = win(t, a.shift + 0.2, a.spread - 0.2, 0.4, 0.4);
      if (pd > 0) text(ctx, '一起平移：偏差不变', 960, yNote, { size: 30, color: C.text, alpha: A1 * pd });
      const pe = win(t, a.spread + 0.1, a.used - 0.1, 0.4, 0.4);
      if (pe > 0) text(ctx, '拉开间距：偏差变大', 960, yNote, { size: 30, color: C.text, alpha: A1 * pe });
    },
  });

  // =====================================================================
  // 5B  the gap does not involve μ; its square averages 2σ²
  // =====================================================================
  const b = {
    start: a.end,
    cancel: A('两个数据相减，缪就消掉了'),
    grid: A('用前面方格的办法展开'),
    avg2: A('它的平方平均是两份西格玛平方'),
    one: A('偏差平方和平均正好是一份西格玛平方'),
    info: A('两个数据只有一条关于离散程度的信息'),
    div1: A('所以要除以 1'),
    end: A('数据更多时，道理也一样'),
  };
  const fCan = T(String.raw`x_1-x_2=(\class{m}{\mu}+\varepsilon_1)-(\class{m}{\mu}+\varepsilon_2)=\varepsilon_1-\varepsilon_2`);
  const gLab = [T(String.raw`\varepsilon_1`, { inline: true }), T(String.raw`-\varepsilon_2`, { inline: true })];
  const gTerm = [[T(String.raw`\varepsilon_1^2`, { inline: true }), T(String.raw`-\varepsilon_1\varepsilon_2`, { inline: true })], [T(String.raw`-\varepsilon_2\varepsilon_1`, { inline: true }), T(String.raw`\varepsilon_2^2`, { inline: true })]];
  const fSig = T(String.raw`\sigma^2`, { inline: true }), fZero = T('0', { inline: true });
  const fE2 = T(String.raw`E\big[(\varepsilon_1-\varepsilon_2)^2\big]=\class{s}{\sigma^2}+\class{s}{\sigma^2}-0=2\class{s}{\sigma^2}`);
  const fOne = T(String.raw`E\Big[\frac{(x_1-x_2)^2}{2}\Big]=\frac{2\class{s}{\sigma^2}}{2}=\class{s}{\sigma^2}`);
  const G = { x: 300, y: 380, n: 2, cell: 160 };
  layers.push({
    t0: b.start - 0.6,
    t1: b.end + 1.0,
    draw(ctx, t) {
      const A2 = prog(t, b.start - 0.2, 0.8) * (1 - prog(t, b.end - 0.3, 0.8, ease.inOut));
      if (A2 <= 0) return;
      const pc = prog(t, b.start + 0.2, 1.6, ease.linear);
      const strike = prog(t, b.cancel + 0.8, 0.6);
      drawTex(ctx, fCan, 960, 200, 52, { alpha: A2, write: pc, colors: { m: strike > 0 ? mixColor(C.mu, C.dim, strike) : C.mu } });
      if (strike > 0) {
        // a short stroke through every μ
        const L = fCan.L;
        const o = fCan.origin(960, 200, 52, 'c', 'm');
        for (const it of L.items) if (it.tags.includes('m')) {
          const x0 = o.ox + it.box[0] * o.s - 4, x1 = o.ox + it.box[2] * o.s + 4;
          const y0 = o.oy + it.box[3] * o.s + 2, y1 = o.oy + it.box[1] * o.s - 2;
          line(ctx, x0, y0, lerp(x0, x1, strike), lerp(y0, y1, strike), { color: C.neg, width: 3, alpha: A2 });
        }
        rich(ctx, LB.gone, 960, 268, { size: 26, color: C.neg, alpha: A2 * strike });
      }
      // grid for (ε1 − ε2)²
      const pg = prog(t, b.grid, 0.8);
      if (pg > 0) {
        const pav = prog(t, b.avg2 - 0.2, 0.6);
        drawGrid(ctx, G, { alpha: A2 * pg, lines: pg, fill: (i, j) => (i === j ? [C.sigma, 0.14 * pav] : ['#7E9CC4', 0.06 * pav]) });
        for (let i = 0; i < 2; i++) {
          drawTex(ctx, gLab[i], G.x - 30, G.y + (i + 0.5) * G.cell, 34, { color: C.err, alpha: A2 * pg, align: 'r' });
          drawTex(ctx, gLab[i], G.x + (i + 0.5) * G.cell, G.y - 28, 34, { color: C.err, alpha: A2 * pg });
          for (let j = 0; j < 2; j++) {
            const [cx, cy] = cellCenter(G, i, j);
            const pt = prog(t, b.grid + 0.4 + (i * 2 + j) * 0.15, 0.5);
            drawTex(ctx, gTerm[i][j], cx, cy - 22 * pav, 36, { alpha: A2 * pt });
            if (pav > 0) drawTex(ctx, i === j ? fSig : fZero, cx, cy + 34, 30, { color: i === j ? C.sigma : C.dim, alpha: A2 * pav });
          }
        }
        text(ctx, '平均', G.x + G.cell, G.y + 2 * G.cell + 40, { size: 24, color: C.dim, alpha: A2 * pav });
      }
      const p2 = prog(t, b.avg2, 1.3, ease.linear);
      if (p2 > 0) drawTex(ctx, fE2, 1200, 470, 44, { alpha: A2 * clamp(p2 * 3), write: p2, colors: { s: C.sigma } });
      const p1 = prog(t, b.avg2 + 2.2, 1.3, ease.linear);
      if (p1 > 0) drawTex(ctx, fOne, 1200, 600, 44, { alpha: A2 * clamp(p1 * 3), write: p1, colors: { s: C.sigma } });
      const pi = prog(t, b.info, 0.7);
      if (pi > 0) {
        text(ctx, '2 个数据，1 条关于离散程度的信息', 1200, 760, { size: 30, color: C.hi, alpha: A2 * pi });
        text(ctx, '所以除以 1', 1200, 815, { size: 30, color: C.hi, alpha: A2 * prog(t, b.div1, 0.6) });
      }
    },
  });


  // =====================================================================
  // 5C  three data: two terms, each averages one σ²
  // =====================================================================
  const c = {
    start: b.end,
    split: A('三个数据的偏差平方和，可以拆成两项'),
    first: A('第一项看前两个数相距多远'),
    second: A('第二项看第三个数离前两个数的中点有多远'),
    bracket: A('第二项括号里的'),
    twice: A('是中点到 x 三距离的两倍'),
    mu: A('两项里的缪都会消掉'),
    grid: A('第二项用方格展开'),
    sum6: A('误差部分的平方平均是'),
    div6: A('也就是 6 倍西格玛平方，除以 6'),
    both: A('所以两项平均都是一份西格玛平方'),
    end: A('一般地，每加入一个数据'),
  };
  const f3 = T(String.raw`\sum_{i=1}^{3}(x_i-\bar{x})^2=\class{a}{\frac{(x_1-x_2)^2}{2}}+\class{b}{\frac{(x_1+x_2-2x_3)^2}{6}}`);
  const f3num = T(String.raw`3.93=2.00+1.93`, { inline: true });
  const fTw = T(String.raw`x_1+x_2-2x_3=2\Big(\frac{x_1+x_2}{2}-x_3\Big)`);
  const fMu3 = T(String.raw`=\varepsilon_1+\varepsilon_2-2\varepsilon_3\quad(\mu+\mu-2\mu=0)`);
  const ax3 = new Axis({ x0: 140, x1: 1000, y: 830, v0: -1.2, v1: 3.6 });
  const g3lab = [T(String.raw`\varepsilon_1`, { inline: true }), T(String.raw`\varepsilon_2`, { inline: true }), T(String.raw`-2\varepsilon_3`, { inline: true })];
  const g3term = [
    [T(String.raw`\varepsilon_1^2`, { inline: true }), T(String.raw`\varepsilon_1\varepsilon_2`, { inline: true }), T(String.raw`-2\varepsilon_1\varepsilon_3`, { inline: true })],
    [T(String.raw`\varepsilon_2\varepsilon_1`, { inline: true }), T(String.raw`\varepsilon_2^2`, { inline: true }), T(String.raw`-2\varepsilon_2\varepsilon_3`, { inline: true })],
    [T(String.raw`-2\varepsilon_3\varepsilon_1`, { inline: true }), T(String.raw`-2\varepsilon_3\varepsilon_2`, { inline: true }), T(String.raw`4\varepsilon_3^2`, { inline: true })],
  ];
  const g3avg = [fSig, fSig, T(String.raw`4\sigma^2`, { inline: true })];
  const f6 = T(String.raw`\class{s}{\sigma^2}+\class{s}{\sigma^2}+4\class{s}{\sigma^2}=6\class{s}{\sigma^2},\qquad \frac{6\class{s}{\sigma^2}}{6}=\class{s}{\sigma^2}`);
  const G3 = { x: 1230, y: 440, n: 3, cell: 136 };
  const fX3 = T('x_3', { inline: true }), fMid = T(String.raw`\frac{x_1+x_2}{2}`, { inline: true });
  layers.push({
    t0: c.start - 0.6,
    t1: c.end + 1.0,
    draw(ctx, t) {
      const A3 = prog(t, c.start - 0.2, 0.8) * (1 - prog(t, c.end - 0.3, 0.8, ease.inOut));
      if (A3 <= 0) return;
      // formula
      const pw = prog(t, c.split, 1.6, ease.linear);
      const hiA = win(t, c.first, c.second, 0.3, 0.4), hiB = win(t, c.second, c.mu + 1.5, 0.3, 0.4);
      drawTex(ctx, f3, 760, 190, 48, { alpha: A3, write: pw, colors: { a: hiA > 0 ? C.dev : C.text, b: hiB > 0 ? C.hi : C.text } });
      drawTex(ctx, f3num, 760, 285, 32, { color: C.dim, alpha: A3 * prog(t, c.split + 2.2, 0.6) * (1 - prog(t, c.bracket - 0.3, 0.5)) });
      const pb = prog(t, c.bracket, 1.2, ease.linear) * (1 - prog(t, c.grid - 0.3, 0.5));
      if (pb > 0) drawTex(ctx, fTw, 760, 300, 40, { alpha: A3 * clamp(pb * 3), write: pb });
      const pm = prog(t, c.mu, 1.0, ease.linear) * (1 - prog(t, c.grid - 0.3, 0.5));
      if (pm > 0) drawTex(ctx, fMu3, 760, 380, 36, { alpha: A3 * clamp(pm * 3), write: pm });
      // three points on a line
      const pl = prog(t, c.start, 0.8);
      ax3.draw(ctx, { alpha: A3 * pl, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
      const pts = [[1.8, fX1], [-0.2, fX2], [2.5, fX3]];
      pts.forEach(([x, f], i) => {
        const pp = prog(t, c.start + 0.2 + i * 0.25, 0.5, ease.out);
        dot(ctx, ax3.X(x), ax3.y, 9, { color: C.data, alpha: A3 * pp, glow: 0.5 });
        drawTex(ctx, f, ax3.X(x), ax3.y + 46, 30, { color: C.data, alpha: A3 * pp });
      });
      const p1 = prog(t, c.first, 0.7);
      if (p1 > 0) {
        span(ctx, ax3.X(-0.2), ax3.X(1.8), ax3.y - 70, { color: C.dev, alpha: A3 * p1 });
        text(ctx, '前两个数相距多远', ax3.X(0.8), ax3.y - 100, { size: 24, color: C.dev, alpha: A3 * p1 });
      }
      const p2 = prog(t, c.second, 0.7);
      if (p2 > 0) {
        const xm = ax3.X(0.8);
        line(ctx, xm, ax3.y + 8, xm, ax3.y - 190, { color: C.hi, width: 2, dash: [5, 5], alpha: A3 * p2 });
        drawTex(ctx, fMid, xm, ax3.y - 222, 28, { color: C.hi, alpha: A3 * p2 });
        span(ctx, xm, ax3.X(2.5), ax3.y - 150, { color: C.hi, alpha: A3 * p2 });
        text(ctx, '第三个数离中点多远', ax3.X(1.65), ax3.y - 178, { size: 24, color: C.hi, alpha: A3 * p2 });
      }
      // 3×3 grid for (ε1 + ε2 − 2ε3)²
      const pg = prog(t, c.grid, 0.8);
      if (pg > 0) {
        const pav = prog(t, c.sum6 - 0.3, 0.7);
        drawGrid(ctx, G3, { alpha: A3 * pg, lines: pg, fill: (i, j) => (i === j ? [C.sigma, 0.14 * pav] : ['#7E9CC4', 0.05 * pav]) });
        for (let i = 0; i < 3; i++) {
          drawTex(ctx, g3lab[i], G3.x - 24, G3.y + (i + 0.5) * G3.cell, 30, { color: C.err, alpha: A3 * pg, align: 'r' });
          drawTex(ctx, g3lab[i], G3.x + (i + 0.5) * G3.cell, G3.y - 26, 30, { color: C.err, alpha: A3 * pg });
          for (let j = 0; j < 3; j++) {
            const [cx, cy] = cellCenter(G3, i, j);
            const pt = prog(t, c.grid + 0.3 + (i * 3 + j) * 0.07, 0.4);
            drawTex(ctx, g3term[i][j], cx, cy - 22 * pav, 26, { alpha: A3 * pt * (i === j ? 1 : 1 - 0.4 * pav) });
            if (pav > 0) drawTex(ctx, i === j ? g3avg[i] : fZero, cx, cy + 28, 26, { color: i === j ? C.sigma : C.dim, alpha: A3 * pav });
          }
        }
        const p6 = prog(t, c.sum6 + 0.4, 1.6, ease.linear);
        if (p6 > 0) drawTex(ctx, f6, 1450, 900, 34, { alpha: A3 * clamp(p6 * 3), write: p6, colors: { s: C.sigma } });
      }
      // both terms average one σ²
      const pB = prog(t, c.both, 0.6);
      if (pB > 0) {
        for (const tag of ['a', 'b']) {
          const bx = f3.box(760, 190, 48, 'c', 'm', tag);
          brace(ctx, bx.x0, bx.y1 + 10, bx.x1, bx.y1 + 10, { side: -1, depth: 12, color: C.sigma, alpha: A3 * pB });
          rich(ctx, ['平均 ', fSig], bx.cx, bx.y1 + 50, { size: 24, color: C.sigma, alpha: A3 * pB });
        }
      }
    },
  });

  // =====================================================================
  // 5D  adding the data one at a time: n − 1 terms; the five batches
  // =====================================================================
  const d = {
    start: c.end,
    far: A('这个数据离前面那些数据的平均位置有多远'),
    coef: A('再乘上一个系数'),
    k: A('系数是 k 除以 k 加 1'),
    avg: A('它的平均正好是一份西格玛平方'),
    n1: A('n 个数据一共有 n 减 1 条这样的信息'),
    calc: A('用开头的五批数据算一下'),
    t1: A('2.00'),
    t2: A('1.93'),
    t3: A('0.85'),
    t4: A('和 0'),
    sum: A('加起来正好是 4.78'),
    last: A('最后一项是 0'),
    because: A('是因为第五个数 1.1 恰好等于前四个数的平均值'),
    end: A('这就是自由度的含义'),
  };
  const fK = T(String.raw`\frac{k}{k+1}\big(x_{k+1}-\bar{x}_k\big)^2`);
  const fKnote = T(String.raw`\bar{x}_k`, { inline: true });
  const fWhyK = T(String.raw`E\big[(x_{k+1}-\bar{x}_k)^2\big]=\class{s}{\sigma^2}+\frac{\class{s}{\sigma^2}}{k}=\frac{k+1}{k}\,\class{s}{\sigma^2}`);
  const fWhyK2 = T(String.raw`\frac{k}{k+1}\cdot\frac{k+1}{k}\,\class{s}{\sigma^2}=\class{s}{\sigma^2}`);
  const fN1 = T(String.raw`n-1`, { inline: true });
  const ax5 = new Axis({ x0: 140, x1: 900, y: 820, v0: -1.2, v1: 3.6 });
  const runM = [1.8, 0.8, 4.1 / 3, 1.1];
  const rows = [
    [2, '−2.00', '1/2', '2.00'],
    [3, '1.70', '2/3', '1.93'],
    [4, '−1.07', '3/4', '0.85'],
    [5, '0.00', '4/5', '0.00'],
  ];
  const stepT = () => [d.t1 - 0.7, d.t2 - 0.6, d.t3 - 0.6, d.t4 - 0.5];
  const fXk = [1, 2, 3, 4, 5].map((i) => T(`x_${i}`, { inline: true }));
  const fCo = ['\\tfrac{1}{2}', '\\tfrac{2}{3}', '\\tfrac{3}{4}', '\\tfrac{4}{5}'].map((x) => T(x, { inline: true }));
  layers.push({
    t0: d.start - 0.6,
    t1: d.end + 1.0,
    draw(ctx, t) {
      const A4 = prog(t, d.start - 0.2, 0.8) * (1 - prog(t, d.end - 0.3, 0.8, ease.inOut));
      if (A4 <= 0) return;
      // the general term
      const pk = prog(t, d.coef, 1.2, ease.linear);
      if (pk > 0) drawTex(ctx, fK, 520, 190, 54, { alpha: A4 * clamp(pk * 3), write: pk });
      const pn = prog(t, d.far, 0.6);
      rich(ctx, [fKnote, ...LB.firstk], 520, 290, { size: 26, color: C.xbar, alpha: A4 * pn });
      // why it averages one σ²
      const pa = prog(t, d.avg - 0.2, 1.4, ease.linear);
      if (pa > 0) {
        drawTex(ctx, fWhyK, 1340, 170, 38, { alpha: A4 * clamp(pa * 3), write: pa, colors: { s: C.sigma } });
        rich(ctx, LB.why, 1340, 232, { size: 22, color: C.dim, alpha: A4 * prog(t, d.avg + 1.0, 0.5) });
        const pa2 = prog(t, d.avg + 1.2, 1.0, ease.linear);
        if (pa2 > 0) drawTex(ctx, fWhyK2, 1340, 300, 38, { alpha: A4 * clamp(pa2 * 3), write: pa2, colors: { s: C.sigma } });
      }
      const pn1 = prog(t, d.n1, 0.6);
      if (pn1 > 0) rich(ctx, [...LB.ndata, fN1, ' 项'], 520, 360, { size: 30, color: C.hi, alpha: A4 * pn1 });
      // the data, added one at a time
      const pc = prog(t, d.calc - 0.3, 0.7); // the worked table
      const pAx = prog(t, d.start - 0.1, 0.7);
      // the line starts centred and moves left when the right side fills up
      const dx = 480 * (1 - prog(t, d.avg - 1.2, 1.0, ease.inOut));
      ctx.save();
      ctx.translate(dx, 0);
      ax5.draw(ctx, { alpha: A4 * pAx, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
      text(ctx, '每加入一个数据，多一条新信息', ax5.X(1.2), ax5.y - 260, { size: 28, color: C.text, alpha: A4 * pAx * (1 - pc) });
      const st = stepT();
      const general = d.far; // before the worked example: the 4th point against the mean of three
      DATA.forEach((x, i) => {
        let shown;
        if (t < d.calc - 0.3) shown = i < 3 ? pAx : i === 3 ? prog(t, general, 0.4) : 0;
        else shown = i === 0 ? 1 : prog(t, st[i - 1], 0.4);
        if (shown <= 0) return;
        dot(ctx, ax5.X(x), ax5.y, 9, { color: C.data, alpha: A4 * shown, glow: 0.5 });
        drawTex(ctx, fXk[i], ax5.X(x), ax5.y + 46, 28, { color: C.data, alpha: A4 * shown });
      });
      // current step: mean of the earlier points, bracket to the new point
      const k = t < d.calc - 0.3 ? (t >= general ? 2 : -1) : st.findLastIndex((x) => x <= t);
      if (k >= 0) {
        const m = runM[k], xn = DATA[k + 1];
        const ps = t < d.calc - 0.3 ? prog(t, general + 0.2, 0.6) * (1 - prog(t, d.calc - 0.8, 0.5)) : prog(t, st[k], 0.6);
        const xm = ax5.X(m);
        line(ctx, xm, ax5.y + 8, xm, ax5.y - 150, { color: C.xbar, width: 2.5, alpha: A4 * ps });
        labelNum(ctx, '前 ' + (k + 1) + ' 个的平均', fmt(m, 2), xm, ax5.y - 172, { size: 22, color: C.xbar, alpha: A4 * ps });
        if (Math.abs(xn - m) > 0.01) span(ctx, xm, ax5.X(xn), ax5.y - 90, { color: C.hi, alpha: A4 * ps, progress: ps });
        else dot(ctx, xm, ax5.y, 18, { fill: false, ring: C.hi, ringWidth: 2.5, alpha: A4 * ps });
      }
      ctx.restore();
      // the table
      if (pc <= 0) return;
      const tx = 1000, ty = 420, rh = 68;
      const heads = ['加入', '离前面平均', '系数', '这一项'];
      const cols = [1060, 1250, 1450, 1620];
      panel(ctx, tx, ty - 50, 760, rh * 5 + 70, { alpha: A4 * pc });
      heads.forEach((h, j) => text(ctx, h, cols[j], ty, { size: 24, color: C.dim, alpha: A4 * pc }));
      rows.forEach(([idx, dist, co, term], r) => {
        const pr = prog(t, st[r], 0.5);
        if (pr <= 0) return;
        const y = ty + (r + 1) * rh;
        const hi = (r === 3 ? win(t, d.last, d.end, 0.4, 0.4) : 0) + (k === r ? 0.6 : 0);
        if (hi > 0) roundRect(ctx, tx + 12, y - 28, 736, 56, 8, { fill: C.hi, fillAlpha: 0.1 * Math.min(1, hi), alpha: A4 });
        drawTex(ctx, fXk[idx - 1], cols[0], y, 30, { alpha: A4 * pr, color: C.data });
        num(ctx, dist, cols[1], y, 28, { alpha: A4 * pr });
        drawTex(ctx, fCo[r], cols[2], y, 34, { alpha: A4 * pr });
        num(ctx, term, cols[3], y, 28, { color: C.hi, alpha: A4 * pr });
      });
      const ps = prog(t, d.sum, 0.6);
      if (ps > 0) {
        const y = ty + 5 * rh;
        line(ctx, tx + 30, y - 34, tx + 730, y - 34, { color: C.faint, width: 1.5, alpha: A4 * ps });
        text(ctx, '合计', cols[2], y, { size: 26, color: C.text, alpha: A4 * ps });
        num(ctx, '4.78', cols[3], y, 30, { color: C.dev, alpha: A4 * ps });
        text(ctx, '= 偏差平方和', cols[3] + 150, y, { size: 22, color: C.dev, alpha: A4 * ps, align: 'left' });
      }
    },
  });

  // =====================================================================
  // 5E  what the degrees of freedom are
  // =====================================================================
  const e = {
    start: d.end,
    def: A('能用来估计离散程度的信息有几条'),
    split: A('n 个数据里，有一条信息用来确定平均位置'),
    rest: A('剩下的 n 减 1 条用来估计离散程度'),
    saying: A('常说的'),
    same: A('说的也是这件事'),
    used: A('被用掉的是所有数据共同的平均位置'),
    notone: A('不是其中某一个数据'),
    end: A('这个理解可以直接推广'),
  };
  const devVals = DATA.map((x) => x - MEAN); // 0.7, −1.3, 1.4, −0.8, 0
  const fSum0 = T(String.raw`\sum_{i=1}^{n}(x_i-\bar{x})=0`);
  const fDevLab = [1, 2, 3, 4, 5].map((i) => T(`x_${i}-\\bar{x}`, { inline: true }));
  layers.push({
    t0: e.start - 0.6,
    t1: e.end + 1.0,
    draw(ctx, t) {
      const A5 = prog(t, e.start - 0.2, 0.8) * (1 - prog(t, e.end - 0.3, 0.8, ease.inOut));
      if (A5 <= 0) return;
      const up = prog(t, e.saying - 0.4, 0.8, ease.inOut);
      const yT = lerp(330, 170, up);
      text(ctx, '自由度', 960, yT, { size: lerp(84, 56, up), weight: 600, family: 'serif', alpha: A5 * prog(t, e.start, 0.8) });
      text(ctx, '能用来估计离散程度的信息有几条', 960, yT + lerp(90, 66, up), { size: lerp(36, 30, up), color: C.hi, alpha: A5 * prog(t, e.def, 0.6) });
      // n = 1 + (n − 1)
      const ps = prog(t, e.split, 0.7) * (1 - up);
      if (ps > 0) {
        const y = 620;
        // five data dots
        for (let i = 0; i < 5; i++) dot(ctx, 560 + i * 50, y, 11, { color: C.data, alpha: A5 * ps, glow: 0.4 });
        rich(ctx, LB.ndata2, 660, y + 60, { size: 26, color: C.data, alpha: A5 * ps });
        text(ctx, '=', 880, y, { size: 44, alpha: A5 * ps });
        roundRect(ctx, 940, y - 34, 170, 68, 12, { fill: C.xbar, fillAlpha: 0.18, stroke: C.xbar, width: 2, alpha: A5 * ps });
        text(ctx, '平均位置', 1025, y, { size: 26, color: C.xbar, alpha: A5 * ps });
        text(ctx, '1 条', 1025, y + 60, { size: 24, color: C.xbar, alpha: A5 * ps });
        const pr = prog(t, e.rest, 0.7) * (1 - up);
        text(ctx, '+', 1150, y, { size: 44, alpha: A5 * pr });
        for (let i = 0; i < 4; i++) roundRect(ctx, 1190 + i * 92, y - 34, 80, 68, 12, { fill: C.hi, fillAlpha: 0.16, stroke: C.hi, width: 2, alpha: A5 * clamp(pr * 4 - i) });
        rich(ctx, LB.n1, 1365, y + 60, { size: 24, color: C.hi, alpha: A5 * pr });
      }
      // "knowing the mean, the last value is not free"
      if (up > 0) {
        const y = 600, x0 = 470, wbox = 170;
        // which slot is "the last one": it moves, to show it is not a particular datum
        const cyc = prog(t, e.used + 0.3, 3.2, ease.linear);
        const slot = cyc > 0 && cyc < 1 ? Math.floor(cyc * 5) % 5 : 4;
        devVals.forEach((v, i) => {
          const x = x0 + i * (wbox + 26);
          const isQ = i === slot && t > e.saying + 0.8;
          roundRect(ctx, x, y - 50, wbox, 100, 14, { fill: isQ ? C.hi : C.dev, fillAlpha: isQ ? 0.14 : 0.08, stroke: isQ ? C.hi : C.dev, width: 2, alpha: A5 * up });
          if (isQ) {
            const reveal = prog(t, e.same - 0.2, 0.6);
            text(ctx, '?', x + wbox / 2, y, { size: 44, color: C.hi, alpha: A5 * up * (1 - reveal) });
            num(ctx, fmt(v, 1), x + wbox / 2, y, 36, { color: C.hi, alpha: A5 * up * reveal });
          } else num(ctx, fmt(v, 1), x + wbox / 2, y, 36, { color: C.dev, alpha: A5 * up });
          drawTex(ctx, fDevLab[i], x + wbox / 2, y + 80, 26, { color: C.dim, alpha: A5 * up });
        });
        drawTex(ctx, fSum0, 960, 820, 44, { alpha: A5 * prog(t, e.saying + 0.4, 0.6), color: C.dev });
        text(ctx, '其余确定以后，剩下那个只能是让总和为 0 的值', 960, 900, { size: 26, color: C.soft, alpha: A5 * prog(t, e.same - 0.2, 0.6) * (1 - prog(t, e.used - 0.2, 0.4)) });
        text(ctx, '受约束的是“总和为 0”这一条，不是哪一个数据', 960, 900, { size: 26, color: C.hi, alpha: A5 * prog(t, e.used + 0.2, 0.5) });
      }
    },
  });

  // =====================================================================
  // 5F  generalisations: two groups; a fitted line; p parameters
  // =====================================================================
  const f = {
    start: e.end,
    equal: A('如果两组数据的方差相同'),
    each: A('两组各用掉一条信息来确定自己的均值'),
    df2: A('自由度是 n 一加 n 二减 2'),
    line: A('用一条直线拟合散点时'),
    two: A('就用掉两条信息'),
    np: A('一般地，要定 p 个数'),
    end: S.g1,
  };
  const gA = [0.4, 1.3, -0.5, 0.9, 0.1, 1.6], gB = [2.6, 3.3, 2.1, 3.0, 2.4];
  const mA = gA.reduce((p, q) => p + q, 0) / gA.length, mB = gB.reduce((p, q) => p + q, 0) / gB.length;
  const fDf2 = T(String.raw`(n_1-1)+(n_2-1)=n_1+n_2-2`);
  const fNm2 = T(String.raw`n-2`), fNmp = T(String.raw`n-p`);
  // scatter for the fitted line
  const gs = normalSampler(61);
  const sx = [0.5, 1.1, 1.6, 2.2, 2.8, 3.3, 3.9, 4.4, 5.0, 5.6];
  const sy = sx.map((x) => 0.8 + 0.55 * x + 0.45 * gs());
  const fit = (() => {
    const n = sx.length, mx = sx.reduce((p, q) => p + q, 0) / n, my = sy.reduce((p, q) => p + q, 0) / n;
    let sxy = 0, sxx = 0;
    sx.forEach((x, i) => { sxy += (x - mx) * (sy[i] - my); sxx += (x - mx) ** 2; });
    const b1 = sxy / sxx;
    return [my - b1 * mx, b1];
  })();
  const PS = new Plot({ x: 1080, y: 300, w: 640, h: 420, xr: [0, 6], yr: [0, 5] });
  layers.push({
    t0: f.start - 0.6,
    t1: f.end + 1.2,
    draw(ctx, t) {
      const A6 = prog(t, f.start - 0.2, 0.8) * (1 - prog(t, f.end + 0.1, 0.9, ease.inOut));
      if (A6 <= 0) return;
      // two groups
      const pg = prog(t, f.equal, 0.7);
      if (pg > 0) {
        const axG = new Axis({ x0: 140, x1: 860, y: 0, v0: -1, v1: 4 });
        const rowsG = [[gA, mA, 470, 'n₁'], [gB, mB, 650, 'n₂']];
        rowsG.forEach(([g, m, y], r) => {
          line(ctx, axG.x0, y, axG.x1, y, { color: C.axis, width: 2, alpha: A6 * pg });
          const pe = prog(t, f.each + r * 0.6, 0.6);
          line(ctx, axG.X(m), y + 14, axG.X(m), y - 90, { color: C.xbar, width: 2.5, alpha: A6 * pe });
          g.forEach((x) => {
            dot(ctx, axG.X(x), y, 8, { color: C.data, alpha: A6 * pg });
            if (pe > 0) arrow(ctx, axG.X(m), y - 30, axG.X(x), y - 30, { color: C.dev, width: 2, head: 9, alpha: A6 * pe * 0.8 });
          });
          text(ctx, r === 0 ? '第一组' : '第二组', axG.x0 - 20, y, { size: 24, color: C.soft, alpha: A6 * pg, align: 'right' });
          text(ctx, r === 0 ? '6 个数据，用掉 1 条' : '5 个数据，用掉 1 条', axG.X(m), y + 46, { size: 22, color: C.xbar, alpha: A6 * pe });
        });
        const pd = prog(t, f.df2 - 0.2, 1.2, ease.linear);
        if (pd > 0) drawTex(ctx, fDf2, 500, 790, 42, { alpha: A6 * clamp(pd * 3), write: pd });
        text(ctx, '两组方差相同，合起来估计', 500, 330, { size: 28, color: C.text, alpha: A6 * pg });
      }
      // fitted line
      const pl = prog(t, f.line, 0.7);
      if (pl > 0) {
        line(ctx, PS.x, PS.Y(0), PS.x + PS.w, PS.Y(0), { color: C.axis, width: 2, alpha: A6 * pl });
        line(ctx, PS.x, PS.Y(0), PS.x, PS.y, { color: C.axis, width: 2, alpha: A6 * pl });
        sx.forEach((x, i) => dot(ctx, PS.X(x), PS.Y(sy[i]), 8, { color: C.data, alpha: A6 * pl }));
        const pf = prog(t, f.line + 1.2, 1.0, ease.inOut);
        const [b0, b1] = fit;
        line(ctx, PS.X(0), PS.Y(b0), PS.X(lerp(0, 6, pf)), PS.Y(b0 + b1 * lerp(0, 6, pf)), { color: C.xbar, width: 3, alpha: A6 * pl });
        if (pf >= 1) sx.forEach((x, i) => line(ctx, PS.X(x), PS.Y(sy[i]), PS.X(x), PS.Y(b0 + b1 * x), { color: C.dev, width: 1.5, dash: [3, 4], alpha: A6 * 0.8 }));
        text(ctx, '直线：斜率、截距两个数', PS.x + PS.w / 2, 250, { size: 28, color: C.text, alpha: A6 * prog(t, f.line + 1.6, 0.6) });
        const p2 = prog(t, f.two, 0.6);
        if (p2 > 0) {
          text(ctx, '用掉 2 条，自由度', PS.x + PS.w / 2 - 50, 790, { size: 30, color: C.text, alpha: A6 * p2 });
          drawTex(ctx, fNm2, PS.x + PS.w / 2 + 115, 792, 42, { alpha: A6 * p2, align: 'l' });
        }
      }
      // general rule
      const pp = prog(t, f.np, 0.6);
      if (pp > 0) {
        rich(ctx, LB.np, 1136, 900, { size: 32, color: C.hi, alpha: A6 * pp, align: 'right' });
        drawTex(ctx, fNmp, 1150, 902, 44, { color: C.hi, alpha: A6 * pp, align: 'l' });
      }
    },
  });

  return { layers };
}
