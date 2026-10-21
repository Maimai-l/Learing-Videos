// 小样：把 references/animation/ 里几个亮点做法，用我们自己的写法各做一节。
// 每一帧都由 render(ctx, t) 画出，只由 t 决定；拖动进度条、倒退、变速都能对上。
//
//   一、函数变形（explanaria）：两个映射之间逐点插值，每个点按位置错开起步
//   二、矩阵变换（matrix-arcade）：矩阵逐个元素线性插值；残影也写成 t 的函数
//   三、光波干涉（3b1b-diffraction）：WebGL 片元着色器逐像素叠加波源，再画回 2D 画布
//   四、萤火虫同步（The science of complexity）：有状态的模拟先一次算完存成表，播放时按 t 查表
import { startPlayer } from '../../player/player.js';

const W = 1920, H = 1080;
const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
const TAU = Math.PI * 2;

const chapters = [
  { title: '函数变形', start: 0 },
  { title: '矩阵变换', start: 12 },
  { title: '光波干涉', start: 24 },
  { title: '萤火虫同步', start: 36 },
];
const DURATION = 48;

// [start, end, text]
const cues = [
  [0.6, 5.6, '每个点按位置错开起步，整张网格从左到右流向新形状'],
  [6.2, 11.2, '两个形状之间逐点插值，进度只由时间决定'],
  [12.6, 17.6, '矩阵的四个数逐个线性插值，拖到哪里，变换就到哪里'],
  [18.0, 23.2, '残影不用记住上一帧：把前几刻的位置淡淡地再画一遍'],
  [24.6, 29.6, '每个像素把两个波源的波加起来，GPU 一次算完整幅画面'],
  [30.4, 35.4, '换成强度来看：亮纹和暗纹就是干涉'],
  [36.6, 41.6, '萤火虫各闪各的，彼此影响变强以后，慢慢闪到一起'],
  [42.0, 47.2, '模拟要一步步推进，所以先一次算完存下来，播放时按时间查表'],
];

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => x * x * (3 - 2 * x);
const prog = (t, t0, dur) => smooth(clamp((t - t0) / dur));
const lerp = (a, b, p) => a + (b - a) * p;

// a scene fades in at its start and out at its end
const sceneAlpha = (t, c0, c1) => prog(t, c0, 0.6) * (1 - prog(t, c1 - 0.6, 0.6));

// deterministic random numbers, so every load (and every preview) draws the same thing
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function background(ctx) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, '#141B27');
  g.addColorStop(1, '#07090D');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
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

// ---------------------------------------------------------------- 一、函数变形
// Explanaria 的 TransitionTo：新旧两个表达式逐点 lerp，staggerFraction 让第 i 个点晚一点起步。
// 这里用点的横坐标代替编号，网格就从左到右依次流过去。
const MAPS = [
  (x, y) => [x, y],
  (x, y) => [x, y + 0.42 * Math.sin(2.4 * x)],
  (x, y) => [0.5 * (x * x - y * y) - 0.45, x * y], // 复平面上的 z²/2，左移一点让它居中
];
const X0 = -1.7, X1 = 1.7, Y0 = -0.95, Y1 = 0.95;
const STAGGER = 0.55; // 第一个点和最后一个点起步时间之差，占整段的比例

// per-point progress: p is the whole move's progress, k in [0, 1] the point's place in line
const staggered = (p, k) => smooth(clamp((p - STAGGER * k) / (1 - STAGGER)));

function morphPoint(x, y, u) {
  const k = (x - X0) / (X1 - X0);
  const steps = [
    [1.4, 5.4, 0, 1],
    [6.4, 10.6, 1, 2],
  ];
  let [px, py] = MAPS[0](x, y);
  for (const [a, b, from, to] of steps) {
    if (u < a) break;
    const q = staggered((u - a) / (b - a), k);
    const f = MAPS[from](x, y), g = MAPS[to](x, y);
    [px, py] = [lerp(f[0], g[0], q), lerp(f[1], g[1], q)];
  }
  return [px, py];
}

