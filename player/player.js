// A web player for videos that are drawn on a canvas, frame by frame, as a
// function of time. The soundtrack (if any) is the clock; every animation frame
// calls render(ctx, t) at screen resolution. Around the picture: controls,
// chapters, quiz checkpoints, a scrub preview and settings kept in localStorage.
//
//   import { startPlayer } from './player.js';
//   startPlayer({
//     title: '视频标题',
//     duration: 125,                         // seconds
//     render(ctx, t, o) { ... },             // draw the frame at time t (see README.md)
//     chapters: [{ title: '开场', start: 0 }, { title: '第二部分', start: 40 }],
//     quizzes: [{ chapter: 1, question: '…', answer: '…', explain: '…' }],
//     audio: 'soundtrack.m4a',
//   });
//
// Everything about the video comes from the config; see README.md for every field.
// window.__tp exposes a small API for automated screenshots and debugging.

const SPEEDS = [0.75, 1, 1.25, 1.5];
const IDLE_MS = 2500; // controls hide after this long without the mouse moving
const CARD_MS = 8000; // the quiz card fades after this long (while playing)
const RESUME_MIN = 10; // offer to resume beyond this position (seconds)
const SEEK_SMALL = 5;
const SEEK_LARGE = 10;

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const pad2 = (n) => String(n).padStart(2, '0');
export function fmtTime(s) {
  s = Math.max(0, Math.floor(s + 1e-6));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
}
// spoken form for screen readers: 3 分 12 秒
const fmtSpoken = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), r = s % 60;
  return m ? `${m} 分 ${r} 秒` : `${r} 秒`;
};
const fmtRate = (r) => `${r}×`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paras = (s) => String(s || '').split(/\n\s*\n/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
const ease = (p) => 1 - Math.pow(1 - p, 3);
// 1 → 一, 9 → 九, 12 → 十二, 25 → 二十五 (chapter numbers and counts in the Chinese UI)
const CN = '零一二三四五六七八九';
export function cnNum(n) {
  n = Math.floor(n);
  if (!(n >= 0 && n < 100)) return String(n);
  if (n < 10) return CN[n];
  const tens = Math.floor(n / 10), ones = n % 10;
  return (tens > 1 ? CN[tens] : '') + '十' + (ones ? CN[ones] : '');
}

function openStore(key) {
  let data = {};
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : null;
    if (v && typeof v === 'object') data = v;
  } catch {
    /* storage unavailable: settings last for this visit only */
  }
  return {
    data,
    save() {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    },
  };
}

// ---------------------------------------------------------------- icons
// 24 × 24 grid, drawn in the spirit of SF Symbols: 1.7 px strokes, round caps (see player.css).
const svg = (body, cls = '') => `<svg class="tp-i ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const ICON = {
  play: svg('<path class="tp-solid" d="M7.6 5.3v13.4c0 .9 1 1.4 1.7.9l10.4-6.7c.7-.4.7-1.4 0-1.8L9.3 4.4c-.7-.5-1.7 0-1.7.9z"/>'),
  pause: svg('<rect class="tp-solid" x="6.2" y="4.8" width="4" height="14.4" rx="1.3"/><rect class="tp-solid" x="13.8" y="4.8" width="4" height="14.4" rx="1.3"/>'),
  replay: svg('<path d="M5.3 14.6A7.2 7.2 0 1 0 7.2 7"/><path d="M6.6 3.6v3.9h3.9"/>'),
  vol: svg('<path class="tp-solid" d="M3.4 9.4c0-.6.4-1 1-1h2.5l4-3.5c.6-.5 1.6-.1 1.6.8v12.6c0 .9-1 1.3-1.6.8l-4-3.5H4.4c-.6 0-1-.4-1-1z"/><path class="tp-w1" d="M15.4 9.3a3.9 3.9 0 0 1 0 5.4"/><path class="tp-w2" d="M18.1 6.6a7.6 7.6 0 0 1 0 10.8"/><path class="tp-x" d="m15.6 9.7 4.6 4.6m0-4.6-4.6 4.6"/>'),
  subs: svg('<path class="tp-cc" d="M5.6 4.6h12.8a2.6 2.6 0 0 1 2.6 2.6v7.6a2.6 2.6 0 0 1-2.6 2.6h-7.3l-4 3c-.4.3-1 0-1-.5v-2.5h-.5A2.6 2.6 0 0 1 3 14.8V7.2a2.6 2.6 0 0 1 2.6-2.6z"/><path class="tp-cc-l" d="M7.4 9.4h9.2M7.4 12.8h5.6"/>'),
  speed: svg('<path d="M4.3 17.2a8.6 8.6 0 1 1 15.4 0"/><path d="m12 13.6 3.7-4.4"/><circle class="tp-solid" cx="12" cy="13.6" r="1.7"/>'),
  list: svg('<path d="M9.4 6.6h10M9.4 12h10M9.4 17.4h10"/><circle class="tp-solid" cx="5" cy="6.6" r="1.25"/><circle class="tp-solid" cx="5" cy="12" r="1.25"/><circle class="tp-solid" cx="5" cy="17.4" r="1.25"/>'),
  full: svg('<path d="M14 4.4h5.6V10M19.6 4.4l-6 6M10 19.6H4.4V14M4.4 19.6l6-6"/>'),
  unfull: svg('<path d="M19.6 10H14V4.4M14 10l6-6M4.4 14H10v5.6M10 14l-6 6"/>'),
  check: svg('<path d="m5.8 12.4 4 4 8.4-8.6"/>'),
  chevron: svg('<path d="m10 7.4 4.6 4.6-4.6 4.6"/>'),
  left: svg('<path d="m14 7.4-4.6 4.6 4.6 4.6"/>'),
};

// ---------------------------------------------------------------- markup
function shellHTML() {
  return `
<div class="tp-stage" data-r="stage">
  <canvas class="tp-canvas" data-r="canvas" aria-label="视频画面"></canvas>
  <div class="tp-loading" data-r="loading" aria-label="正在加载"><div class="tp-spinner"></div></div>
</div>
<audio data-r="audio" preload="auto"></audio>`;
}

function stageHTML({ video, chapters, total, quizzes }) {
  const nCh = cnNum(chapters.length);
  const segs = chapters
    .map((c, i) => `<div class="tp-seg" data-i="${i}" style="left:${(c.start / total) * 100}%;width:calc(${((c.end - c.start) / total) * 100}% - ${i + 1 < chapters.length ? 3 : 0}px)"><i class="tp-seg-hover"></i><i class="tp-seg-fill"></i></div>`)
    .join('');
  const marks = chapters
    .filter((c) => quizzes.has(c.n))
    .map((c) => `<i class="tp-mark" style="left:${(c.quizAt / total) * 100}%"></i>`)
    .join('');
  const rows = chapters
    .map((c, i) => {
      const q = quizzes.has(c.n);
      return `<li class="tp-ch" data-i="${i}">
        <button class="tp-ch-main" data-seek="${i}" type="button">
          <span class="tp-ch-num">${esc(c.label)}</span>
          <span class="tp-ch-title">${esc(c.title)}</span>
          <span class="tp-ch-time">${fmtTime(c.start)}</span>
        </button>
        ${q ? `<button class="tp-ch-quiz" data-quiz="${c.n}" type="button" aria-label="第${esc(c.label)}节的题目">${ICON.check}<span class="tp-ch-quiz-text">做题</span></button>` : ''}
        <i class="tp-ch-bar"><i></i></i>
      </li>`;
    })
    .join('');
  const kbd = (k) => `<kbd>${k}</kbd>`;
  const meta = [chapters.length > 1 ? `${nCh}节` : '', fmtSpoken(total)].filter(Boolean).join(' · ');
  return `
