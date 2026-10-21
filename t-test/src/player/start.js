// "t 检验与自由度" in the shared player (player/ at the repository root).
//
//   startPlayer({ tex, timeline, audio, debug, at })
//     tex, timeline  URLs (dev page) or already parsed objects (single-file build)
//     audio          URL of the soundtrack, relative to the page
import { startPlayer as startShared } from '../../../player/player.js';
import { boot } from '../main.js';
import { QUIZZES } from './quizzes.js';

const QUIZ_AT = 0.3; // the quiz card shows 0.3 s after the chapter's last word

async function loadJSON(src) {
  if (typeof src !== 'string') return src;
  const r = await fetch(src);
  if (!r.ok) throw new Error(`${src}: ${r.status}`);
  return r.json();
}

// An inline formula from the glyph store as an SVG that sits on the text baseline
// (1000 units = 1 em of the surrounding text): the italic t in the title.
function texSVG(tex, key) {
  const f = tex && tex.formulas && tex.formulas[key];
  if (!f || !f.g || (f.txt && f.txt.length)) return null;
  const x0 = Math.min(0, f.x0 || 0);
  const w = f.w - x0, h = f.h + f.d;
  const paths = f.g.map((g) => `<path d="${tex.paths[g.p]}" transform="matrix(${g.m.join(' ')})"/>`).join('');
  return `<svg class="tp-tex" viewBox="${x0} ${-f.h} ${w} ${h}" style="width:${w / 1000}em;height:${h / 1000}em;vertical-align:${-f.d / 1000}em" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function startPlayer({ tex, timeline, audio, debug = false, at } = {}) {
  return startShared({
    title: 't 检验与自由度',
    storageKey: 't-test-player/v1',
    posterTime: -1, // before every layer: only the background behind the start screen
    width: 1920,
    height: 1080,
    audio,
    at,
    async load() {
      const [texJson, tl] = await Promise.all([loadJSON(tex), loadJSON(timeline)]);
      const app = await boot({ tex: texJson, timeline: tl, debug });
      const tT = texSVG(texJson, 'i|t') || '<i class="tp-tex-fallback">t</i>';
      return {
        titleHTML: `<span class="tp-title-t">${tT}</span><span class="tp-title-cn">检验与自由度</span>`,
        duration: tl.total,
        render: app.renderTo,
        chapters: tl.chapters.map((c, i) => ({
          title: c.title,
          label: c.cn,
          start: i === 0 ? 0 : c.g0,
          quizAt: Math.min(tl.total, c.g1 + QUIZ_AT),
        })),
        quizzes: QUIZZES,
      };
    },
  });
}
