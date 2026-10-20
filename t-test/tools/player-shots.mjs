// Screenshots of the single-file player, for review.
//
//   node tools/bundle.mjs && node tools/player-shots.mjs [page.html] [--out out/player-shots]
//
// Opens the page from file:// in headless Chromium at 1920×1080 and 1280×720 and
// saves the start screen, playback with controls, scrub preview, chapter list, quiz
// card and dialog, speed menu, shortcuts, keyboard focus and hidden controls.
// Playwright's Chromium cannot decode AAC, so here the page runs on its silent
// clock; in a normal browser the m4a plays.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const file = path.resolve(args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || path.join(root, 'out/t检验与自由度.html'));
const outDir = path.resolve(opt('--out', path.join(root, 'out/player-shots')));
const sizes = [
  [1920, 1080],
  [1280, 720],
];
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems = [];
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`[${w}] page error: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${w}] console: ${m.text()}`));
  const shot = async (name) => {
    const f = path.join(outDir, `${w}x${h}-${name}.png`);
    await page.screenshot({ path: f });
    console.log(path.relative(root, f));
  };
  const ready = async () => {
    await page.waitForFunction(() => window.__tp && window.__tp.ready, null, { timeout: 120000 });
    await page.waitForTimeout(1300); // entrance animation of the start screen
  };
  const box = (sel) => page.locator(sel).first().boundingBox();
  const center = async (sel) => {
    const b = await box(sel);
    return [b.x + b.width / 2, b.y + b.height / 2];
  };

  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  await shot('a-start');

  // playing at 60 s, controls shown by moving the mouse
  await page.mouse.move(w * 0.5, h * 0.42);
  await page.evaluate(() => window.__tp.begin(60));
  await page.mouse.move(w * 0.52, h * 0.45, { steps: 4 });
  await page.waitForTimeout(600);
  await shot('b-playing');

  // hovering the progress bar: chapter tooltip and frame preview
  const tr = await box('.tp-track');
  await page.mouse.move(tr.x + tr.width * 0.155, tr.y + tr.height / 2, { steps: 6 });
  await page.waitForTimeout(450);
  await shot('c-scrub-preview');

  // chapter list
  await page.mouse.click(...(await center('[data-r="chBtn"]')));
  await page.waitForTimeout(450);
  await shot('d-chapters');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // quiz card at the end of a chapter
  await page.evaluate(() => window.__tp.showCard());
  await page.mouse.move(w * 0.4, h * 0.4, { steps: 3 });
  await page.waitForTimeout(800);
  await shot('e-quiz-card');

  // quiz dialog with the answer shown
  await page.mouse.click(...(await center('[data-r="cardGo"]')));
  await page.waitForTimeout(400);
  await page.locator('.tp-q-input').fill('平均值的方差是 σ²/5，比单个数据的方差小。');
  await page.mouse.click(...(await center('[data-r="qReveal"]')));
  await page.waitForTimeout(700);
  await shot('f-quiz-answer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);

  // speed menu
  await page.mouse.click(...(await center('[data-r="speedBtn"]')));
  await page.waitForTimeout(400);
  await shot('g-speed-menu');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // volume slider opens on hover
  await page.mouse.move(...(await center('[data-r="muteBtn"]')), { steps: 3 });
  await page.waitForTimeout(450);
  await shot('g2-volume');

  // keyboard focus ring + tooltip on a control
  await page.mouse.move(w * 0.5, h * 0.3);
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.waitForTimeout(350);
  await shot('h-focus');

  // shortcuts dialog
  await page.keyboard.press('Shift+Slash');
  await page.waitForTimeout(450);
  await shot('i-shortcuts');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // playing, mouse still: controls hide after 2.5 s
  await page.evaluate(() => {
    document.activeElement && document.activeElement.blur();
    window.__tp.seek(130);
    window.__tp.play();
  });
  await page.mouse.move(w * 0.6, h * 0.5, { steps: 2 });
  await page.waitForTimeout(3300);
  await shot('j-hidden');
  const st = await page.evaluate(() => window.__tp.state);
  if (st.ui) problems.push(`[${w}] controls did not hide`);

  // start screen offering to resume
  await page.evaluate(() => window.__tp.pause());
  await page.reload();
  await ready();
  await shot('k-resume');
  await ctx.close();
}
await browser.close();
if (problems.length) {
  console.log(problems.join('\n'));
  process.exitCode = 1;
}