<div class="tp-scrim" aria-hidden="true"></div>
<div class="tp-osd" data-r="osd" role="status" aria-live="polite"></div>

<div class="tp-card" data-r="card" role="status" aria-live="polite">
  <button class="tp-card-go" data-r="cardGo" type="button"><span data-r="cardTitle"></span>${ICON.chevron}</button>
  <i class="tp-card-life" data-r="cardLife"></i>
</div>

<div class="tp-controls" data-r="controls">
  <div class="tp-row">
    <button class="tp-meta" data-act="chapters" data-r="chLabel" type="button" aria-label="章节列表">
      ${video.title ? `<span class="tp-meta-title">${esc(video.title)}</span>` : ''}
      <span class="tp-meta-ch"><span class="tp-meta-ch-text" data-r="chLabelText"></span>${ICON.chevron}</span>
    </button>
    <div class="tp-transport">
      <button class="tp-btn tp-btn--play" data-act="play" data-r="playBtn" type="button" aria-label="播放">${ICON.play}${ICON.pause}${ICON.replay}</button>
    </div>
    <div class="tp-group">
      <div class="tp-volume" data-r="volume">
        <div class="tp-vol" data-r="vol" role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="100">
          <div class="tp-vol-track"><i class="tp-vol-fill" data-r="volFill"></i></div>
        </div>
        <button class="tp-btn" data-act="mute" data-r="muteBtn" type="button" aria-label="静音">${ICON.vol}</button>
      </div>
      <button class="tp-btn tp-btn--subs" data-act="subs" data-r="subsBtn" type="button" aria-label="字幕" aria-pressed="true">${ICON.subs}</button>
      <button class="tp-btn tp-btn--speed" data-act="speed" data-r="speedBtn" type="button" aria-label="播放速度" aria-haspopup="menu" aria-expanded="false" data-tip="播放速度" data-keys="[ ]">${ICON.speed}<span data-r="speedText">1×</span></button>
      <button class="tp-btn" data-act="chapters" data-r="chBtn" type="button" aria-label="章节" aria-expanded="false" data-tip="章节" data-keys="1–9">${ICON.list}</button>
      <button class="tp-btn tp-btn--swap" data-act="fullscreen" data-r="fsBtn" type="button" aria-label="全屏">${ICON.full}${ICON.unfull}</button>
    </div>
  </div>
  <div class="tp-progress" data-r="progress" role="slider" tabindex="0" aria-label="播放进度"
       aria-valuemin="0" aria-valuemax="${Math.floor(total)}" aria-valuenow="0">
    <div class="tp-track" data-r="track">${segs}${marks}</div>
    <i class="tp-handle" data-r="handle"></i>
  </div>
  <div class="tp-times" aria-hidden="true"><span data-r="cur">0:00</span><span data-r="rem">−${fmtTime(total)}</span></div>
</div>

<div class="tp-preview" data-r="preview" aria-hidden="true">
  <div class="tp-preview-frame" data-r="pframe"><canvas data-r="pcanvas"></canvas></div>
  <div class="tp-preview-time" data-r="ptime"></div>
  <div class="tp-preview-ch" data-r="pch"></div>
</div>

<div class="tp-tip" data-r="tip" role="tooltip"></div>

<div class="tp-menu" data-r="speedMenu" role="menu" aria-label="播放速度">
  <div class="tp-menu-title">播放速度</div>
  ${SPEEDS.map((r) => `<button class="tp-menu-item" role="menuitemradio" data-rate="${r}" type="button">${ICON.check}<span>${fmtRate(r)}</span>${r === 1 ? '<em>正常</em>' : ''}</button>`).join('')}
</div>

<section class="tp-panel" data-r="panel" aria-label="章节">
  <header class="tp-panel-head">
    <h2>章节</h2>
    <span class="tp-panel-meta">${meta}</span>
  </header>
  <ol class="tp-chlist" data-r="chList">${rows}</ol>
  <footer class="tp-panel-foot">
    <button class="tp-menu-item" data-r="autoQuiz" role="menuitemcheckbox" aria-checked="false" type="button">${ICON.check}<span>到小题时暂停</span></button>
  </footer>
</section>

<div class="tp-modal-wrap" data-r="modalWrap">
  <div class="tp-modal" data-r="modal" role="dialog" aria-modal="true" aria-labelledby="tp-q-title" tabindex="-1">
    <div class="tp-q-kicker" data-r="qKicker"></div>
    <h2 class="tp-q-title" id="tp-q-title" data-r="qTitle"></h2>
    <div class="tp-q-body" data-r="qBody"></div>
    <div class="tp-q-actions">
      <button class="tp-link" data-act="reveal" data-r="qReveal" type="button">显示答案</button>
      <button class="tp-link tp-link--strong" data-act="resume" type="button">继续播放</button>
      <div class="tp-q-pager" data-r="qPager"></div>
    </div>
  </div>
</div>

<div class="tp-modal-wrap tp-keys-wrap" data-r="keysWrap">
  <div class="tp-modal tp-keys" data-r="keys" role="dialog" aria-modal="true" aria-labelledby="tp-keys-title" tabindex="-1">
    <h2 class="tp-q-title" id="tp-keys-title">键盘快捷键</h2>
    <dl class="tp-keylist">
      <div><dt>${kbd('空格')}${kbd('K')}</dt><dd>播放 / 暂停</dd></div>
      <div><dt>${kbd('←')}${kbd('→')}</dt><dd>后退 / 前进 5 秒</dd></div>
      <div><dt>${kbd('J')}${kbd('L')}</dt><dd>后退 / 前进 10 秒</dd></div>
      <div><dt>${kbd('Shift')}${kbd('←')}${kbd('→')}</dt><dd>上一节 / 下一节</dd></div>
      ${chapters.length > 1 ? `<div><dt>${kbd('1')}<span class="tp-kbd-dash">–</span>${kbd(String(Math.min(9, chapters.length)))}</dt><dd>跳到第一至第${cnNum(Math.min(9, chapters.length))}节</dd></div>` : ''}
      <div><dt>${kbd('Home')}${kbd('End')}</dt><dd>开头 / 结尾</dd></div>
      <div><dt>${kbd('[')}${kbd(']')}</dt><dd>减速 / 加速</dd></div>
      <div><dt>${kbd('↑')}${kbd('↓')}</dt><dd>音量</dd></div>
      <div><dt>${kbd('M')}</dt><dd>静音</dd></div>
      <div><dt>${kbd('C')}</dt><dd>字幕</dd></div>
      <div><dt>${kbd('F')}</dt><dd>全屏</dd></div>
      <div><dt>${kbd('?')}</dt><dd>显示本列表</dd></div>
    </dl>
  </div>
</div>

<div class="tp-start" data-r="start">
  <div class="tp-start-inner">
    <h1 class="tp-title">${video.titleHTML || esc(video.title || '')}</h1>
    ${video.subtitleHTML ? `<p class="tp-subtitle">${video.subtitleHTML}</p>` : ''}
    <p class="tp-start-meta">${meta}</p>
    <div class="tp-start-actions">
      <button class="tp-start-play" data-act="startMain" data-r="startPlay" type="button">${ICON.play}<span data-r="startLabel">播放</span></button>
      <button class="tp-start-alt" data-act="startOver" data-r="startOver" type="button" hidden>从头播放</button>
    </div>
    <p class="tp-start-note" data-r="startNote" hidden></p>
  </div>
