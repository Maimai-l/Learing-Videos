// Write the subtitles as an .srt file, with the same text and timing as the burned-in ones.
//   node tools/export-srt.mjs [out/t检验与自由度.srt]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const tl = JSON.parse(fs.readFileSync(path.join(root, 'build/timeline.json'), 'utf8'));
const out = path.resolve(root, process.argv[2] || 'out/t检验与自由度.srt');

const stamp = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  const p = (n, k = 2) => String(n).padStart(k, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(ms % 1000, 3)}`;
};

// the burned-in subtitle stays up 0.15 s past the end of its last word
const lines = tl.cues.map((c, i) => {
  const next = tl.cues[i + 1];
  const end = Math.min(c.g1 + 0.15, next ? next.g0 : Infinity);
  return `${i + 1}\n${stamp(c.g0)} --> ${stamp(end)}\n${c.text}\n`;
});
fs.writeFileSync(out, '﻿' + lines.join('\n'));
console.log(out, tl.cues.length, 'cues');
