// Collect every tex() used by the scenes and convert them to glyph data.
//   node tools/build-tex.mjs   ->  build/tex.json
import fs from 'node:fs';
import { GlyphStore } from './texlib.mjs';
import { texRequests } from '../src/engine/tex.js';
import { Narration } from '../src/engine/narration.js';
import { buildLayers } from '../src/scenes/index.js';

const root = new URL('..', import.meta.url).pathname;
const tl = JSON.parse(fs.readFileSync(root + 'build/timeline.json', 'utf8'));
const N = new Narration(tl);
buildLayers(N);
if (N.missing.length) console.warn('phrases not found in narration:', N.missing);
const store = new GlyphStore();
const reqs = [...texRequests().entries()];
for (const [key, { src, display }] of reqs) {
  try {
    await store.add(key, src, display);
  } catch (e) {
    console.error('TeX error in', src, e.message);
    process.exitCode = 1;
  }
}
fs.writeFileSync(root + 'build/tex.json', JSON.stringify(store.toJSON()));
console.log(`${reqs.length} formulas, ${store.paths.length} glyph outlines`);