</div>`;
}

// chapters: [{ title, start, label?, quizAt? }] in order; the first one starts at 0
function normChapters(list, title, total) {
  const src = Array.isArray(list) && list.length ? list : [{ title: title || '', start: 0 }];
  const cs = src.map((c, i) => ({ ...c, n: i + 1, title: String(c.title || ''), start: i === 0 ? 0 : clamp(+c.start || 0, 0, total) }));
  cs.forEach((c, i) => {
    c.end = i + 1 < cs.length ? cs[i + 1].start : total;
    c.label = c.label != null && c.label !== '' ? String(c.label) : cnNum(c.n);
    c.quizAt = clamp(typeof c.quizAt === 'number' && isFinite(c.quizAt) ? c.quizAt : c.end, 0, total);
  });
  return cs;
}

// quizzes: [{ chapter, question, answer, explain }], chapter = 1 for the first chapter
function groupQuizzes(list, chapters) {
  const ok = new Set(chapters.map((c) => c.n));
  const map = new Map();
  for (const q of Array.isArray(list) ? list : []) {
    if (!q || !ok.has(q.chapter) || !q.question) continue;
    if (!map.has(q.chapter)) map.set(q.chapter, []);
    map.get(q.chapter).push(q);
  }
  return map;
}

function showFatal(root, err) {
  root.dataset.phase = 'error';
  const stage = root.querySelector('.tp-stage') || root;
  const box = document.createElement('div');
  box.className = 'tp-error';
  box.innerHTML = `<div class="tp-error-title">页面没能加载</div><pre></pre>`;
  box.querySelector('pre').textContent = String((err && (err.stack || err.message)) || err);
  stage.appendChild(box);
  console.error(err);
}

// ---------------------------------------------------------------- the player
export async function startPlayer(cfg = {}) {
  const root = document.createElement('div');
  root.className = 'tp';
  root.dataset.phase = 'loading';
  root.innerHTML = shellHTML();
  (cfg.mount || document.body).appendChild(root);
  const pick = (name, scope = root) => scope.querySelector(`[data-r="${name}"]`);
  const stage = pick('stage');
  const canvas = pick('canvas');
  const audio = pick('audio');

  // cfg.load() may supply (or replace) any field after the shell is on screen:
  // load data, wait for fonts, build the scenes.
  let video = cfg;
  try {
    if (typeof cfg.load === 'function') video = { ...cfg, ...((await cfg.load()) || {}) };
    if (typeof video.render !== 'function') throw new Error('startPlayer: render(ctx, t, o) is required');
    if (!(video.duration > 0)) throw new Error('startPlayer: duration (seconds) is required');
  } catch (err) {
    showFatal(root, err);
    throw err;
  }
  const store = openStore(video.storageKey || `player:${video.title || 'video'}`);
  const S = store.data;
  const W = video.width || 1920, H = video.height || 1080; // frame size in render units
  const ctx = canvas.getContext('2d');
  if (video.title) canvas.setAttribute('aria-label', `${video.title}：视频画面`);

  // ---- data ----
  const total = video.duration;
  const chapters = normChapters(video.chapters, video.title, total);
  const label = (c) => `${c.label}、${c.title}`;
  const quizzes = groupQuizzes(video.quizzes || [], chapters);
  const checkpoints = chapters.filter((c) => quizzes.has(c.n)).map((c) => ({ n: c.n, t: c.quizAt }));
  const chapterAt = (t) => {
    let i = 0;
    while (i + 1 < chapters.length && t >= chapters[i + 1].start - 1e-6) i++;
    return i;
  };

  stage.insertAdjacentHTML('beforeend', stageHTML({ video, chapters, total, quizzes }));
  const R = {};
  for (const n of root.querySelectorAll('[data-r]')) R[n.dataset.r] = n;
  const segEls = [...R.track.querySelectorAll('.tp-seg')].map((el, i) => ({
    el, fill: el.querySelector('.tp-seg-fill'), hover: el.querySelector('.tp-seg-hover'), c: chapters[i], f: -1, h: -1,
  }));
  const rowEls = [...R.chList.querySelectorAll('.tp-ch')];
  const pctx = R.pcanvas.getContext('2d');
  const canPreview = video.preview !== false; // set preview: false if render is not a pure function of t
  if (!canPreview) R.pframe.remove();

  // ---- state ----
  let phase = 'start';
  let t = typeof video.posterTime === 'number' ? video.posterTime : 0; // time on the video timeline that is (or will be) on screen
  let playing = false; // the viewer wants it to play
  let ended = false;
  let rate = SPEEDS.includes(S.rate) ? S.rate : 1;
  let subs = S.subs !== false;
  let autoQuiz = S.autoQuiz === true;
  let volume = typeof S.volume === 'number' ? clamp(S.volume) : 1;
  let muted = S.muted === true;
  let audioOK = !!video.audio;
  let scale = 1;
  let needDraw = true;
  let drawnT = -1;
  let lift = 0, liftFrom = 0, liftTo = 0, liftT0 = 0, liftMax = 0;
  let lastAT = -1, lastATwall = 0; // last audio.currentTime seen and when
  let lastFrame = performance.now();
  let lastSave = 0;
  let seekedFlag = false;
  const scrub = { active: false, t: 0, wasPlaying: false };
  const hover = { on: false, x: 0, dirty: false };
  let uiShown = true;
  let idleTimer = 0;
  let overControls = false;
  let menuOpen = false, panelOpen = false, modalOpen = false, keysOpen = false;
  let modalReturn = null;
  let quizN = 0, quizIdx = 0;
  let selfPause = false;
  let trackW = 1;

  // ---------------------------------------------------------------- drawing
  let drawError = null;
  function draw() {
    try {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      video.render(ctx, t, { scale, subtitles: subs, subtitleLift: lift, preview: false });
    } catch (err) {
      // keep the controls working; report a broken frame once
      if (!drawError) console.error((drawError = err));
    }
    drawnT = t;
    needDraw = false;
  }

  function layout() {
    const r = stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const k = Math.min(2, (r.width * dpr) / W);
    const bw = Math.max(2, Math.round(W * k)), bh = Math.max(2, Math.round(H * k));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    scale = bw / W;
    trackW = R.track.offsetWidth || 1;
    // lift the burned-in subtitles clear of the control bar while it is shown
    const barTop = R.controls.offsetTop;
    root.style.setProperty('--bar-gap', `${Math.round(r.height - barTop)}px`);
    const f = H / r.height;
    liftMax = Math.max(0, (r.height - barTop) * f - 20);
    if (uiShown) liftTo = liftMax;
    if (!liftAnimating()) lift = liftTo;
    // scrub preview canvas
    if (canPreview) {
      const pw = R.pframe.clientWidth || 1;
      const pk = Math.min(1, (pw * dpr) / W);
      const pbw = Math.max(2, Math.round(W * pk)), pbh = Math.max(2, Math.round(H * pk));
      if (R.pcanvas.width !== pbw || R.pcanvas.height !== pbh) {
        R.pcanvas.width = pbw;
        R.pcanvas.height = pbh;
      }
    }
    positionHandle();
    draw();
    if (hover.on) hover.dirty = true;
    if (menuOpen) placeMenu();
  }
  let lastDpr = window.devicePixelRatio || 1;
  new ResizeObserver(layout).observe(stage);

  const liftAnimating = () => performance.now() - liftT0 < 260;
  function setLiftTarget(v) {
    if (v === liftTo) return;
    liftFrom = lift;
    liftTo = v;
    liftT0 = performance.now();
  }
  function stepLift(now) {
    const p = clamp((now - liftT0) / 240);
    const v = liftFrom + (liftTo - liftFrom) * ease(p);
    if (Math.abs(v - lift) > 0.01) {
      lift = v;
      if (subs) needDraw = true;
    }
  }

  // ---------------------------------------------------------------- clock
  function setT(v) {
    t = clamp(v, 0, total);
  }
  function syncAudio(v) {
    if (audioOK && Math.abs(audio.currentTime - v) > 0.03) {
      try {
        audio.currentTime = v;
      } catch {
        /* not seekable yet */
      }
    }
    lastAT = -1;
  }

  function advance(now, dt) {
    if (scrub.active) {
      setT(scrub.t);
      return;
    }
    if (!playing) return;
    const prev = t;
    let v;
    if (audioOK && !audio.ended) {
      const at = audio.currentTime;
      const running = !audio.paused && !audio.seeking && audio.readyState >= 3;
      if (at !== lastAT) {
        lastAT = at;
        lastATwall = now;
      }
      v = running ? lastAT + Math.min(0.25, (now - lastATwall) / 1000) * audio.playbackRate : lastAT;
      // the audio clock may report a hair behind our estimate: never step back for that
      if (running && v < t && t - v < 0.1) v = t;
    } else {
      v = t + dt * rate; // no sound, or the soundtrack ended before the timeline
    }
    setT(v);
    if (seekedFlag) seekedFlag = false;
    else checkpointCrossed(prev, t);
    if (t >= total - 1e-3) finish();
  }

  function checkpointCrossed(a, b) {
    if (!(b > a) || b - a > 1.5) return; // seeks never trigger a checkpoint
    for (const cp of checkpoints) if (a < cp.t && b >= cp.t) reachCheckpoint(cp);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== lastDpr) {
      lastDpr = dpr;
      layout();
    }
    if (phase === 'main') advance(now, dt);
    stepLift(now);
    if (needDraw || t !== drawnT) draw();
    if (hover.dirty) updateHover();
    updateUI();
    if (playing && now - lastSave > 2000) savePos(now);
  }

  // ---------------------------------------------------------------- transport
  async function play() {
    if (phase !== 'main') return;
    if (ended || t >= total - 0.05) {
      ended = false;
      seek(0, { silent: true });
    }
    playing = true;
    ended = false;
    updatePlayState();
    if (!audioOK) return;
    syncAudio(t);
    audio.playbackRate = rate;
    try {
      await audio.play();
    } catch (err) {
      if (err && err.name === 'AbortError') return; // paused again before it started
      if (err && err.name === 'NotAllowedError') {
        // the browser wants a click first
        playing = false;
        updatePlayState();
        return;
      }
      audioOK = false; // cannot play this file: keep going without sound
      noteAudio();
    }
  }
  function pause() {
    if (!playing && !(audioOK && !audio.paused)) return;
    playing = false;
    if (audioOK && !audio.paused) {
      selfPause = true;
      audio.pause();
    }
    updatePlayState();
    savePos();
  }
  function togglePlay() {
    if (phase !== 'main') return;
    if (playing) pause();
    else play();
  }
  function finish() {
    if (ended) return;
    playing = false;
    ended = true;
    setT(total);
    if (audioOK && !audio.paused) {
      selfPause = true;
      audio.pause();
    }
    updatePlayState();
    S.pos = 0;
    store.save();
    poke();
  }
  function seek(v, o = {}) {
    setT(v);
    seekedFlag = true;
    if (ended && t < total - 0.05) ended = false;
    syncAudio(t);
    needDraw = true;
    if (!playing || phase !== 'main') draw(); // paused: show the new frame right away
    updatePlayState();
    if (!o.silent) poke();
    savePos();
  }
  function skip(d) {
    seek(t + d);
    osd(`${d < 0 ? '后退' : '前进'} ${Math.abs(d)} 秒`, 'skip', d);
  }
  function goChapter(i, announce = true) {
    i = clamp(i, 0, chapters.length - 1);
    seek(chapters[i].start);
    if (announce) osd(label(chapters[i]), 'chapter');
  }
  function prevChapter() {
    const i = chapterAt(t);
    goChapter(t - chapters[i].start > 3 || i === 0 ? i : i - 1);
  }
  function nextChapter() {
    const i = chapterAt(t);
    if (i + 1 < chapters.length) goChapter(i + 1);
    else osd('已经是最后一节', 'chapter');
  }

  function setRate(r, announce = false) {
    rate = r;
    audio.playbackRate = r;
    audio.defaultPlaybackRate = r;
    R.speedText.textContent = fmtRate(r);
    R.speedBtn.classList.toggle('is-custom', r !== 1);
    for (const b of R.speedMenu.querySelectorAll('[data-rate]')) b.setAttribute('aria-checked', String(+b.dataset.rate === r));
    S.rate = r;
    store.save();
    if (announce) osd(r === 1 ? '1× 正常速度' : `${fmtRate(r)} 速度`, 'rate');
  }
  function stepRate(d) {
    const i = SPEEDS.indexOf(rate);
    const j = clamp((i < 0 ? 1 : i) + d, 0, SPEEDS.length - 1);
    setRate(SPEEDS[j], true);
  }
  function setSubs(on, announce = false) {
    subs = on;
    needDraw = true;
    R.subsBtn.classList.toggle('is-on', on);
    R.subsBtn.setAttribute('aria-pressed', String(on));
    R.subsBtn.dataset.tip = on ? '关闭字幕' : '打开字幕';
    R.subsBtn.dataset.keys = 'C';
    S.subs = on;
    store.save();
    if (announce) osd(on ? '字幕已打开' : '字幕已关闭', 'subs');
    refreshTip();
  }
  function setVolume(v, announce = false) {
    volume = clamp(Math.round(v * 100) / 100);
    if (volume > 0 && muted) muted = false;
    applyVolume();
    if (announce) osd(muted || volume === 0 ? '已静音' : `音量 ${Math.round(volume * 100)}%`, 'vol');
  }
  function toggleMute(announce = false) {
    if (muted || volume === 0) {
      muted = false;
      if (volume === 0) volume = 0.5;
    } else muted = true;
    applyVolume();
    if (announce) osd(muted ? '已静音' : `音量 ${Math.round(volume * 100)}%`, 'vol');
  }
  function applyVolume() {
    audio.volume = volume;
    audio.muted = muted;
    const v = muted ? 0 : volume;
    R.volFill.style.transform = `scaleX(${v})`;
    R.vol.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    R.vol.setAttribute('aria-valuetext', muted ? '静音' : `${Math.round(volume * 100)}%`);
    R.muteBtn.dataset.level = v === 0 ? '0' : v < 0.5 ? '1' : '2';
    R.muteBtn.setAttribute('aria-label', v === 0 ? '取消静音' : '静音');
    R.muteBtn.dataset.tip = v === 0 ? '取消静音' : '静音';
    R.muteBtn.dataset.keys = 'M';
    S.volume = volume;
    S.muted = muted;
    store.save();
    refreshTip();
  }

  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsEnabled = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function toggleFullscreen() {
    if (!fsEnabled) return;
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      const p = req && req.call(root, { navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
    }
  }
  function updateFullscreen() {
    const on = !!fsElement();
    R.fsBtn.classList.toggle('is-on', on);
    R.fsBtn.setAttribute('aria-label', on ? '退出全屏' : '全屏');
    R.fsBtn.dataset.tip = on ? '退出全屏' : '全屏';
    R.fsBtn.dataset.keys = 'F';
    refreshTip();
  }
  document.addEventListener('fullscreenchange', updateFullscreen);
  document.addEventListener('webkitfullscreenchange', updateFullscreen);
  if (!fsEnabled) R.fsBtn.hidden = true;

  // ---------------------------------------------------------------- UI state
  function updatePlayState() {
    root.dataset.playing = String(playing);
    root.dataset.ended = String(ended);
    const lab = ended ? '重新播放' : playing ? '暂停' : '播放';
    R.playBtn.setAttribute('aria-label', lab);
    R.playBtn.dataset.tip = lab;
    R.playBtn.dataset.keys = ended ? '' : 'K';
    if (!playing) showUI();
    else armIdle();
    refreshTip();
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      } catch {
        /* ignore */
      }
    }
  }

  let uiSec = -1, uiCh = -1, uiT = -1;
  function updateUI() {
    if (t === uiT) return;
    uiT = t;
    for (const s of segEls) {
      const f = clamp((t - s.c.start) / (s.c.end - s.c.start));
      if (f !== s.f) {
        s.f = f;
        s.fill.style.transform = `scaleX(${f})`;
      }
    }
    positionHandle();
    const sec = Math.floor(t + 1e-6);
    if (sec !== uiSec) {
      uiSec = sec;
      R.cur.textContent = fmtTime(t);
      R.rem.textContent = `−${fmtTime(total - sec)}`;
      R.progress.setAttribute('aria-valuenow', String(sec));
      R.progress.setAttribute('aria-valuetext', `${fmtSpoken(t)}，共 ${fmtSpoken(total)}`);
    }
    const ci = chapterAt(t);
    if (ci !== uiCh) {
      uiCh = ci;
      R.chLabelText.textContent = label(chapters[ci]);
      rowEls.forEach((r, i) => r.classList.toggle('is-current', i === ci));
      setMediaMeta(label(chapters[ci]));
    }
    const c = chapters[ci];
    const bar = rowEls[ci] && rowEls[ci].querySelector('.tp-ch-bar > i');
    if (bar) bar.style.transform = `scaleX(${clamp((t - c.start) / (c.end - c.start))})`;
  }
  function positionHandle() {
    R.handle.style.transform = `translateX(${(t / total) * trackW}px)`;
  }

  // controls auto-hide
  function showUI() {
    clearTimeout(idleTimer);
    if (!uiShown) {
      uiShown = true;
      root.dataset.ui = 'shown';
      setLiftTarget(liftMax);
    }
  }
  function hideUI() {
    if (!uiShown) return;
    uiShown = false;
    root.dataset.ui = 'hidden';
    setLiftTarget(0);
    hideTip();
  }
  function keepUI() {
    return !playing || scrub.active || overControls || menuOpen || panelOpen || modalOpen || keysOpen || phase !== 'main' || !!R.controls.querySelector(':focus-visible');
  }
  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function check() {
      if (keepUI()) {
        idleTimer = setTimeout(check, 600);
        return;
      }
      hideUI();
    }, IDLE_MS);
  }
  function poke() {
    showUI();
    armIdle();
  }

  // on-screen messages
  let osdTimer = 0, osdKind = '', osdSum = 0;
  function osd(text, kind = '', amount = 0) {
    if (kind === 'skip' && osdKind === 'skip' && R.osd.classList.contains('is-on') && Math.sign(amount) === Math.sign(osdSum)) {
      osdSum += amount;
      text = `${osdSum < 0 ? '后退' : '前进'} ${Math.abs(osdSum)} 秒`;
    } else osdSum = amount;
    osdKind = kind;
    R.osd.textContent = text;
    R.osd.classList.add('is-on');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => R.osd.classList.remove('is-on'), 1100);
  }

  // tooltips for buttons
  let tipEl = null, tipTimer = 0;
  function showTip(el) {
    if (!el || !el.dataset.tip || menuOpen || scrub.active) return;
    tipEl = el;
    const keys = (el.dataset.keys || '').split(' ').filter(Boolean);
    R.tip.innerHTML = `<span>${esc(el.dataset.tip)}</span>${keys.length ? `<span class="tp-tip-k">${keys.map(esc).join(' ')}</span>` : ''}`;
    const sr = stage.getBoundingClientRect(), er = el.getBoundingClientRect();
    const tw = R.tip.offsetWidth, th = R.tip.offsetHeight;
    const x = clamp(er.left + er.width / 2 - sr.left - tw / 2, 8, sr.width - tw - 8);
    // above the control bar for its buttons, above the element otherwise
    const top = R.controls.contains(el) ? R.controls.getBoundingClientRect().top : er.top;
    const y = top - sr.top - th - 8;
    R.tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    R.tip.classList.add('is-on');
  }
  function hideTip() {
    clearTimeout(tipTimer);
    tipEl = null;
    R.tip.classList.remove('is-on');
  }
  function refreshTip() {
    if (tipEl && R.tip.classList.contains('is-on')) showTip(tipEl);
  }
  stage.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-tip]');
    if (!el || el === tipEl) return;
    hideTip();
    tipTimer = setTimeout(() => showTip(el), 140);
  });
  stage.addEventListener('pointerout', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && !el.contains(e.relatedTarget)) hideTip();
  });
  stage.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && el.matches(':focus-visible')) showTip(el);
  });
  stage.addEventListener('focusout', hideTip);
  stage.addEventListener('pointerdown', hideTip, true);

  // ---------------------------------------------------------------- progress bar
  const tAtX = (clientX) => {
    const r = R.track.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width) * total;
  };
  function updateHover() {
    hover.dirty = false;
    const show = hover.on || scrub.active;
    R.preview.classList.toggle('is-on', show);
    R.preview.classList.toggle('is-scrub', scrub.active);
    const ht = scrub.active ? scrub.t : tAtX(hover.x);
    // hover shading on the segments up to the pointer
    for (const s of segEls) {
      const h = show ? clamp((ht - s.c.start) / (s.c.end - s.c.start)) : 0;
      if (h !== s.h) {
        s.h = h;
        s.hover.style.transform = `scaleX(${h})`;
      }
      s.el.classList.toggle('is-hot', show && ht >= s.c.start && ht < s.c.end + (s.c.end === total ? 1 : 0));
    }
    if (!show) return;
    const c = chapters[chapterAt(ht)];
    R.pch.textContent = label(c);
    R.ptime.textContent = fmtTime(ht);
    if (canPreview && !scrub.active) {
      try {
        const ps = R.pcanvas.width / W;
        pctx.setTransform(ps, 0, 0, ps, 0, 0);
        video.render(pctx, ht, { scale: ps, subtitles: false, subtitleLift: 0, preview: true });
      } catch {
        /* reported by draw() */
      }
    }
    const sr = stage.getBoundingClientRect(), tr = R.track.getBoundingClientRect();
    const x = tr.left - sr.left + (ht / total) * tr.width;
    const w = R.preview.offsetWidth;
    const left = clamp(x - w / 2, 10, sr.width - w - 10);
    R.preview.style.transform = `translate(${Math.round(left)}px, 0)`;
    R.preview.style.bottom = `${Math.round(sr.bottom - tr.top + 14)}px`;
  }
  R.progress.addEventListener('pointerenter', (e) => {
    hover.on = true;
    hover.x = e.clientX;
    hover.dirty = true;
    R.progress.classList.add('is-hover');
  });
  R.progress.addEventListener('pointerleave', () => {
    hover.on = false;
    hover.dirty = true;
    R.progress.classList.remove('is-hover');
  });
  R.progress.addEventListener('pointermove', (e) => {
    hover.x = e.clientX;
    hover.dirty = true;
    if (scrub.active) {
      scrub.t = tAtX(e.clientX);
      setT(scrub.t);
    }
  });
  R.progress.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || phase !== 'main') return;
    e.preventDefault();
    R.progress.setPointerCapture(e.pointerId);
    closeMenus();
    scrub.active = true;
    scrub.wasPlaying = playing;
    scrub.t = tAtX(e.clientX);
    if (audioOK && !audio.paused) {
      selfPause = true;
      audio.pause();
    }
    root.dataset.scrubbing = 'true';
    setT(scrub.t);
    draw();
    hover.x = e.clientX;
    hover.dirty = true;
    showUI();
  });
  const endScrub = () => {
    if (!scrub.active) return;
    scrub.active = false;
    if (!R.progress.matches(':focus-visible')) R.progress.blur();
    root.dataset.scrubbing = 'false';
    hover.dirty = true;
    seek(scrub.t);
    if (scrub.wasPlaying && playing) play();
  };
  R.progress.addEventListener('pointerup', endScrub);
  R.progress.addEventListener('pointercancel', endScrub);
  R.progress.addEventListener('lostpointercapture', endScrub);

  // ---------------------------------------------------------------- volume slider
  const volAt = (clientX) => {
    const r = R.vol.querySelector('.tp-vol-track').getBoundingClientRect();
    return clamp((clientX - r.left) / r.width);
  };
  let volDrag = false;
  R.vol.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    R.vol.setPointerCapture(e.pointerId);
    volDrag = true;
    R.volume.classList.add('is-drag');
    setVolume(volAt(e.clientX));
  });
  R.vol.addEventListener('pointermove', (e) => {
    if (volDrag) setVolume(volAt(e.clientX));
  });
  const endVol = () => {
    volDrag = false;
    if (!R.vol.matches(':focus-visible')) R.vol.blur();
    R.volume.classList.remove('is-drag');
  };
  R.vol.addEventListener('pointerup', endVol);
  R.vol.addEventListener('pointercancel', endVol);
  R.vol.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    setVolume((muted ? 0 : volume) + d, true);
  });

  // ---------------------------------------------------------------- menus & panel
  function placeMenu() {
    const sr = stage.getBoundingClientRect(), br = R.speedBtn.getBoundingClientRect();
    const w = R.speedMenu.offsetWidth;
    const x = clamp(br.left + br.width / 2 - sr.left - w / 2, 10, sr.width - w - 10);
    R.speedMenu.style.left = `${Math.round(x)}px`;
    R.speedMenu.style.bottom = `${Math.round(sr.bottom - R.controls.getBoundingClientRect().top + 10)}px`;
  }
  function openMenu() {
    if (panelOpen) closePanel(false);
    menuOpen = true;
    placeMenu();
    R.speedMenu.classList.add('is-on');
    R.speedBtn.setAttribute('aria-expanded', 'true');
    hideTip();
    showUI();
    const cur = R.speedMenu.querySelector('[aria-checked="true"]');
    if (cur && R.speedBtn.matches(':focus-visible')) cur.focus();
  }
  function closeMenu(focusBack = false) {
    if (!menuOpen) return;
    menuOpen = false;
    R.speedMenu.classList.remove('is-on');
    R.speedBtn.setAttribute('aria-expanded', 'false');
    if (focusBack) R.speedBtn.focus();
    armIdle();
  }
  function openPanel() {
    if (menuOpen) closeMenu();
    panelOpen = true;
    R.panel.classList.add('is-on');
    R.chBtn.setAttribute('aria-expanded', 'true');
    R.chBtn.classList.add('is-on');
    hideTip();
    showUI();
    uiT = -1;
    updateUI();
    const cur = R.chList.querySelector('.is-current .tp-ch-main');
    if (cur) {
      cur.scrollIntoView({ block: 'nearest' });
      if (R.chBtn.matches(':focus-visible') || R.chLabel.matches(':focus-visible')) cur.focus();
    }
  }
  function closePanel(focusBack = false) {
    if (!panelOpen) return;
    panelOpen = false;
    R.panel.classList.remove('is-on');
    R.chBtn.setAttribute('aria-expanded', 'false');
    R.chBtn.classList.remove('is-on');
    if (focusBack) R.chBtn.focus();
    armIdle();
  }
  function closeMenus() {
    closeMenu();
    closePanel();
  }
  function setAutoQuiz(on) {
    autoQuiz = on;
    R.autoQuiz.setAttribute('aria-checked', String(on));
    S.autoQuiz = on;
    store.save();
  }

  // ---------------------------------------------------------------- quizzes
  const qKey = (n, i) => `${n}.${i}`;
  const answers = S.answers && typeof S.answers === 'object' ? S.answers : (S.answers = {});
  const done = S.done && typeof S.done === 'object' ? S.done : (S.done = {});
  function refreshDone() {
    for (const b of R.chList.querySelectorAll('[data-quiz]')) {
      const n = +b.dataset.quiz;
      const all = quizzes.get(n).every((_, i) => done[qKey(n, i)]);
      b.classList.toggle('is-done', all);
      b.querySelector('.tp-ch-quiz-text').textContent = all ? '已做' : '做题';
      b.dataset.tip = all ? '再看一遍题目' : '检验一下';
    }
  }

  let cardN = 0;
  function showCard(n) {
    const c = chapters.find((x) => x.n === n);
    if (!c) return;
    cardN = n;
    R.cardTitle.textContent = `第${c.label}节的小题`;
    R.card.classList.remove('is-on'); // restarts the countdown when it was already showing
    void R.card.offsetWidth;
    R.card.classList.add('is-on');
  }
  function hideCard() {
    R.card.classList.remove('is-on');
    cardN = 0;
  }
  R.cardLife.style.animationDuration = `${CARD_MS}ms`;
  R.cardLife.addEventListener('animationend', hideCard);
  if (!checkpoints.length) R.panel.querySelector('.tp-panel-foot').hidden = true;

  function reachCheckpoint(cp) {
    if (autoQuiz) {
      pause();
      seek(cp.t, { silent: true });
      openQuiz(cp.n);
    } else showCard(cp.n);
  }

  function openQuiz(n, i = 0) {
    const list = quizzes.get(n);
    if (!list) return;
    if (phase !== 'main') begin(t, false);
    pause();
    hideCard();
    closeMenus();
    const c = chapters.find((x) => x.n === n);
    quizN = n;
    quizIdx = clamp(i, 0, list.length - 1);
    R.qKicker.textContent = `检验一下 · 第${c.label}节`;
    R.qTitle.textContent = c.title;
    renderQuiz();
    if (!modalOpen) modalReturn = document.activeElement;
    modalOpen = true;
    R.modalWrap.classList.add('is-on');
    showUI();
    hideTip();
    R.modal.focus({ preventScroll: true });
  }
  function renderQuiz() {
    const list = quizzes.get(quizN);
    const q = list[quizIdx];
    const key = qKey(quizN, quizIdx);
    const revealed = !!done[key];
    R.qBody.innerHTML = `
      <div class="tp-q-question">${paras(q.question)}</div>
      <textarea class="tp-q-input" id="tp-q-answer" rows="1" aria-label="你的答案" placeholder="写下你的想法（可以不写）"></textarea>
      <div class="tp-q-reveal" ${revealed ? '' : 'hidden'}>
        <div class="tp-q-sec"><div class="tp-q-h">答案</div><div class="tp-q-answer">${paras(q.answer)}</div></div>
        ${q.explain ? `<div class="tp-q-sec"><div class="tp-q-h">解析</div><div class="tp-q-explain">${paras(q.explain)}</div></div>` : ''}
      </div>`;
    const ta = R.qBody.querySelector('textarea');
    ta.value = answers[key] || '';
    const grow = () => {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight + 2, 240)}px`;
    };
    let saveTimer = 0;
    ta.addEventListener('input', () => {
      grow();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        answers[key] = ta.value;
        store.save();
      }, 300);
    });
    requestAnimationFrame(grow);
    R.qReveal.textContent = revealed ? '隐藏答案' : '显示答案';
    R.qReveal.setAttribute('aria-expanded', String(revealed));
    R.qPager.innerHTML =
      list.length > 1
        ? `<button class="tp-link tp-link--icon" data-act="qPrev" type="button" aria-label="上一题" ${quizIdx === 0 ? 'disabled' : ''}>${ICON.left}</button><span>${quizIdx + 1} / ${list.length}</span><button class="tp-link tp-link--icon" data-act="qNext" type="button" aria-label="下一题" ${quizIdx === list.length - 1 ? 'disabled' : ''}>${ICON.chevron}</button>`
        : '';
  }
  function toggleReveal() {
    const box = R.qBody.querySelector('.tp-q-reveal');
    const show = box.hidden;
    box.hidden = !show;
    R.qReveal.textContent = show ? '隐藏答案' : '显示答案';
    R.qReveal.setAttribute('aria-expanded', String(show));
    if (show) {
      done[qKey(quizN, quizIdx)] = true;
      store.save();
      refreshDone();
      box.classList.remove('is-in');
      void box.offsetWidth;
      box.classList.add('is-in');
      requestAnimationFrame(() => box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }
  function closeQuiz(resume = false) {
    if (!modalOpen) return;
    const ta = R.qBody.querySelector('textarea');
    if (ta) {
      answers[qKey(quizN, quizIdx)] = ta.value;
      store.save();
    }
    modalOpen = false;
    R.modalWrap.classList.remove('is-on');
    const back = modalReturn;
    modalReturn = null;
    if (back && back.focus && root.contains(back) && back.matches(':focus-visible')) back.focus();
    else canvas.focus?.({ preventScroll: true });
    if (resume) play();
    else poke();
  }

  function openKeys() {
    if (keysOpen) return;
    keysOpen = true;
    if (!modalOpen) modalReturn = document.activeElement;
    R.keysWrap.classList.add('is-on');
    showUI();
    R.keys.focus({ preventScroll: true });
  }
  function closeKeys() {
    if (!keysOpen) return;
    keysOpen = false;
    R.keysWrap.classList.remove('is-on');
    poke();
  }

  // keep Tab inside an open dialog
  function trapTab(e, box) {
    const items = [...box.querySelectorAll('button:not([disabled]):not([hidden]), textarea, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---------------------------------------------------------------- start screen
  const resumeAt = typeof S.pos === 'number' && S.pos > RESUME_MIN && S.pos < total - RESUME_MIN ? S.pos : 0;
  if (resumeAt) {
    R.startLabel.textContent = `继续播放 ${fmtTime(resumeAt)}`;
    R.startOver.hidden = false;
  }
  function noteAudio() {
    const name = decodeURIComponent(String(video.audio || '').split('/').pop() || '');
    R.startNote.hidden = false;
    R.startNote.innerHTML = name
      ? `无法播放音频文件「${esc(name)}」<br><span>请把它和本页面放在同一个文件夹里。现在可以无声观看。</span>`
      : '没有音频，可以无声观看。';
    if (phase === 'main') osd('无法播放音频，现在是无声播放', 'audio');
  }
  // a video without a soundtrack is simply silent; the note is only for a file that failed

  function begin(from, autoplay = true) {
    if (phase === 'main') return;
    phase = 'main';
    root.dataset.phase = 'main';
    seek(from, { silent: true });
    if (autoplay) play();
    poke();
    canvas.focus?.({ preventScroll: true });
  }

  // ---------------------------------------------------------------- events
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act], [data-seek], [data-quiz], [data-rate]');
    if (!b || !root.contains(b)) return;
    if (b.dataset.seek !== undefined) {
      goChapter(+b.dataset.seek);
      closePanel();
      return;
    }
    if (b.dataset.quiz !== undefined) {
      openQuiz(+b.dataset.quiz);
      return;
    }
    if (b.dataset.rate !== undefined) {
      setRate(+b.dataset.rate, true);
      closeMenu(b.matches(':focus-visible'));
      return;
    }
    switch (b.dataset.act) {
      case 'play':
        ended ? (seek(0, { silent: true }), play()) : togglePlay();
        break;
      case 'back': skip(-SEEK_SMALL); break;
      case 'fwd': skip(SEEK_SMALL); break;
      case 'prev': prevChapter(); break;
      case 'next': nextChapter(); break;
      case 'mute': toggleMute(); break;
      case 'subs': setSubs(!subs); break;
      case 'speed': menuOpen ? closeMenu() : openMenu(); break;
      case 'chapters': panelOpen ? closePanel() : openPanel(); break;
      case 'closePanel': closePanel(true); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'startMain': begin(resumeAt || 0); break;
      case 'startOver': begin(0); break;
      case 'reveal': toggleReveal(); break;
      case 'resume': closeQuiz(true); break;
      case 'closeQuiz': closeQuiz(false); break;
      case 'closeKeys': closeKeys(); break;
      case 'qPrev': quizIdx--; renderQuiz(); break;
      case 'qNext': quizIdx++; renderQuiz(); break;
    }
  });
  // a mouse click leaves no focus behind on the controls: a later key press would
  // otherwise turn it into a focus ring and keep the bar from hiding
  root.addEventListener('click', (e) => {
    if (e.detail === 0) return; // activated from the keyboard: keep focus
    const b = e.target.closest('.tp-controls button, .tp-menu button, .tp-card button');
    if (b && document.activeElement === b) b.blur();
  });
  R.autoQuiz.addEventListener('click', (e) => {
    e.preventDefault();
    setAutoQuiz(!autoQuiz);
  });
  R.cardGo.addEventListener('click', () => openQuiz(cardN));
  R.modalWrap.addEventListener('pointerdown', (e) => {
    if (e.target === R.modalWrap) closeQuiz(false);
  });
  R.keysWrap.addEventListener('pointerdown', (e) => {
    closeKeys();
  });

  // clicks on the picture: play / pause, or close an open menu
  canvas.tabIndex = -1;
  canvas.addEventListener('click', () => {
    if (phase !== 'main') return;
    if (menuOpen || panelOpen) {
      closeMenus();
      return;
    }
    togglePlay();
  });
  canvas.addEventListener('dblclick', (e) => {
    if (phase === 'main') {
      e.preventDefault();
      toggleFullscreen();
    }
  });
  // click outside an open menu / panel closes it
  root.addEventListener('pointerdown', (e) => {
    if (menuOpen && !R.speedMenu.contains(e.target) && !R.speedBtn.contains(e.target)) closeMenu();
    if (panelOpen && !R.panel.contains(e.target) && !e.target.closest('[data-act="chapters"]') && e.target !== canvas) closePanel();
  });

  // mouse activity shows the controls
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' && e.movementX === 0 && e.movementY === 0) return;
    poke();
  });
  root.addEventListener('pointerdown', poke);
  root.addEventListener('pointerleave', () => {
    if (!keepUI()) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => !keepUI() && hideUI(), 400);
    }
  });
  R.controls.addEventListener('pointerenter', () => (overControls = true));
  R.controls.addEventListener('pointerleave', () => (overControls = false));
  for (const el of [R.panel, R.speedMenu, R.card]) {
    el.addEventListener('pointerenter', () => (overControls = true));
    el.addEventListener('pointerleave', () => (overControls = false));
  }

  // keyboard
  let spaceHandled = false;
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    const typing = e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable);
    if (keysOpen) {
      if (k === 'Escape' || k === '?') {
        e.preventDefault();
        closeKeys();
      } else if (k === 'Tab') trapTab(e, R.keys);
      return;
    }
    if (modalOpen) {
      if (k === 'Escape') {
        e.preventDefault();
        closeQuiz(false);
      } else if (k === 'Tab') trapTab(e, R.modal);
      return;
    }
    if (typing) return;
    if (phase === 'start') {
      if (k === ' ' || k === 'Enter' || k === 'k' || k === 'K') {
        if (k === 'Enter' && e.target.closest && e.target.closest('button')) return; // the focused button handles it
        e.preventDefault();
        begin(resumeAt || 0);
      } else if (k === '?') openKeys();
      return;
    }
    if (phase !== 'main') return;
    const inMenu = menuOpen && R.speedMenu.contains(e.target);
    const inPanel = panelOpen && R.panel.contains(e.target);
    if ((inMenu || inPanel) && (k === 'ArrowDown' || k === 'ArrowUp')) {
      e.preventDefault();
      const box = inMenu ? R.speedMenu : R.chList;
      const items = [...box.querySelectorAll(inMenu ? '[data-rate]' : '.tp-ch-main')];
      const i = items.indexOf(e.target.closest(inMenu ? '[data-rate]' : '.tp-ch-main'));
      const j = clamp(i + (k === 'ArrowDown' ? 1 : -1), 0, items.length - 1);
      items[j].focus();
      return;
    }
    let handled = true;
    switch (k) {
      case ' ':
      case 'k':
      case 'K':
        if (k === ' ') spaceHandled = true;
        togglePlay();
        break;
      case 'ArrowLeft':
        e.shiftKey ? prevChapter() : skip(-SEEK_SMALL);
        break;
      case 'ArrowRight':
        e.shiftKey ? nextChapter() : skip(SEEK_SMALL);
        break;
      case 'j':
      case 'J':
        skip(-SEEK_LARGE);
        break;
      case 'l':
      case 'L':
        skip(SEEK_LARGE);
        break;
      case 'ArrowUp':
        setVolume((muted ? 0 : volume) + 0.05, true);
        break;
      case 'ArrowDown':
        setVolume((muted ? 0 : volume) - 0.05, true);
        break;
      case 'm':
      case 'M':
        toggleMute(true);
        break;
      case 'c':
      case 'C':
        setSubs(!subs, true);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case '[':
        stepRate(-1);
        break;
      case ']':
        stepRate(1);
        break;
      case 'Home':
        seek(0);
        osd('回到开头', 'chapter');
        break;
      case 'End':
        seek(total);
        finish();
        break;
      case '?':
        openKeys();
        break;
      case 'Escape':
        if (menuOpen) closeMenu(true);
        else if (panelOpen) closePanel(true);
        else if (R.card.classList.contains('is-on')) hideCard();
        else handled = false;
        break;
      default:
        if (/^[1-9]$/.test(k) && +k <= chapters.length) goChapter(+k - 1);
        else handled = false;
    }
    if (handled) {
      e.preventDefault();
      if (k !== ' ' && k !== 'k' && k !== 'K') poke();
    }
  });
  // stop the focused button from also "clicking" on the space bar
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ' && spaceHandled) {
      spaceHandled = false;
      e.preventDefault();
    }
  });

  // audio element events
  audio.addEventListener('error', () => {
    if (!audioOK) return;
    audioOK = false;
    noteAudio();
  });
  audio.addEventListener('pause', () => {
    if (selfPause) {
      selfPause = false;
      return;
    }
    // paused from outside (system media controls, headphones)
    if (playing && !scrub.active && !audio.ended) {
      playing = false;
      setT(audio.currentTime);
      updatePlayState();
    }
  });
  audio.addEventListener('play', () => {
    if (!playing && phase === 'main') {
      playing = true;
      updatePlayState();
    }
  });
  audio.addEventListener('ended', () => {
    // a soundtrack shorter than the timeline: the clock runs on to the end
    if (t >= total - 0.25) {
      setT(total);
      finish();
    }
  });
  // while the tab is hidden there are no animation frames: keep checkpoints working
  setInterval(() => {
    if (document.hidden && playing && phase === 'main') advance(performance.now(), 0.25);
  }, 250);

  function savePos(now = performance.now()) {
    lastSave = now;
    if (phase !== 'main') return;
    S.pos = ended ? 0 : Math.round(t * 10) / 10;
    store.save();
  }
  window.addEventListener('pagehide', () => savePos());
  document.addEventListener('visibilitychange', () => document.hidden && savePos());

  // system media controls (keyboard media keys, lock screen): title and current chapter
  function setMediaMeta(chapter) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: video.title || '', artist: chapter });
    } catch {
      /* ignore */
    }
  }
  if ('mediaSession' in navigator) {
    try {
      const h = {
        play: () => play(),
        pause: () => pause(),
        seekbackward: () => skip(-SEEK_LARGE),
        seekforward: () => skip(SEEK_LARGE),
        previoustrack: () => prevChapter(),
        nexttrack: () => nextChapter(),
        seekto: (d) => d && typeof d.seekTime === 'number' && seek(d.seekTime),
      };
      for (const [a, fn] of Object.entries(h)) {
        try {
          navigator.mediaSession.setActionHandler(a, fn);
        } catch {
          /* unsupported action */
        }
      }
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------- go
  if (video.audio) {
    audio.preservesPitch = true;
    audio.mozPreservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.src = video.audio;
  }
  setRate(rate);
  setSubs(subs);
  setAutoQuiz(autoQuiz);
  applyVolume();
  updateFullscreen();
  refreshDone();
  updatePlayState();
  root.dataset.ui = 'shown';
  root.dataset.phase = 'start';
  layout();
  requestAnimationFrame(frame);
  if (typeof video.at === 'number' && isFinite(video.at)) begin(video.at, false); // open paused at a time (development)

  // ---------------------------------------------------------------- debug API
  const api = {
    ready: true,
    get state() {
      return { phase, t, playing, ended, rate, subs, autoQuiz, volume, muted, audioOK, scale, lift, ui: uiShown, audioTime: audio.currentTime, audioReady: audio.readyState };
    },
    begin: (from = 0, autoplay = true) => begin(from, autoplay),
    play,
    pause,
    seek: (v) => seek(v),
    showUI: () => poke(),
    hideUI: () => {
      clearTimeout(idleTimer);
      hideUI();
    },
    openChapters: openPanel,
    closeChapters: closePanel,
    openSpeed: openMenu,
    openQuiz: (n) => openQuiz(n ?? (checkpoints[0] && checkpoints[0].n)),
    reveal: () => {
      const box = R.qBody.querySelector('.tp-q-reveal');
      if (box && box.hidden) toggleReveal();
    },
    closeQuiz: () => closeQuiz(false),
    showCard: (n) => showCard(n ?? (checkpoints[0] && checkpoints[0].n)),
    openKeys,
    checkpoints,
    video,
  };
  window.__tp = api;
  return api;
}