function sceneMorph(ctx, u, alpha) {
  const cx = W / 2, cy = 500, s = 330;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = ctx.lineCap = 'round';
  const line = (pts, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const [px, py] = morphPoint(x, y, u);
      const X = cx + px * s, Y = cy - py * s;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.stroke();
  };
  const N = 90;
  for (let j = 0; j <= 10; j++) {
    const y = lerp(Y0, Y1, j / 10);
    line(Array.from({ length: N + 1 }, (_, i) => [lerp(X0, X1, i / N), y]), j === 5 ? '#B9C0CE' : '#3A4252', j === 5 ? 3 : 2);
  }
  for (let i = 0; i <= 16; i++) {
    const x = lerp(X0, X1, i / 16);
    line(Array.from({ length: N + 1 }, (_, j) => [x, lerp(Y0, Y1, j / N)]), i === 8 ? '#B9C0CE' : '#3A4252', i === 8 ? 3 : 2);
  }
  // one curve in colour, to follow by eye
  line(Array.from({ length: 160 }, (_, i) => [lerp(X0, X1, i / 159), 0.55 * Math.cos(2 * lerp(X0, X1, i / 159))]), '#5CB6FF', 5);
  ctx.restore();
}

// ---------------------------------------------------------------- 二、矩阵变换
// Matrix Arcade：矩阵从单位阵逐个元素线性插值，进度条的位置就是变换的程度。
// 残影（它用 AfterimagePass 后期处理）在这里写成纯函数：把 u 之前几刻的位置再画一遍，越早越淡。
const KEYS = [
  [0, [1, 0, 0, 1]],
  [1.5, [1, 0, 0, 1]],
  [4.0, [1, 1, 0, 1]], // 剪切
  [5.0, [1, 1, 0, 1]],
  [8.0, [0, -1, 1, 0]], // 旋转 90°（逐元素插值时中途会缩小，正是它的样子）
  [8.6, [0, -1, 1, 0]],
  [11.2, [1.4, 0.6, -0.4, 1.1]],
];
function matrixAt(u) {
  if (u <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, m1] = KEYS[i], [t0, m0] = KEYS[i - 1];
    if (u <= t1) {
      const p = (u - t0) / (t1 - t0); // linear on purpose: progress is proportional to time
      return m0.map((v, k) => lerp(v, m1[k], p));
    }
  }
  return KEYS[KEYS.length - 1][1];
}

