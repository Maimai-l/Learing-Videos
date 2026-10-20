// Browser entry: load data and fonts, build the scenes, expose render(t).
import { setTexStore } from './engine/tex.js';
import { Narration } from './engine/narration.js';
import { createRenderer } from './engine/stage.js';
import { buildLayers } from './scenes/index.js';

export async function boot({ canvas, tex, timeline, debug = false }) {
  const [texJson, tl] = await Promise.all([
    typeof tex === 'string' ? fetch(tex).then((r) => r.json()) : tex,
    typeof timeline === 'string' ? fetch(timeline).then((r) => r.json()) : timeline,
  ]);
  setTexStore(texJson);
  // make sure every face is ready before the first frame is drawn
  const sample = '检验自由度平均值方差标准差一二三四五六七八九十μσν0123456789';
  await Promise.all([
    document.fonts.load(`400 32px "Noto Sans SC"`, sample),
    document.fonts.load(`500 32px "Noto Sans SC"`, sample),
    document.fonts.load(`700 32px "Noto Sans SC"`, sample),
    document.fonts.load(`600 32px "Noto Serif SC"`, sample),
    document.fonts.load(`400 32px "Noto Serif SC"`, sample),
  ]);
  await document.fonts.ready;
  const N = new Narration(tl);
  const layers = buildLayers(N);
  if (N.missing.length) console.warn('phrases not found:', N.missing);
  const render = createRenderer({ tl, layers, debug });
  const ctx = canvas.getContext('2d');
  // renderTo draws the same frame into another context (the player's scrub preview)
  return { tl, N, render: (t, o) => render(ctx, t, o), renderTo: (c, t, o) => render(c, t, o) };
}
