// Render chosen moments to PNG for review.
//   node tools/snap.mjs out/snaps 12.5 20 31.25 ...      (times in seconds)
//   node tools/snap.mjs out/snaps --range 6 20 0.5        (every 0.5 s from 6 to 20)
//   node tools/snap.mjs out/snaps --sheet 6 76 24          (contact sheet: 24 frames in 6..76)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';

const args = process.argv.slice(2);
const outDir = args.shift();
fs.mkdirSync(outDir, { recursive: true });
let times = [], sheet = null;
if (args[0] === '--range') {
  const [a, b, st] = args.slice(1).map(Number);
  for (let t = a; t <= b + 1e-9; t += st) times.push(+t.toFixed(3));
} else if (args[0] === '--sheet') {
  const [a, b, n] = args.slice(1).map(Number);
  for (let i = 0; i < n; i++) times.push(+(a + ((b - a) * i) / (n - 1)).toFixed(3));
  sheet = { n };
} else times = args.map(Number);

const { url, close } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.goto(url + '/src/index.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const files = [];
for (const t of times) {
  const data = await page.evaluate((t) => {
    window.renderAt(t);
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  const f = path.join(outDir, `t${t.toFixed(2).padStart(8, '0')}.png`);
  fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
  files.push(f);
}
await browser.close();
close();
if (sheet) {
  // tile into a contact sheet with ffmpeg (6 columns), each frame labelled with its time
  const cols = 4;
  const list = files.map((f) => `file '${path.resolve(f)}'`).join('\n');
  fs.writeFileSync(path.join(outDir, 'list.txt'), list);
  const { execFileSync } = await import('node:child_process');
  const rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(outDir, 'list.txt'),
    '-vf', `scale=640:-1,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', path.join(outDir, 'sheet.png')]);
  console.log(path.join(outDir, 'sheet.png'));
} else console.log(files.join('\n'));
