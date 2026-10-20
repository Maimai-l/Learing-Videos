// Compare TTS text converted for display against the storyboard's narration text.
import fs from 'node:fs';
import { toDisplay } from '../src/engine/subtitles.js';
const tts = fs.readFileSync(new URL('../materials/旁白.txt', import.meta.url), 'utf8').trim().split(/\n\s*\n/);
const sb = fs.readFileSync(new URL('../materials/分镜对照表.md', import.meta.url), 'utf8');
const ref = [...sb.matchAll(/\*\*旁白\*\*\s*\n\s*\n([^\n]+)/g)].map((m) => m[1].trim());
console.log('paragraphs', tts.length, 'storyboard narrations', ref.length);
const norm = (s) => s.replace(/\s+/g, '').replace(/x̄/g, '样本均值');
let bad = 0;
tts.forEach((p, i) => {
  const d = toDisplay(p);
  if (norm(d) !== norm(ref[i])) {
    bad++;
    const a = norm(d), b = norm(ref[i]);
    let k = 0; while (k < a.length && a[k] === b[k]) k++;
    console.log(`#${i + 1}\n  mine: …${a.slice(Math.max(0, k - 15), k + 25)}\n  ref : …${b.slice(Math.max(0, k - 15), k + 25)}`);
  }
});
console.log('mismatches', bad);
