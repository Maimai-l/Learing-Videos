// Title card before the narration starts.
import { C, W, H } from '../engine/theme.js';
import { tex, drawTex } from '../engine/tex.js';
import { text, measure, poly, Plot, rich } from '../engine/draw.js';
import { prog, ease, clamp, normPdf, tPdf, rgba } from '../engine/util.js';

export function buildTitle(N) {
  const T = N.tl.title; // narration starts at T
  const tItalic = tex('t', { inline: true });
  const sub1 = tex('n-1', { inline: true });
  const sub2 = tex('t', { inline: true });
  const plot = new Plot({ x: 360, y: 640, w: 1200, h: 300, xr: [-5, 5], yr: [0, 0.42] });
  const nPts = plot.curve((x) => normPdf(x), -5, 5, 300);
  const tPts = plot.curve((x) => tPdf(x, 2), -5, 5, 300);

  return [
    {
      t0: 0,
      t1: T + 0.6,
      draw(ctx, t) {
        const out = prog(t, T - 1.1, 1.0, ease.inOut);
        const a = 1 - out;
        // faint curves: the standard normal and a t distribution
        const pc = prog(t, 0.5, 3.4, ease.inOut);
        poly(ctx, nPts, { color: C.normal, width: 2, alpha: 0.32 * a, progress: pc });
        poly(ctx, tPts, { color: C.t, width: 2, alpha: 0.38 * a, progress: prog(t, 1.1, 3.4, ease.inOut) });
        // title: italic t from the math font + serif Chinese
        const pin = prog(t, 0.6, 1.4, ease.out);
        const y = 470 - out * 30 + (1 - pin) * 14;
        const size = 104;
        const cn = '检验与自由度';
        const wCn = measure(ctx, cn, size, 600, 'serif');
        const wT = tItalic.width(size * 1.28);
        const gap = 26;
        const x0 = W / 2 - (wT + gap + wCn) / 2;
        drawTex(ctx, tItalic, x0, y + size * 0.36, size * 1.28, { align: 'l', valign: 'b', alpha: a * pin, write: prog(t, 0.5, 1.2) });
        text(ctx, cn, x0 + wT + gap, y, { size, weight: 600, family: 'serif', align: 'left', alpha: a * pin, letter: 4 });
        // thin rule and the subtitle
        const pr = prog(t, 1.5, 1.2, ease.inOut);
        const lw = 520 * pr;
        ctx.save();
        ctx.strokeStyle = rgba(C.faint, a);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lw / 2, y + 96);
        ctx.lineTo(W / 2 + lw / 2, y + 96);
        ctx.stroke();
        ctx.restore();
        const ps = prog(t, 2.0, 1.2, ease.out);
        rich(ctx, ['为什么除以 ', sub1, ' 　·　 ', sub2, ' 分布从哪里来'], W / 2, y + 152, { size: 34, color: C.soft, alpha: a * ps, texScale: 1.15 });
        // fade in from black at the very start
        const fin = 1 - prog(t, 0, 0.9, ease.out);
        if (fin > 0) {
          ctx.fillStyle = `rgba(0,0,0,${fin})`;
          ctx.fillRect(0, 0, W, H);
        }
      },
    },
  ];
}
