// 九、回到五批数据
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex } from '../engine/tex.js';
import { text, num, line, dot, Axis, Plot, roundRect, rich, richWidth, poly, fillPoly, panel, measure, mixed } from '../engine/draw.js';
import { prog, ease, clamp, rgba, normPdf, tPdf } from '../engine/util.js';
import { DATA, MEAN } from './common.js';
import { makeTitleArt } from './s0_title.js';

const T = (s, o) => tex(s, o);

export function build9(N) {
  const S = N.chapter(9);
  const { A } = S;
  const layers = [];
  const LB = {
    p1: mixed('（双侧 $p\\approx 0.024$）'),
    p2: mixed('（双侧 $p\\approx 0.088$）'),
    five: mixed('只有 5 个数据：$s$ 本身波动很大'),
    wide: mixed('界限放宽到 2.78：$s$ 本身的波动已经算在里面'),
    skew: mixed('数据分布明显不对称、样本又很小时，$t$ 分布只是近似'),
  };

  // =====================================================================
  // 9A  the five batches: t = 2.25 against 1.96 and against 2.78
  // =====================================================================
  const a = {
    start: S.first,
    mean: A('样本均值是 1.1'),
    s: A('s 是 1.093'),
    se: A('除以根号 5 得 0.489'),
    t: A('t 等于 2.25'),
    df: A('自由度是 4'),
    norm: A('如果按正态分布的界限 1.96 来判断'),
    sig: A('结果是显著的'),
    tdist: A('但按自由度为 4 的 t 分布'),
    b278: A('界限是 2.78'),
    ns: A('结果并不显著'),
    only5: A('只有五个数据时'),
    still: A('如果仍然使用正态分布的界限'),
    often: A('就会过于频繁地宣布有了发现'),
    tt: A('t 检验把 s 本身的波动也考虑了进去'),
    end: A('这些结论各有前提'),
  };
  const ax = new Axis({ x0: 420, x1: 1500, y: 232, v0: -1.2, v1: 3.2 });
  const fChain = T(String.raw`\class{a}{\bar{x}=1.1}\qquad\class{b}{s=1.093}\qquad\class{c}{\frac{s}{\sqrt{5}}=0.489}\qquad\class{d}{t=\frac{1.1}{0.489}=2.25}\qquad\class{e}{\nu=4}`);
  const CH = { x: 960, y: 392, size: 42 };
  const fXbar = T(String.raw`\bar{x}=1.1`, { inline: true });
  const fTeq = T('t=2.25', { inline: true });
  const fT4 = T(String.raw`t`, { inline: true }), fNu4 = T(String.raw`\nu=4`, { inline: true });
  const PL = new Plot({ x: 170, y: 640, w: 720, h: 220, xr: [-4.2, 4.2], yr: [0, 0.42] });
  const PR = new Plot({ x: 1030, y: 640, w: 720, h: 220, xr: [-4.2, 4.2], yr: [0, 0.42] });
  const t4 = (x) => tPdf(x, 4);

  // one distribution with its two-sided 5% bounds and the observed t
  function distPlot(ctx, P, pdf, col, b, pa, pc, pb, pm) {
    line(ctx, P.x, P.Y(0), P.x + P.w, P.Y(0), { color: C.axis, width: 2, alpha: pa });
    for (const v of [-4, 0, 4]) num(ctx, v === -4 ? '−4' : String(v), P.X(v), P.Y(0) + 28, 22, { color: C.dim, alpha: pa });
    if (pb > 0) {
      for (const sg of [-1, 1]) {
        const pts = [[P.X(sg * b), P.Y(0)]];
        for (let x = b; x <= 4.2001; x += 0.04) pts.push([P.X(sg * x), P.Y(pdf(x))]);
        pts.push([P.X(sg * 4.2), P.Y(0)]);
        fillPoly(ctx, pts, C.hi, 0.32 * pa * pb);
        line(ctx, P.X(sg * b), P.Y(0) + 8, P.X(sg * b), P.Y(0.2), { color: C.hi, width: 2, alpha: pa * pb });
        num(ctx, (sg < 0 ? '−' : '') + b.toFixed(2), P.X(sg * b), P.Y(0) + 28, 22, { color: C.hi, alpha: pa * pb });
      }
    }
    poly(ctx, P.curve(pdf, -4.2, 4.2, 220), { color: col, width: 3, alpha: pa, progress: pc });
    if (pm > 0) {
      line(ctx, P.X(2.25), P.Y(0) + 8, P.X(2.25), P.Y(0.3), { color: C.xbar, width: 3, alpha: pa * pm });
      drawTex(ctx, fTeq, P.X(2.25), P.Y(0.3) - 24, 26, { color: C.xbar, alpha: pa * pm });
    }
  }

  // a verdict and its p-value, centred together
  function pair(ctx, s1, col, s2, cx, y, al) {
    const w1 = measure(ctx, s1, 26, 500), w2 = richWidth(ctx, s2, { size: 22 });
    const x = cx - (w1 + 10 + w2) / 2;
    text(ctx, s1, x, y, { size: 26, weight: 500, color: col, alpha: al, align: 'left' });
    rich(ctx, s2, x + w1 + 10, y + 1, { size: 22, color: C.dim, alpha: al, align: 'left' });
  }

  layers.push({
    t0: a.start - 0.6,
    t1: a.end + 1.0,
    draw(ctx, t) {
      const A1 = prog(t, a.start - 0.3, 0.8) * (1 - prog(t, a.end - 0.5, 0.8, ease.inOut));
      if (A1 <= 0) return;
      // the five batches, as in chapter one
      const pax = prog(t, a.start, 0.9);
      ax.draw(ctx, { alpha: A1 * pax, ticks: [-1, 0, 1, 2, 3], labels: ['−1', '0', '1', '2', '3'] });
      line(ctx, ax.X(0), ax.y + 8, ax.X(0), ax.y - 120, { color: C.soft, width: 1.5, dash: [6, 7], alpha: A1 * pax * 0.7 });
      text(ctx, '旧工艺', ax.X(0), ax.y - 140, { size: 24, color: C.soft, alpha: A1 * pax });
      DATA.forEach((v, i) => dot(ctx, ax.X(v), ax.y, 10, { color: C.data, alpha: A1 * prog(t, a.start + 0.3 + i * 0.12, 0.5), glow: 0.5 }));
      const pmean = prog(t, a.mean, 0.7);
      if (pmean > 0) {
        line(ctx, ax.X(MEAN), ax.y + 12, ax.X(MEAN), ax.y - 120, { color: C.xbar, width: 3, alpha: A1 * pmean });
        drawTex(ctx, fXbar, ax.X(MEAN), ax.y - 140, 30, { color: C.xbar, alpha: A1 * pmean });
      }
      // the calculation, one step at a time
      const w = (k) => prog(t, k, 0.9, ease.linear);
      const ws = { a: w(a.mean), b: w(a.s), c: w(a.se), d: w(a.t), e: w(a.df) };
      const al = {};
      for (const k in ws) al[k] = clamp(ws[k] * 3);
      const hiS = prog(t, a.only5, 0.6) * (1 - prog(t, a.still, 0.6));
      if (hiS > 0) {
        const bb = fChain.box(CH.x, CH.y, CH.size, 'c', 'm', 'b'), be = fChain.box(CH.x, CH.y, CH.size, 'c', 'm', 'e');
        for (const q of [bb, be]) roundRect(ctx, q.x0 - 14, q.y0 - 12, q.x1 - q.x0 + 28, q.y1 - q.y0 + 24, 10, { fill: C.s, fillAlpha: 0.1 * hiS, stroke: C.s, width: 2, alpha: A1 * hiS });
        rich(ctx, LB.five, (bb.x0 + be.x1) / 2, CH.y + 74, { size: 26, color: C.s, alpha: A1 * hiS });
      }
      drawTex(ctx, fChain, CH.x, CH.y, CH.size, { alpha: A1, writes: ws, alphas: al, colors: { a: C.xbar, b: C.s, d: C.text, e: C.hi } });
      // left: the normal bounds
      const pl = prog(t, a.norm - 0.2, 0.8);
      if (pl > 0) {
        const pa = A1 * pl;
        text(ctx, '按标准正态分布：界限 1.96', PL.x + PL.w / 2, 548, { size: 28, color: C.normal, alpha: pa });
        distPlot(ctx, PL, normPdf, C.normal, 1.96, pa, prog(t, a.norm, 1.0, ease.inOut), prog(t, a.norm + 1.4, 0.6), prog(t, a.norm + 2.4, 0.6));
        const pv = prog(t, a.sig, 0.6);
        if (pv > 0) pair(ctx, '2.25 在界限之外：显著', C.hi, LB.p1, PL.x + PL.w / 2, 596, pa * pv);
        const pw = prog(t, a.often, 0.7);
        if (pw > 0) {
          const ps = prog(t, a.still, 0.6);
          roundRect(ctx, PL.x - 30, 520, PL.w + 60, 436, 16, { stroke: C.neg, width: 2, alpha: A1 * ps * 0.8 });
          text(ctx, '原假设成立时，也有 12.2% 的机会判为显著（本应是 5%）', PL.x + PL.w / 2, 926, { size: 24, color: C.neg, alpha: pa * pw });
        }
      }
      // right: the t bounds
      const pr = prog(t, a.tdist - 0.2, 0.8);
      if (pr > 0) {
        const pa = A1 * pr;
        rich(ctx, ['按 ', fT4, ' 分布（', fNu4, '）：界限 2.78'], PR.x + PR.w / 2, 548, { size: 28, color: C.t, alpha: pa });
        distPlot(ctx, PR, t4, C.t, 2.776, pa, prog(t, a.tdist, 1.0, ease.inOut), prog(t, a.b278, 0.6), prog(t, a.b278 + 0.9, 0.6));
        const pv = prog(t, a.ns, 0.6);
        if (pv > 0) pair(ctx, '2.25 在界限之内：不显著', C.ok, LB.p2, PR.x + PR.w / 2, 596, pa * pv);
        const pk = prog(t, a.tt, 0.7);
        if (pk > 0) {
          roundRect(ctx, PR.x - 30, 520, PR.w + 60, 436, 16, { stroke: C.t, width: 2, alpha: A1 * pk * 0.8 });
          rich(ctx, LB.wide, PR.x + PR.w / 2, 926, { size: 24, color: C.t, alpha: pa * pk });
        }
      }
    },
  });

  // =====================================================================
  // 9B  what each result assumes
  // =====================================================================
  const b = {
    start: a.end,
    r1: A('除以 n 减 1，只要求各个误差平均为 0'),
    same: A('方差相同'),
    unc: A('互不相关'),
    note1: A('前面推导时用了'),
    r2: A('t 分布则要求数据相互独立'),
    normal: A('并且服从同一个正态分布'),
    skew: A('如果数据的分布明显不对称'),
    approx: A('t 分布就只是近似'),
    end: S.g1,
  };
  const fN1 = T('n-1', { inline: true }), fS2 = T('s^2', { inline: true }), fSig2 = T(String.raw`\sigma^2`, { inline: true });
  const fTt = T('t', { inline: true });
  const chips1 = [['误差平均为 0', 'r1'], ['方差相同', 'same'], ['互不相关', 'unc']];
  const chips2 = [['数据相互独立', 'r2'], ['服从同一个正态分布', 'normal']];
  const chipW = (ctx, s) => measure(ctx, s, 28, 500) + 44;
  function chips(ctx, list, cx, y, t, al, col) {
    const ws = list.map(([s]) => chipW(ctx, s));
    let x = cx - (ws.reduce((p, q) => p + q, 0) + 22 * (ws.length - 1)) / 2;
    list.forEach(([s, key], i) => {
      const w = ws[i];
      const p = prog(t, b[key] + (key === 'r1' ? 1.2 : key === 'r2' ? 1.0 : 0.1), 0.5);
      if (p > 0) {
        roundRect(ctx, x, y - 26, w, 52, 26, { fill: col, fillAlpha: 0.12 * p, stroke: col, width: 1.5, alpha: al * p });
        text(ctx, s, x + w / 2, y, { size: 28, weight: 500, color: C.text, alpha: al * p });
      }
      x += w + 22;
    });
  }
  layers.push({
    t0: b.start - 0.6,
    t1: b.end + 1.6,
    draw(ctx, t) {
      const A2 = prog(t, b.start - 0.2, 0.8) * (1 - prog(t, b.end + 0.2, 0.9, ease.inOut));
      if (A2 <= 0) return;
      text(ctx, '这些结论各有前提', 960, 168, { size: 38, weight: 500, color: C.text, alpha: A2 * prog(t, b.start, 0.6) });
      const cx = 960, pw = 1180;
      // the first result: dividing by n − 1
      const p1 = prog(t, b.r1 - 0.3, 0.7);
      if (p1 > 0) {
        panel(ctx, cx - pw / 2, 250, pw, 250, { alpha: A2 * p1 });
        rich(ctx, ['除以 ', fN1, '：', fS2, ' 在重复抽样中平均等于 ', fSig2], cx, 306, { size: 30, color: C.s, alpha: A2 * p1 });
        chips(ctx, chips1, cx, 384, t, A2, C.s);
        const pn = prog(t, b.note1, 0.6);
        text(ctx, '推导时说的是“互不影响”，其实只用到了交叉项平均为 0，也就是不相关', cx, 456, { size: 24, color: C.soft, alpha: A2 * pn });
      }
      // the second result: the t distribution
      const p2 = prog(t, b.r2 - 0.3, 0.7);
      if (p2 > 0) {
        panel(ctx, cx - pw / 2, 540, pw, 250, { alpha: A2 * p2 });
        rich(ctx, [fTt, ' 分布：查出界限 2.78 之类的数'], cx, 596, { size: 30, color: C.t, alpha: A2 * p2 });
        chips(ctx, chips2, cx, 674, t, A2, C.t);
        const pn = prog(t, b.skew, 0.6);
        rich(ctx, LB.skew, cx, 746, { size: 24, color: C.soft, alpha: A2 * pn });
      }
    },
  });

  // =====================================================================
  // the end card
  // =====================================================================
  const art = makeTitleArt();
  const tEnd = N.tl.total;
  const e0 = b.end + 1.0;
  layers.push({
    t0: e0,
    t1: tEnd + 1,
    draw(ctx, t) {
      const pin = prog(t, e0 + 0.2, 1.4, ease.out);
      art(ctx, {
        a: 1,
        pin,
        pc1: prog(t, e0, 2.6, ease.inOut),
        pc2: prog(t, e0 + 0.4, 2.6, ease.inOut),
        pr: prog(t, e0 + 0.8, 1.0, ease.inOut),
        ps: prog(t, e0 + 1.1, 1.0, ease.out),
        write: prog(t, e0 + 0.1, 1.2),
        y: 470 + (1 - pin) * 14,
      });
      const fo = prog(t, tEnd - 1.6, 1.5, ease.inOut);
      if (fo > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fo})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  });

  return { layers };
}
