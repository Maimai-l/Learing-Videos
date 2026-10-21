// A 48-second demo video for the player: everything on screen is drawn by
// render(ctx, t), a pure function of the time t.
import { startPlayer } from '../player.js';

const W = 1920, H = 1080, DURATION = 48;
const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

const chapters = [
  { title: '开场', start: 0 },
  { title: '画一条曲线', start: 12 },
  { title: '字幕和小题', start: 28 },
];

// [start, end, text]
const cues = [
  [0.8, 5.2, '这是播放器的示例：每一帧都由 render(ctx, t) 画出来'],
  [5.6, 11.2, '进度条按章节分段，鼠标停在上面能预览那一刻的画面'],
  [12.6, 18.4, '这一节画一条正弦曲线，画到哪里完全由时间 t 决定'],
  [18.8, 26.4, '所以拖动进度条、后退、变速，画面都能立刻对上'],
  [28.6, 35.0, '字幕也画在画布上，控制栏出现时会自动上移'],
  [35.4, 42.6, '每节末尾可以放一道小题，答案和解析点开才看得到'],
];

const quizzes = [
  {
    chapter: 2,
    question: '如果 render(ctx, t) 依赖上一帧留下的状态，而不是只由 t 决定，拖动进度条时会出什么问题？',
    answer: '画面会和时间对不上。',
    explain:
      '播放器随时可能跳到任意时刻，也会为进度条预览单独画某一帧，帧的先后顺序没有保证。\n\n需要“状态”时，从 t 直接算出来，例如“第几个点已经出现”就用 t 和每个点的出现时间比较。',
  },
];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => x * x * (3 - 2 * x);
const prog = (t, t0, dur) => smooth(clamp((t - t0) / dur));

function text(ctx, s, x, y, size, color, alpha = 1, align = 'center', weight = 400) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  ctx.restore();
}

// the plot used by chapter 2
const P = { x0: 360, x1: 1560, y: 560, amp: 220, periods: 2 };
const curveY = (u) => P.y - P.amp * Math.sin(u * Math.PI * 2 * P.periods);

function drawCurve(ctx, t, alpha) {
  const p = prog(t, 13, 12); // the curve is drawn from 13 s to 25 s
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#3A4252';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(P.x0, P.y);
  ctx.lineTo(P.x1, P.y);
  ctx.stroke();
  if (p > 0) {
    ctx.strokeStyle = '#5CB6FF';
    ctx.lineWidth = 5;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath();
    const n = Math.max(2, Math.round(240 * p));
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * p;
      const x = P.x0 + (P.x1 - P.x0) * u;
      i ? ctx.lineTo(x, curveY(u)) : ctx.moveTo(x, curveY(u));
    }
    ctx.stroke();
    // the pen
    const x = P.x0 + (P.x1 - P.x0) * p;
    ctx.fillStyle = '#FFE08A';
    ctx.beginPath();
    ctx.arc(x, curveY(p), 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  text(ctx, `t = ${Math.max(0, t).toFixed(1)} s`, P.x1, P.y + P.amp + 90, 34, '#B9C0CE', alpha, 'right');
}

function drawDots(ctx, t, alpha) {
  // dots appear one by one: each one's state comes from t alone
  for (let i = 0; i < 12; i++) {
    const t0 = 29 + i * 0.9;
    const a = prog(t, t0, 0.5);
    if (a <= 0) continue;
    const x = 420 + i * 98, y = 470 + 60 * Math.sin(i * 0.9);
    ctx.save();
    ctx.globalAlpha = alpha * a;
    ctx.fillStyle = i % 3 === 2 ? '#FFB34D' : '#E9ECF2';
    ctx.beginPath();
    ctx.arc(x, y + (1 - a) * 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSubtitle(ctx, t, lift) {
  const c = cues.find(([a, b]) => t >= a && t <= b + 0.15);
  if (!c) return;
  const a = Math.min(clamp((t - c[0]) / 0.15), clamp((c[1] + 0.15 - t) / 0.15));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `500 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(5,7,10,0.85)';
  const y = H - 62 - lift;
  ctx.strokeText(c[2], W / 2, y);
  ctx.fillStyle = '#F3F5F9';
  ctx.fillText(c[2], W / 2, y);
  ctx.restore();
}

function render(ctx, t, o) {
  // background
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, '#141B27');
  g.addColorStop(1, '#07090D');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // chapter 1: the title
  const a1 = prog(t, 0.3, 1.2) * (1 - prog(t, 11, 1));
  text(ctx, '播放器示例', W / 2, 470, 96, '#E9ECF2', a1, 'center', 700);
  text(ctx, '画面、字幕和章节都由同一条时间轴驱动', W / 2, 580, 36, '#B9C0CE', a1 * prog(t, 1.2, 1));

  // chapter 2: a curve drawn as time passes
  const a2 = prog(t, 12, 0.8) * (1 - prog(t, 27.2, 0.8));
  if (a2 > 0) drawCurve(ctx, t, a2);

  // chapter 3: dots, then the end
  const a3 = prog(t, 28, 0.8) * (1 - prog(t, 44, 1));
  if (a3 > 0) drawDots(ctx, t, a3);
  text(ctx, '完', W / 2, H / 2, 72, '#E9ECF2', prog(t, 45, 1), 'center', 700);

  // the corner mark: current chapter
  let ci = 0;
  while (ci + 1 < chapters.length && t >= chapters[ci + 1].start) ci++;
  if (t > 0.5) text(ctx, chapters[ci].title, 64, 56, 24, '#7D8699', 0.8, 'left');

  if (o.subtitles) drawSubtitle(ctx, t, o.subtitleLift || 0);
}

startPlayer({
  title: '播放器示例',
  duration: DURATION,
  width: W,
  height: H,
  render,
  chapters,
  quizzes,
  storageKey: 'player-demo/v1',
  // wait for the web fonts so the first frame does not flash a fallback face
  load: () => document.fonts.ready.then(() => ({})),
});
