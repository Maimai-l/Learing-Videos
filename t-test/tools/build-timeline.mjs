// Build build/timeline.json from the narration text, its character alignment and
// the subtitle segmentation in the SRT.
//
//   node tools/build-timeline.mjs
//
// Global time = time in the final video. The voice recording is cut between
// paragraphs and shifted so that the title card and the chosen pauses fit in.
import fs from 'node:fs';
import { CONFIG } from '../src/config.js';
import { toDisplay } from '../src/engine/subtitles.js';

const root = new URL('..', import.meta.url).pathname;
const align = JSON.parse(fs.readFileSync(root + 'build/align.json', 'utf8'));
const srt = fs.readFileSync(root + 'materials/旁白.srt', 'utf8');

const paras = align.paragraphs;
const compact = (s) => s.replace(/[\s，。、：；？！“”"（）()…,.;:?!]/g, '');

// ---- chapters ----
const chapterOf = [];
let ch = 0;
paras.forEach((p, i) => {
  const next = CONFIG.chapters[ch + 1];
  if (next && compact(p.text).startsWith(compact(next.start))) ch++;
  if (i === 0 && !compact(p.text).startsWith(compact(CONFIG.chapters[0].start))) throw new Error('first paragraph does not start chapter 1');
  chapterOf.push(ch);
});
if (ch !== CONFIG.chapters.length - 1) throw new Error('not all chapters found, last chapter index ' + ch);

// ---- voice span of every paragraph ----
const span = paras.map((p) => {
  const ts = p.chars.filter(Boolean);
  return [ts[0][0], ts[ts.length - 1][1]];
});

// cut points between paragraphs (voice time) and the extra pause added there
const cuts = [];
const v0 = Math.max(0, span[0][0] - CONFIG.lead);
let shift = CONFIG.title - v0; // global = voice + shift
const shifts = [];
for (let i = 0; i < paras.length; i++) {
  if (i > 0) {
    const cut = (span[i - 1][1] + span[i][0]) / 2;
    let pause = CONFIG.pauses[i] || 0; // after paragraph i (1-based i == index i-1)
    if (chapterOf[i] !== chapterOf[i - 1]) pause += CONFIG.chapterPause;
    shift += pause;
    cuts.push({ v: +cut.toFixed(3), pause: +pause.toFixed(3), g: +(cut + shift).toFixed(3) });
  }
  shifts.push(shift);
}
const vEnd = Math.min(span[span.length - 1][1] + 0.6, 1e9);
const total = +(vEnd + shifts[shifts.length - 1] + CONFIG.tail).toFixed(3);

const G = (i, v) => +(v + shifts[i]).toFixed(3);
const outParas = paras.map((p, i) => ({
  i,
  chapter: CONFIG.chapters[chapterOf[i]].n,
  text: p.text,
  g0: G(i, span[i][0]),
  g1: G(i, span[i][1]),
  chars: p.chars.map((c) => (c ? [G(i, c[0]), G(i, c[1])] : null)),
}));

// ---- subtitle cues: SRT text segmentation, retimed with the alignment ----
const cueTexts = srt.trim().split(/\n\s*\n/).map((b) => b.trim().split('\n').slice(2).join(''));
const flat = []; // compact chars of all paragraphs -> [para, charIndex]
outParas.forEach((p, pi) => {
  [...p.text].forEach((c, ci) => {
    if (compact(c)) flat.push([pi, ci, c]);
  });
});
let k = 0;
const cues = cueTexts.map((t) => {
  const ct = compact(t);
  const first = flat[k];
  for (const c of ct) {
    if (!flat[k] || flat[k][2] !== c) throw new Error(`subtitle text does not match narration near "${t}"`);
    k++;
  }
  const last = flat[k - 1];
  const P = outParas[first[0]];
  // first/last timed characters of the cue
  const startC = P.chars.slice(first[1]).find(Boolean);
  const Q = outParas[last[0]];
  const endC = Q.chars.slice(0, last[1] + 1).reverse().find(Boolean);
  return { g0: startC[0], g1: endC[1], tts: t, text: toDisplay(t), para: first[0] };
});
// smooth subtitle on/off: show slightly early, keep until the next cue when the gap is short
for (let i = 0; i < cues.length; i++) {
  const c = cues[i];
  c.g0 = +(c.g0 - 0.12).toFixed(3);
  const next = cues[i + 1];
  const hold = c.g1 + 0.35;
  c.g1 = +(next && next.g0 - 0.12 - hold < 0.5 ? next.g0 - 0.12 : hold).toFixed(3);
}

const chapters = CONFIG.chapters.map((c, ci) => {
  const ps = outParas.filter((p) => p.chapter === c.n);
  const prevEnd = ci > 0 ? outParas.filter((p) => p.chapter === c.n - 1).slice(-1)[0].g1 : 0;
  return { ...c, g0: +(ps[0].g0 - (ci > 0 ? Math.min(CONFIG.chapterPause, ps[0].g0 - prevEnd - 0.2) : 0)).toFixed(3), first: ps[0].g0, g1: ps[ps.length - 1].g1, paras: ps.map((p) => p.i) };
});

const out = { fps: CONFIG.fps, title: CONFIG.title, total, voice: { v0, vEnd: +vEnd.toFixed(3), shift0: +(CONFIG.title - v0).toFixed(3), cuts }, chapters, paragraphs: outParas, cues };
fs.writeFileSync(root + 'build/timeline.json', JSON.stringify(out));
console.log(`total ${total.toFixed(2)} s (${Math.floor(total / 60)}:${(total % 60).toFixed(1).padStart(4, '0')}), ${outParas.length} paragraphs, ${cues.length} cues`);
for (const c of chapters) console.log(`  ${c.cn} ${c.title.padEnd(10, '　')} ${c.g0.toFixed(2)} – ${c.g1.toFixed(2)}`);
