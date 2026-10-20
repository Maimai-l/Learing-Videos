// 一、五批数据：提出问题
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex } from '../engine/tex.js';
import { text, num, numWidth, labelNum, line, arrow, dot, Axis, span, brace, braceTip, roundRect, rich } from '../engine/draw.js';
import { prog, win, ease, clamp, lerp, keys, rgba, normalSampler, fmt } from '../engine/util.js';
import { DATA, MEAN, batchIcon, checkBadge, stackDots, pickSamples, bez } from './common.js';

export function build1(N) {
  const S = N.chapter(1);
  const { A } = S;
  // ---- when things are said ----
  const tStart = A('一家工厂');
  const tFive = A('五批产品');
  const tRate = A('每一批都测了合格率');
  const tPP = A('看它比旧工艺高出');
  const tv = [A('1.8')];
  tv.push(A('负 0.2', { after: tv[0] }));
  tv.push(A('2.5', { after: tv[1] }));
  tv.push(A('0.3', { after: tv[2] }));
  tv.push(A('1.1', { after: tv[3] }));
  const tAvg = A('平均下来');
  const tAvg11 = A('1.1 个百分点');
  const tUneven = A('不过这五个数并不整齐');
  const tSign = A('有正有负');
  const tMax = A('最大的是');
  const tMin = A('最小的是');
  const tJudge = A('我们要判断的是');
  const tEffect = A('反映的是新工艺的效果');
  const tChance = A('还是随机波动碰巧平均出来的');
  const tForever = A('如果一直这样生产下去');
  const tTrue = A('叫作真实均值');
  const tMuSym = A('记作缪');
  const tNull = A('假如新工艺毫无作用');
  const tMu0 = A('缪就是 0');
  const tHowFar = A('这时，五个数的平均值通常会偏离 0 多远');
  const tCommon = A('如果平均值偏离 0 达到 1.1 是常有的事');
  const tNoInfo = A('这组数据就说明不了什么');
  const tRare = A('只有当这样的偏离很少见时');
  const tEvid = A('它才算得上证据');
  const tEnd = S.g1;

  // ---- formulas ----
  const fAvg = tex(String.raw`\frac{\class{n1}{1.8}\class{n2}{-0.2}+\class{n3}{2.5}+\class{n4}{0.3}+\class{n5}{1.1}}{5}\class{rest}{=\frac{5.5}{5}=}\class{res}{1.1}`);
  const fMu = tex(String.raw`\mu`, { inline: true });
  const fMu0 = tex(String.raw`\mu = 0`, { inline: true });

  // ---- layout ----
  const AX1 = { x0: 300, x1: 1620, y: 720, v0: -1.2, v1: 3.2 };
  const AX2 = { x0: 300, x1: 1620, y: 800, v0: -3.4, v1: 4.2 };
  // one row per batch: icon at the left, a stem from the old level (0) to its value
  const rows = DATA.map((v, i) => ({ y: 190 + i * 94, ix: 430 }));
  const tCollapse = tv[4] + 0.95;
  const axisAt = (t) => {
    const p = prog(t, tForever + 0.2, 1.6, ease.inOut);
    const k = (f) => lerp(AX1[f], AX2[f], p);
    return new Axis({ x0: k('x0'), x1: k('x1'), y: k('y'), v0: k('v0'), v1: k('v1') });
  };

  // ghost samples ("随机波动"): five values from a process with no effect
  const ghosts = pickSamples(7, 5, 0, 1.1, [-0.35, 0.55, 1.1, 0.15]);
  const ghostMean = ghosts.map((g) => g.reduce((a, b) => a + b, 0) / 5);
  const tg0 = tChance + 0.2, tgStep = 0.78;

  // the long run: many batches from a process with mean 0.8
  const MU_ILL = 0.8;
  const gs = normalSampler(2024);
  const stream = Array.from({ length: 360 }, () => MU_ILL + gs());
  const BIN = 0.09;
  const stacked = stackDots(stream, BIN);
  const sStart = tForever + 0.9, sDur = 6.6;
  const landT = stream.map((_, j) => sStart + sDur * Math.pow(j / stream.length, 0.55));
  const runMean = [];
  stream.reduce((acc, v, j) => ((runMean[j] = (acc + v) / (j + 1)), acc + v), 0);

  // two hypothetical worlds for the spread of averages
  const gw = normalSampler(99), gn = normalSampler(123);
  const meansWide = Array.from({ length: 160 }, () => 0.95 * gw());
  const meansNarrow = Array.from({ length: 160 }, () => 0.36 * gn());
  const fracBeyond = (arr) => arr.filter((m) => Math.abs(m) >= MEAN).length / arr.length;
  const fw = fracBeyond(meansWide), fn = fracBeyond(meansNarrow);

  const draw = (ctx, t) => {
    const ax = axisAt(t);
    const endA = 1 - prog(t, tEnd + 0.1, 0.9, ease.inOut);
    const rowsIn = prog(t, tCommon - 0.6, 0.9, ease.inOut); // the main axis gives way to two rows
    const mainA = endA * (1 - rowsIn);

    // ---------- batches: one row each ----------
    const rowsOut = prog(t, tCollapse + 0.3, 0.8, ease.inOut);
    rows.forEach((r, i) => {
      const pin = prog(t, tStart + 0.4 + i * 0.3, 0.8, ease.out);
      const a = pin * (1 - rowsOut);
      if (a <= 0) return;
      const dx = (1 - pin) * -30;
      batchIcon(ctx, r.ix + dx, r.y + 8, 24, a);
      text(ctx, `第 ${i + 1} 批`, 318 + dx, r.y, { size: 26, color: C.soft, alpha: a });
      // a pass rate was measured
      const pb = prog(t, tRate + 0.2 + i * 0.2, 0.45, ease.outBack);
      checkBadge(ctx, r.ix + 42 + dx, r.y - 26, 11 * clamp(pb, 0, 1.2), a * clamp(pb * 1.5));
    });
    // the old process: a dashed vertical line at 0
    const oldA = prog(t, tPP - 0.1, 0.8, ease.inOut) * (1 - rowsOut);
    if (oldA > 0) {
      const ax0 = axisAt(t);
      const x0 = ax0.X(0);
      line(ctx, x0, 150, x0, lerp(150, ax0.y, oldA), { color: C.soft, width: 2, dash: [6, 8], alpha: 0.8 * oldA });
      text(ctx, '旧工艺', x0, 122, { size: 26, color: C.soft, alpha: oldA });
    }

    // ---------- number line ----------
    const axA = prog(t, tPP - 0.2, 1.0, ease.inOut);
    if (mainA > 0 && axA > 0) {
      const ticks = [];
      for (let v = Math.ceil(ax.v0); v <= Math.floor(ax.v1); v++) ticks.push(v);
      ax.draw(ctx, { alpha: mainA, progress: axA, ticks, labels: ticks.map((v) => fmt(v, 0)) });
      text(ctx, '比旧工艺高出（百分点）', ax.x1, ax.y + 74, { size: 24, color: C.dim, align: 'right', alpha: mainA * axA * (1 - prog(t, tForever, 0.6)) });
    }

    // ---------- the five observations ----------
    const ghostOn = win(t, tg0 - 0.1, tg0 + tgStep * 4, 0.3, 0.4);
    const dataBack = prog(t, tHowFar - 0.2, 0.8, ease.inOut);
    const dataAway = prog(t, tForever - 0.2, 0.7, ease.inOut) * (1 - dataBack);
    DATA.forEach((v, i) => {
      const r = rows[i];
      const ps = prog(t, tv[i] - 0.15, 0.55, ease.out); // stem grows while the number is said
      if (ps <= 0) return;
      const pc = prog(t, tCollapse, 0.9, ease.inOut); // all rows drop onto the line together
      const a = mainA * (1 - dataAway) * (1 - 0.72 * ghostOn);
      if (a <= 0) return;
      const x0 = ax.X(0), xv = ax.X(v);
      const xe = lerp(x0, xv, ps);
      const y = lerp(r.y, ax.y, pc);
      // stem from the old level to the value; it travels down with the dot and merges into the line
      if (pc < 1) line(ctx, x0, y, xe, y, { color: C.data, width: 3, alpha: a * 0.5 * (1 - ease.in(pc)) });
      dot(ctx, xe, y, 9, { color: C.data, alpha: a * clamp(ps * 3), glow: 0.6 });
      // value label: beside the dot in the row, above it on the line
      const side = v >= 0 ? 1 : -1;
      const lsize = lerp(30, 26, pc);
      const lw = numWidth(fmt(v, 1), lsize);
      const fly = win(t, tAvg, tAvg + 1.3, 0.2, 0.5); // dim while a copy flies into the formula
      const lx = lerp(xe + side * (18 + lw / 2), xe, pc), ly = lerp(r.y, y - 34, pc);
      num(ctx, fmt(v, 1), lx, ly, lsize, { color: C.data, alpha: a * clamp(ps * 2) * (1 - 0.55 * fly) });
      // highlights: max / min
      const ring = (tt, col) => {
        const q = prog(t, tt, 0.6, ease.out);
        const off = 1 - prog(t, tJudge - 0.3, 0.6);
        if (q > 0 && off > 0) dot(ctx, xe, y, 9 + 9 * q, { fill: false, ring: col, ringWidth: 2.5, alpha: a * off * (0.4 + 0.6 * q) });
      };
      if (v === 2.5) ring(tMax + 0.35, C.hi);
      if (v === -0.2) ring(tMin + 0.35, C.hi);
    });
    // labels for max / min
    const offMM = 1 - prog(t, tJudge - 0.3, 0.6);
    if (mainA > 0) {
      text(ctx, '最大', ax.X(2.5), ax.y - 74, { size: 24, color: C.hi, alpha: mainA * prog(t, tMax + 0.35, 0.5) * offMM });
      text(ctx, '最小', ax.X(-0.2), ax.y - 74, { size: 24, color: C.hi, alpha: mainA * prog(t, tMin + 0.35, 0.5) * offMM });
      // positive / negative sides
      const sg = win(t, tSign, tMax - 0.2, 0.4, 0.5) * mainA;
      if (sg > 0) {
        roundRect(ctx, ax.X(ax.v0), ax.y - 120, ax.X(0) - ax.X(ax.v0), 120, 6, { fill: C.neg, fillAlpha: 0.07, alpha: sg });
        roundRect(ctx, ax.X(0), ax.y - 120, ax.X(ax.v1) - ax.X(0), 120, 6, { fill: C.pos, fillAlpha: 0.06, alpha: sg });
        text(ctx, '负', ax.X(-0.7), ax.y - 96, { size: 26, color: C.neg, alpha: sg });
        text(ctx, '正', ax.X(2.9), ax.y - 96, { size: 26, color: C.pos, alpha: sg });
      }
    }

    // ---------- the average ----------
    const fx = 960, fy = 300;
    const fAll = prog(t, tAvg - 0.1, 0.4) * (1 - prog(t, tJudge - 0.4, 0.7)) * mainA;
    if (fAll > 0) {
      const pw = prog(t, tAvg + 0.45, 1.5, ease.linear);
      const landed = (i) => prog(t, tAvg + i * 0.09, 0.95, ease.inOut);
      const alphas = { '*': 1 };
      for (let i = 0; i < 5; i++) alphas['n' + (i + 1)] = landed(i) >= 1 ? 1 : 0;
      alphas.rest = 1;
      alphas.res = 1;
      const shrink = prog(t, tUneven - 0.2, 0.9, ease.inOut);
      const size = lerp(54, 40, shrink), y = lerp(fy, 190, shrink);
      drawTex(ctx, fAvg, fx, y, size, { alpha: fAll, write: pw, alphas, colors: { res: t > tAvg11 + 0.3 ? C.xbar : C.text, n1: C.data, n2: C.data, n3: C.data, n4: C.data, n5: C.data } });
      // numbers flying from the line into the formula
      DATA.forEach((v, i) => {
        const p = landed(i);
        if (p <= 0 || p >= 1) return;
        const b = fAvg.box(fx, y, size, 'c', 'm', 'n' + (i + 1));
        const sx = ax.X(v), sy = ax.y - 34;
        const lab = fmt(v, 1);
        const x = lerp(sx, b.cx, p), yy = lerp(sy, b.cy, p) - Math.sin(Math.PI * p) * 40;
        num(ctx, lab, x, yy, lerp(26, size * 0.98, p), { color: C.data, alpha: fAll * clamp(p / 0.18) });
      });
    }

    // the blue line at the average
    const pl = prog(t, tAvg11 + 0.35, 0.8, ease.inOut);
    const ghostMeanX = (() => {
      if (ghostOn <= 0) return null;
      const k = clamp(Math.floor((t - tg0) / tgStep), 0, 3);
      const kp = prog(t, tg0 + k * tgStep, 0.45, ease.inOut);
      const prev = k === 0 ? MEAN : ghostMean[k - 1];
      return lerp(prev, ghostMean[k], kp);
    })();
    const blueA = mainA * pl * (1 - dataAway);
    if (blueA > 0) {
      const mx = ax.X(MEAN);
      const top = ax.y - 210;
      const la = blueA * (1 - 0.7 * ghostOn);
      // through the dot, then above its label up to the top
      line(ctx, mx, ax.y + 12, mx, ax.y - 13, { color: C.xbar, width: 3, alpha: la * clamp(pl * 3) });
      if (pl > 0.25) line(ctx, mx, ax.y - 54, mx, lerp(ax.y - 54, top, (pl - 0.25) / 0.75), { color: C.xbar, width: 3, alpha: la });
      labelNum(ctx, '平均', '1.1', mx, top - 24, { size: 26, color: C.xbar, alpha: blueA * (1 - ghostOn) * (1 - prog(t, tForever - 0.3, 0.4)) * clamp((pl - 0.6) * 3) });
    }

    // ---------- effect or chance? ----------
    const qA = win(t, tEffect - 0.1, tForever - 0.4, 0.6, 0.5) * mainA;
    if (qA > 0) {
      const m = ghostMeanX !== null ? ghostMeanX : MEAN;
      const x0 = ax.X(0), x1 = ax.X(m);
      const yb = ax.y - 150;
      if (Math.abs(x1 - x0) > 6) brace(ctx, Math.min(x0, x1), yb, Math.max(x0, x1), yb, { depth: 18, color: C.soft, alpha: qA });
      const [bx, by] = braceTip(Math.min(x0, x1), yb, Math.max(x0, x1), yb, 18, 1, 22);
      const cA = 1 - prog(t, tChance - 0.1, 0.4);
      text(ctx, '新工艺的效果？', bx, by - 8, { size: 28, color: C.text, alpha: qA * cA });
      text(ctx, '随机波动？', bx, by - 8, { size: 28, color: C.text, alpha: qA * prog(t, tChance + 0.1, 0.4) });
      line(ctx, x0, ax.y - 128, x0, ax.y + 6, { color: C.soft, width: 1.5, alpha: qA * 0.6, dash: [4, 6] });
    }
    // ghost samples: what pure chance produces
    if (ghostOn > 0 && mainA > 0) {
      const k = clamp(Math.floor((t - tg0) / tgStep), 0, 3);
      const kp = prog(t, tg0 + k * tgStep, 0.45, ease.inOut);
      ghosts[k].forEach((v, i) => {
        const prev = k === 0 ? DATA[i] : ghosts[k - 1][i];
        const x = ax.X(lerp(prev, v, kp));
        dot(ctx, x, ax.y, 9, { fill: false, ring: C.data, ringWidth: 2.2, alpha: ghostOn * mainA * 0.95 });
      });
      const gx = ax.X(ghostMeanX);
      line(ctx, gx, ax.y + 12, gx, ax.y - 210, { color: C.xbar, width: 3, dash: [10, 8], alpha: ghostOn * mainA });
      labelNum(ctx, '平均', fmt(ghostMeanX, 1), gx, ax.y - 234, { size: 26, color: C.xbar, alpha: ghostOn * mainA });
    }

    // ---------- the long run ----------
    const streamA = mainA * (1 - prog(t, tHowFar - 0.3, 0.9, ease.inOut) * 0.85);
    const shiftP = prog(t, tNull + 0.35, 1.4, ease.inOut);
    const shift = -MU_ILL * shiftP;
    let landedN = 0;
    if (t > sStart - 0.5 && streamA > 0) {
      const d = BIN * ax.unit;
      for (let j = 0; j < stream.length; j++) {
        const tl = landT[j];
        if (t < tl - 0.5) break;
        const sd = stacked[j];
        const x = ax.X(sd.x + shift);
        const yEnd = ax.y - 9 - d * 0.5 - sd.k * d;
        const pf = prog(t, tl - 0.5, 0.5, ease.in);
        const y = lerp(60, yEnd, pf);
        if (pf >= 1) landedN = j + 1;
        dot(ctx, x, y, d * 0.42, { color: C.data, alpha: streamA * (pf < 1 ? clamp(pf * 5) * (0.55 + 0.45 * pf) : 0.62) });
      }
    }
    // running mean -> true mean μ
    const muA = mainA * prog(t, sStart + 0.6, 0.6);
    if (muA > 0) {
      const settled = prog(t, tTrue + 0.1, 1.2, ease.inOut);
      const rm = landedN > 0 ? runMean[landedN - 1] : MU_ILL;
      const m = lerp(rm, MU_ILL, settled) + shift;
      const x = ax.X(m);
      const top = ax.y - 400;
      line(ctx, x, ax.y + 14, x, top, { color: C.mu, width: lerp(2, 3.5, settled), alpha: muA, dash: settled < 1 ? [8, 7] : null });
      // labels
      const la = prog(t, tTrue, 0.6);
      const nameA = muA * la * (1 - prog(t, tMu0 - 0.2, 0.5));
      text(ctx, '真实均值', x, top - 58, { size: 28, color: C.mu, alpha: nameA });
      drawTex(ctx, fMu, x, top - 22, 40, { color: C.mu, alpha: muA * prog(t, tMuSym, 0.5) * (1 - prog(t, tMu0 - 0.2, 0.5)) });
      drawTex(ctx, fMu0, x, top - 22, 40, { color: C.mu, alpha: muA * prog(t, tMu0, 0.5) });
      text(ctx, '假如新工艺无效', x, top - 60, { size: 26, color: C.mu, alpha: muA * win(t, tNull + 0.2, tEnd, 0.5, 0.5) });
      // counter while batches are being produced
      const ca = win(t, sStart + 0.2, tTrue + 1.5, 0.4, 0.6) * mainA;
      if (ca > 0) {
        text(ctx, `已生产 ${landedN} 批`, 1620, 170, { size: 26, color: C.dim, align: 'right', alpha: ca });
      }
    }
    // how far does the average stray from 0?
    const hA = mainA * prog(t, tHowFar + 0.3, 0.7);
    if (hA > 0) {
      const x0 = ax.X(0), x1 = ax.X(MEAN);
      const yy = ax.y - 96;
      span(ctx, x0, x1, yy, { color: C.xbar, alpha: hA, progress: prog(t, tHowFar + 0.4, 0.7) });
      text(ctx, '偏离多远？', (x0 + x1) / 2, yy - 32, { size: 28, color: C.text, alpha: hA * prog(t, tHowFar + 0.9, 0.5) });
    }

    // ---------- two possible spreads of the average ----------
    if (rowsIn > 0) {
      const rows = [
        { y: 470, means: meansWide, tIn: tCommon + 0.2, frac: fw, tag: '常有', tLab: tNoInfo },
        { y: 800, means: meansNarrow, tIn: tRare + 0.1, frac: fn, tag: '少见', tLab: tEvid },
      ];
      const rax = (y) => new Axis({ x0: 420, x1: 1500, y, v0: -2.6, v1: 2.6 });
      rows.forEach((r, ri) => {
        const ra = rowsIn * endA * prog(t, r.tIn - 0.3, 0.6);
        if (ra <= 0) return;
        const a2 = rax(r.y);
        a2.draw(ctx, { alpha: ra, ticks: [-2, -1, 0, 1, 2], labels: ['−2', '−1', '0', '1', '2'], arrow: false });
        // shaded |deviation| >= 1.1 regions
        for (const [xa, xb] of [[a2.x0, a2.X(-MEAN)], [a2.X(MEAN), a2.x1]]) {
          const g = ctx.createLinearGradient(0, r.y, 0, r.y - 170);
          g.addColorStop(0, rgba(C.err, 0.13 * ra));
          g.addColorStop(1, rgba(C.err, 0));
          ctx.fillStyle = g;
          ctx.fillRect(xa, r.y - 170, xb - xa, 170);
          line(ctx, xa, r.y, xb, r.y, { color: C.err, width: 3, alpha: ra * 0.85 });
        }
        line(ctx, a2.X(0), r.y + 10, a2.X(0), r.y - 170, { color: C.mu, width: 2.5, alpha: ra });
        line(ctx, a2.X(MEAN), r.y + 10, a2.X(MEAN), r.y - 170, { color: C.xbar, width: 2.5, alpha: ra });
        line(ctx, a2.X(-MEAN), r.y + 10, a2.X(-MEAN), r.y - 170, { color: C.xbar, width: 2, dash: [7, 7], alpha: ra * 0.8 });
        num(ctx, '1.1', a2.X(MEAN), r.y - 190, 26, { color: C.xbar, alpha: ra });
        num(ctx, '−1.1', a2.X(-MEAN), r.y - 190, 26, { color: C.xbar, alpha: ra * 0.8 });
        // averages landing one by one
        const st = stackDots(r.means, 0.06);
        const d = 0.06 * a2.unit;
        st.forEach((sd, j) => {
          const tl = r.tIn + 2.4 * Math.pow(j / r.means.length, 0.7);
          const pf = prog(t, tl - 0.35, 0.35, ease.in);
          if (pf <= 0) return;
          const beyond = Math.abs(sd.v) >= MEAN;
          const y = lerp(r.y - 260, r.y - 8 - d * 0.5 - sd.k * d, pf);
          dot(ctx, a2.X(sd.x), y, d * 0.4, { color: beyond ? C.err : '#7E9CC4', alpha: ra * (0.5 + 0.5 * pf) });
        });
        // verdict at the right
        const va = ra * prog(t, r.tIn + 2.6, 0.6);
        text(ctx, r.tag, 1640, r.y - 70, { size: 40, weight: 500, color: ri === 0 ? C.text : C.hi, alpha: va, align: 'left' });
        text(ctx, `偏离 ≥ 1.1：${Math.round(r.frac * 100)}%`, 1640, r.y - 22, { size: 24, color: C.dim, alpha: va, align: 'left' });
        text(ctx, ri === 0 ? '平均值波动大' : '平均值波动小', 300, r.y - 70, { size: 26, color: C.soft, alpha: ra, align: 'left' });
      });
    }
  };

  return [{ t0: tStart - 0.5, t1: tEnd + 1.2, draw }];
}
