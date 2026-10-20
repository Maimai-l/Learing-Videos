// Render the video frame by frame and encode it with the soundtrack.
//
//   node tools/render.mjs --out out/preview.mp4 --from 0 --to 80 [--fps 60] [--workers 3]
//                         [--preview] [--audio build/audio/mix.m4a] [--crf 15]
//
// Each worker renders a contiguous range of frames in its own page and pipes PNG
// images straight into an ffmpeg process; the parts are joined without re-encoding.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { startServer } from './server.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const root = new URL('..', import.meta.url).pathname;
const tl = JSON.parse(fs.readFileSync(root + 'build/timeline.json', 'utf8'));
const fps = +(args.fps || 60);
const from = +(args.from || 0);
const to = Math.min(+(args.to || tl.total), tl.total);
const workers = +(args.workers || 3);
const preview = !!args.preview;
const out = path.resolve(args.out || 'out/video.mp4');
const audio = args.audio === 'none' ? null : path.resolve(root, args.audio || 'build/audio/mix.m4a');
const tmp = path.join(path.dirname(out), '.parts-' + path.basename(out, '.mp4'));
fs.mkdirSync(tmp, { recursive: true });

const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
const total = n1 - n0;
const per = Math.ceil(total / workers);
const { url, close } = await startServer();
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb'] });
const t0 = Date.now();
let done = 0;

const x264 = preview
  ? ['-preset', 'veryfast', '-crf', '20']
  : ['-preset', 'slow', '-crf', String(args.crf || 15), '-tune', 'animation'];

async function work(k) {
  const a = n0 + k * per, b = Math.min(n1, a + per);
  if (a >= b) return null;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(url + '/src/index.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 180000 });
  const part = path.join(tmp, `part${String(k).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', preview ? 'mjpeg' : 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', ...x264, '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-r', String(fps), part], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    const data = await page.evaluate(([t, preview]) => {
      window.renderAt(t);
      return document.getElementById('c').toDataURL(preview ? 'image/jpeg' : 'image/png', 0.93);
    }, [i / fps, preview]);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % (fps * 5) === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${((total - done) / (done / el) / 60).toFixed(1)} min   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return part;
}

const parts = (await Promise.all(Array.from({ length: workers }, (_, k) => work(k)))).filter(Boolean);
await browser.close();
close();
console.log(`\nrendered ${total} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min`);

fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
const muxArgs = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt')];
if (audio) muxArgs.push('-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
muxArgs.push('-c:v', 'copy', '-movflags', '+faststart', '-shortest', out);
execFileSync('ffmpeg', muxArgs);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(out, (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
