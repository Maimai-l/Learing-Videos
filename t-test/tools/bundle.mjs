// Build the player as ONE self-contained HTML file that also works from file://.
//
//   node tools/bundle.mjs              out/t检验与自由度.html  + out/t检验与自由度.m4a (copy of the mix)
//   node tools/bundle.mjs --artifact   out/artifact/index.html + out/artifact/audio.mp4 (AAC 80 kbps; the host does not serve .m4a)
//
// Inlined: the player, engine and scenes (esbuild, IIFE), the stylesheet, build/tex.json
// and build/timeline.json as objects, and the five font faces subset by tools/fonts.py
// (run first, automatically). The soundtrack stays a separate file next to the page.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const rel = (p) => path.relative(root, p) || '.';
const artifact = process.argv.includes('--artifact');
const NAME = 't检验与自由度';
const TITLE = 't 检验与自由度';
const outDir = path.join(root, artifact ? 'out/artifact' : 'out');
const htmlFile = path.join(outDir, artifact ? 'index.html' : `${NAME}.html`);
const audioName = artifact ? 'audio.mp4' : `${NAME}.m4a`;
const audioSrc = path.join(root, 'build/audio/mix.m4a');
const audioOut = path.join(outDir, audioName);
const LIMIT_PAGE = 16 * 1024 * 1024;
const LIMIT_AUDIO = 15 * 1024 * 1024;
const targets = ['chrome105', 'edge105', 'firefox110', 'safari16'];

fs.mkdirSync(outDir, { recursive: true });

// ---- fonts (subset to every character the page can draw) ----
execFileSync('python3', [path.join(root, 'tools/fonts.py')], { stdio: 'inherit' });
const faces = JSON.parse(fs.readFileSync(path.join(root, 'build/fonts/fonts.json'), 'utf8'));
const fontCSS = faces
  .map((f) => {
    const b64 = fs.readFileSync(path.join(root, 'build/fonts', f.file)).toString('base64');
    return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  })
  .join('\n');

// ---- script and stylesheet ----
const js = await esbuild.build({
  entryPoints: [path.join(root, 'src/player/player.js')],
  bundle: true,
  format: 'iife',
  globalName: 'TPlayer',
  minify: true,
  write: false,
  charset: 'utf8',
  legalComments: 'none',
  target: targets,
  logLevel: 'warning',
});
const code = js.outputFiles[0].text;
const css = (
  await esbuild.transform(fs.readFileSync(path.join(root, 'src/player/player.css'), 'utf8'), {
    loader: 'css',
    minify: true,
    charset: 'utf8',
    target: targets,
  })
).code;

// ---- data ----
const texText = fs.readFileSync(path.join(root, 'build/tex.json'), 'utf8');
const tlText = fs.readFileSync(path.join(root, 'build/timeline.json'), 'utf8');
const tex = JSON.parse(texText);
const tl = JSON.parse(tlText);

// every formula the scenes ask for must already be in build/tex.json
try {
  const { texRequests } = await import('../src/engine/tex.js');
  const { Narration } = await import('../src/engine/narration.js');
  const { buildLayers } = await import('../src/scenes/index.js');
  buildLayers(new Narration(tl));
  const missing = [...texRequests().keys()].filter((k) => !tex.formulas[k]);
  if (missing.length) console.warn(`! ${missing.length} formula(s) missing from build/tex.json, run node tools/build-tex.mjs first`);
} catch (e) {
  console.warn('! could not check the formulas:', e.message);
}

// favicon: the italic t of the title, from the formula glyphs
function favicon() {
  const f = tex.formulas && tex.formulas['i|t'];
  const glyph = f && f.g && f.g[0] && tex.paths[f.g[0].p];
  const mark = glyph
    ? `<path fill="#E9ECF2" transform="translate(20.7 51.7) scale(0.064 -0.064)" d="${glyph}"/>`
    : `<text x="32" y="46" font-family="serif" font-style="italic" font-size="44" fill="#E9ECF2" text-anchor="middle">t</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111722"/>${mark}</svg>`;
}

// keep "</script" and "<!--" out of inline scripts
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

const DESC = 't 检验与自由度：为什么除以 n − 1，t 分布从哪里来。九节动画讲解。';
const body = `<noscript><p style="margin:40vh 0 0;text-align:center;color:#B9C0CE;font:16px sans-serif">这个页面需要启用 JavaScript 才能播放。</p></noscript>
<script>${safe(code)}</script>
<script>TPlayer.startPlayer({tex:${safe(texText.trim())},timeline:${safe(tlText.trim())},audio:${JSON.stringify(encodeURIComponent(audioName))}});</script>`;

// The claude.ai artifact host wraps the page in its own document, so that version has no
// <html>/<head>/<body> of its own. It also keeps the player clear of a phone's system bars
// and leaves a 16px gutter at the sides.
const ARTIFACT_CSS = `
.tp {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.tp-stage {
  --aw: calc(100vw - max(16px, env(safe-area-inset-left, 0px)) - max(16px, env(safe-area-inset-right, 0px)));
  --ah: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  width: min(var(--aw), var(--ah) * 16 / 9);
  height: min(var(--ah), var(--aw) * 9 / 16);
}`;

const html = artifact
  ? `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${DESC}">
<style>
${fontCSS}
</style>
<style>${css}${ARTIFACT_CSS}</style>
${body}
`
  : `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="${DESC}">
<title>${TITLE}</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon())}">
<style>
${fontCSS}
</style>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(htmlFile, html);

// ---- soundtrack ----
const fresh = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;
if (!fs.existsSync(audioSrc)) {
  console.warn(`! ${rel(audioSrc)} not found: the page will play without sound`);
} else if (artifact) {
  if (!fresh(audioOut, audioSrc) || process.argv.includes('--force')) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', audioSrc, '-vn', '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', audioOut], { stdio: 'inherit' });
  }
} else if (!fresh(audioOut, audioSrc) || fs.statSync(audioOut).size !== fs.statSync(audioSrc).size) {
  fs.copyFileSync(audioSrc, audioOut);
}

// ---- report ----
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const pageSize = fs.statSync(htmlFile).size;
const parts = [
  ['script', Buffer.byteLength(code)],
  ['style', Buffer.byteLength(css)],
  ['fonts', Buffer.byteLength(fontCSS)],
  ['tex.json', Buffer.byteLength(texText)],
  ['timeline.json', Buffer.byteLength(tlText)],
];
console.log(`${rel(htmlFile)}  ${mb(pageSize)}  (${parts.map(([k, v]) => `${k} ${(v / 1024).toFixed(0)} KB`).join(', ')})`);
if (fs.existsSync(audioOut)) {
  const aSize = fs.statSync(audioOut).size;
  let dur = NaN;
  try {
    dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioOut]).toString().trim();
  } catch {
    /* ffprobe missing */
  }
  console.log(`${rel(audioOut)}  ${mb(aSize)}  (${isFinite(dur) ? dur.toFixed(2) + ' s' : '?'}; timeline ${tl.total.toFixed(2)} s)`);
  if (isFinite(dur) && Math.abs(dur - tl.total) > 0.5) console.warn('! the soundtrack and the timeline differ in length: rebuild build/audio/mix.m4a (tools/mix.py)');
  if (artifact && aSize > LIMIT_AUDIO) console.warn(`! audio is over ${mb(LIMIT_AUDIO)}`);
}
if (artifact && pageSize > LIMIT_PAGE) console.warn(`! page is over ${mb(LIMIT_PAGE)}`);