function sceneMatrix(ctx, u, alpha) {
  const cx = W / 2, cy = 500, s = 105;
  const M = matrixAt(u);
  const T = ([x, y], m = M) => [cx + (m[0] * x + m[1] * y) * s, cy - (m[2] * x + m[3] * y) * s];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  // the original grid, faint, for comparison
  ctx.strokeStyle = 'rgba(58,66,82,0.45)';
  ctx.lineWidth = 1.5;
  for (let k = -9; k <= 9; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + k * s, cy - 6 * s);
    ctx.lineTo(cx + k * s, cy + 6 * s);
    ctx.moveTo(cx - 9.5 * s, cy - k * s);
    ctx.lineTo(cx + 9.5 * s, cy - k * s);
    ctx.stroke();
  }
  // the transformed grid
  ctx.strokeStyle = '#3A4252';
  ctx.lineWidth = 2;
  for (let k = -12; k <= 12; k++) {
    ctx.beginPath();
    let [a, b] = [T([k, -12]), T([k, 12])];
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    [a, b] = [T([-12, k]), T([12, k])];
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  // the unit square
  ctx.fillStyle = 'rgba(233,236,242,0.08)';
  ctx.beginPath();
  [[0, 0], [1, 0], [1, 1], [0, 1]].forEach((p, i) => (i ? ctx.lineTo(...T(p)) : ctx.moveTo(...T(p))));
  ctx.fill();
  // a vector with a trail: earlier moments, drawn again, fainter the older they are
  const v = [1.6, 1.1];
  for (let k = 14; k >= 1; k--) {
    const [x, y] = T(v, matrixAt(u - k * 0.05));
    ctx.fillStyle = `rgba(255,224,138,${0.5 * (1 - k / 15) ** 2})`;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, TAU);
    ctx.fill();
  }
  const arrow = (to, color) => {
    const [x0, y0] = T([0, 0]), [x1, y1] = T(to);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 - 18 * Math.cos(ang), y1 - 18 * Math.sin(ang));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 26 * Math.cos(ang - 0.4), y1 - 26 * Math.sin(ang - 0.4));
    ctx.lineTo(x1 - 26 * Math.cos(ang + 0.4), y1 - 26 * Math.sin(ang + 0.4));
    ctx.fill();
  };
  arrow([1, 0], '#5CB6FF');
  arrow([0, 1], '#FFB34D');
  const [vx, vy] = T(v);
  ctx.fillStyle = '#FFE08A';
  ctx.beginPath();
  ctx.arc(vx, vy, 10, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- 三、光波干涉
// 3b1b 的 diffraction.wgsl：每个像素把各个点波源的波相加，相位 = 距离 / 波长 - 频率 × 时间。
// 画面只由像素位置和 t 决定，用 WebGL 一次算完，再 drawImage 回 2D 画布。
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uS0;
uniform vec2 uS1;
uniform float uMode; // 0: the wave at this instant, 1: its strength (intensity)
uniform vec4 uView;  // xmin, ymin, xmax, ymax in field units
const float TAU = 6.2831853;
const float LAMBDA = 0.32;
const float FREQ = 0.9;
vec2 wave(vec2 p, vec2 s) {
  float d = length(p - s);
  float ph = TAU * (d / LAMBDA - FREQ * uT);
  return vec2(cos(ph), sin(ph)) / sqrt(max(d, 0.06));
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = mix(uView.xy, uView.zw, uv);
  vec2 sum = wave(p, uS0) + wave(p, uS1);
  float now = 0.5 + 0.5 * clamp(sum.x * 0.55, -1.0, 1.0);
  float strength = clamp(dot(sum, sum) * 0.2, 0.0, 1.0);
  float v = mix(now, strength, uMode);
  vec3 dark = vec3(0.027, 0.035, 0.051), light = vec3(0.62, 0.78, 1.0);
  gl_FragColor = vec4(mix(dark, light, v), 1.0);
}`;
const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

let gl = null, glCanvas = null, glProg = null, glFailed = false;
function setupGL() {
  if (gl || glFailed) return !!gl;
  glCanvas = document.createElement('canvas');
  gl = glCanvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
  if (!gl) return !(glFailed = true);
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  glProg = gl.createProgram();
  gl.attachShader(glProg, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(glProg, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(glProg);
  gl.useProgram(glProg);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(glProg, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return true;
}

const VIEW = [-4.8, -2.7, 4.8, 2.7]; // field units across the whole frame
const sourcesAt = (u) => {
  const d = lerp(0.45, 1.1, prog(u, 1, 4));
  return [[-d, 0], [d, 0]];
};

function sceneWaves(ctx, u, alpha, scale) {
  const [s0, s1] = sourcesAt(u);
  const mode = prog(u, 6, 1.6);
  if (setupGL()) {
    // the shader works in screen pixels: size its canvas to what this frame needs
    const pw = Math.max(2, Math.round(W * scale)), ph = Math.max(2, Math.round(H * scale));
    if (glCanvas.width !== pw || glCanvas.height !== ph) {
      glCanvas.width = pw;
      glCanvas.height = ph;
    }
    gl.viewport(0, 0, pw, ph);
    const U = (n) => gl.getUniformLocation(glProg, n);
    gl.uniform2f(U('uRes'), pw, ph);
    gl.uniform1f(U('uT'), u);
    gl.uniform2f(U('uS0'), s0[0], s0[1]);
    gl.uniform2f(U('uS1'), s1[0], s1[1]);
    gl.uniform1f(U('uMode'), mode);
    gl.uniform4f(U('uView'), ...VIEW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(glCanvas, 0, 0, W, H);
    ctx.restore();
  }
  // the sources, drawn on top in 2D
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const [x, y] of [s0, s1]) {
    const X = ((x - VIEW[0]) / (VIEW[2] - VIEW[0])) * W, Y = H - ((y - VIEW[1]) / (VIEW[3] - VIEW[1])) * H;
    ctx.fillStyle = '#FFE08A';
    ctx.beginPath();
    ctx.arc(X, Y, 11, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 四、萤火虫同步
// Kuramoto 模型：dθᵢ/dt = ωᵢ + K r sin(ψ − θᵢ)。它必须一步步积分，不能直接从 t 算出来，
// 所以第一次用到时把整段一次算完存成表，render 只按 t 查表（两步之间线性插值）。
const FLY_N = 150, FLY_DT = 1 / 120, FLY_T = 12;
const KOFF = 2, KON = 7, KMAX = 4; // coupling: off, then ramps up between KOFF and KON (scene seconds)
let flies = null;
function simulateFlies() {
  if (flies) return flies;
  const rnd = mulberry32(7);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(TAU * rnd());
  const pos = [], omega = new Float32Array(FLY_N), theta = new Float64Array(FLY_N);
  const cols = 15, rows = 10;
  for (let i = 0; i < FLY_N; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    pos.push([300 + (c + 0.5 + (rnd() - 0.5) * 0.7) * (1320 / cols), 150 + (r + 0.5 + (rnd() - 0.5) * 0.7) * (600 / rows)]);
    omega[i] = TAU * (0.8 + 0.12 * gauss());
    theta[i] = TAU * rnd();
  }
  const steps = Math.ceil(FLY_T / FLY_DT) + 1;
  const table = new Float32Array(steps * FLY_N);
  const order = new Float32Array(steps);
  for (let s = 0; s < steps; s++) {
    let cx = 0, cy = 0;
    for (let i = 0; i < FLY_N; i++) {
      cx += Math.cos(theta[i]);
      cy += Math.sin(theta[i]);
      table[s * FLY_N + i] = theta[i]; // unwrapped, so interpolating between steps is safe
    }
    const r = Math.hypot(cx, cy) / FLY_N, psi = Math.atan2(cy, cx);
    order[s] = r;
    const K = KMAX * smooth(clamp((s * FLY_DT - KOFF) / (KON - KOFF)));
    for (let i = 0; i < FLY_N; i++) theta[i] += FLY_DT * (omega[i] + K * r * Math.sin(psi - theta[i]));
  }
  return (flies = { pos, table, order, steps });
}

function sceneFlies(ctx, u, alpha) {
  const { pos, table, order, steps } = simulateFlies();
  const f = clamp(u, 0, FLY_T) / FLY_DT;
  const s0 = Math.min(steps - 1, Math.floor(f)), s1 = Math.min(steps - 1, s0 + 1), w = f - s0;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < FLY_N; i++) {
    const th = lerp(table[s0 * FLY_N + i], table[s1 * FLY_N + i], w);
    const b = ((1 + Math.cos(th)) / 2) ** 8; // a short flash once per cycle
    const [x, y] = pos[i];
    ctx.fillStyle = 'rgba(185,192,206,0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, TAU);
    ctx.fill();
    if (b > 0.02) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30);
      g.addColorStop(0, `rgba(255,224,138,${b})`);
      g.addColorStop(1, 'rgba(255,224,138,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, TAU);
      ctx.fill();
    }
  }
  // how much in step they are (the order parameter r), drawn up to now
  const gx0 = 360, gx1 = 1560, gy = 900, gh = 90;
  ctx.strokeStyle = '#3A4252';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx0, gy);
  ctx.lineTo(gx1, gy);
  ctx.stroke();
  ctx.strokeStyle = '#E9ECF2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const last = Math.max(1, Math.floor(f));
  for (let s = 0; s <= last; s += 2) {
    const x = gx0 + ((s * FLY_DT) / FLY_T) * (gx1 - gx0), y = gy - order[Math.min(s, steps - 1)] * gh;
    s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the frame
function render(ctx, t, o) {
  background(ctx);
  const at = (i) => [chapters[i].start, i + 1 < chapters.length ? chapters[i + 1].start : DURATION];
  const scenes = [sceneMorph, sceneMatrix, (c, u, a) => sceneWaves(c, u, a, o.scale), sceneFlies];
  scenes.forEach((draw, i) => {
    const [c0, c1] = at(i);
    const a = sceneAlpha(t, c0, c1);
    if (a > 0) draw(ctx, t - c0, a);
  });
  if (o.subtitles) drawSubtitle(ctx, t, o.subtitleLift || 0);
}

startPlayer({
  title: '小样',
  duration: DURATION,
  width: W,
  height: H,
  render,
  chapters,
  storageKey: 'references-samples/v1',
  load: () => document.fonts.ready.then(() => ({})),
});
